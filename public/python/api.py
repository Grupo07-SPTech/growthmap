import hashlib
import hmac
import os
import time
import traceback

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

from simbiose import gerar_relatorio


app = Flask(__name__)

# CORS para desenvolvimento
CORS(app)


def validar_token(token):
    """
    O token é gerado pelo backend do GrowthMap (Node) e tem o formato:

        idUsuario.expiraEmSegundos.assinatura

    onde assinatura = HMAC-SHA256("idUsuario.expiraEmSegundos", segredo).
    Só quem conhece o segredo (RELATORIO_SEGREDO) consegue gerar um token
    válido, então o navegador não consegue trocar o ID por outro.
    """

    segredo = os.environ.get("RELATORIO_SEGREDO", "")

    if not segredo:
        raise PermissionError(
            "Servidor sem RELATORIO_SEGREDO configurado."
        )

    try:
        id_usuario, expira, assinatura = token.split(".")

        base = f"{id_usuario}.{expira}"

        esperada = hmac.new(
            segredo.encode(),
            base.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(assinatura, esperada):
            raise ValueError

        if int(expira) < time.time():
            raise ValueError

        return int(id_usuario)

    except ValueError:
        raise PermissionError("Token inválido ou expirado.")


def identificar_usuario():
    """Descobre quem está pedindo o relatório."""

    token = request.args.get("token")

    if token:
        return validar_token(token)

    # SOMENTE PARA TESTES LOCAIS (defina SIMBIOSE_DEV=1 no .env).
    # Nunca deixe isso ligado em produção: aceita qualquer ID.
    if os.environ.get("SIMBIOSE_DEV") == "1":

        try:
            return int(request.args.get("idUsuario", ""))
        except ValueError:
            raise PermissionError("Informe idUsuario (modo de teste).")

    raise PermissionError("Autenticação necessária.")


@app.route("/gerar-relatorio", methods=["GET"])
def gerar_excel():

    try:

        tipo = request.args.get("tipo", "").strip().lower()

        if not tipo:
            raise ValueError("Informe o tipo do relatório.")

        co_municipio = request.args.get("co_municipio")

        if co_municipio:
            try:
                co_municipio = int(co_municipio)
            except ValueError:
                raise ValueError("co_municipio inválido.")
        else:
            co_municipio = None

        id_usuario = identificar_usuario()

        arquivo_excel = gerar_relatorio(tipo, id_usuario, co_municipio)

        return send_file(
            arquivo_excel,
            as_attachment=True,
            download_name=f"GrowthMap_Relatorio_{tipo.capitalize()}.xlsx",
            mimetype=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        )

    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    except PermissionError as erro:
        return jsonify({"erro": str(erro)}), 403

    except NotImplementedError as erro:
        return jsonify({"erro": str(erro)}), 501

    except Exception:
        traceback.print_exc()
        return jsonify({"erro": "Erro interno ao gerar o relatório."}), 500


if __name__ == "__main__":

    # threaded=False: atende um pedido por vez. O Excel (xlwings) não lida
    # bem com vários pedidos simultâneos em threads diferentes.
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False,
        threaded=False
    )
