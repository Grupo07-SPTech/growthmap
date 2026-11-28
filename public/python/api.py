"""
API Flask para download dos relatórios Simbiose.
"""

import hashlib
import hmac
import os
import time
import traceback

from flask import Flask, request, send_file, jsonify
from banco import carregar_env
from simbiose import gerar_relatorio

carregar_env()
app = Flask(__name__)


@app.after_request
def configurar_cors(resposta):
    origem = os.environ.get("CORS_ORIGIN", "*")
    resposta.headers["Access-Control-Allow-Origin"] = origem
    resposta.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resposta.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    return resposta


def validar_token(token):
    segredo = os.environ.get("RELATORIO_SEGREDO", "")
    if not segredo:
        raise PermissionError("Servidor sem RELATORIO_SEGREDO configurado.")
    try:
        id_usuario, expira, assinatura = token.split(".")
        base = f"{id_usuario}.{expira}"
        esperada = hmac.new(segredo.encode(), base.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(assinatura, esperada) or int(expira) < time.time():
            raise ValueError
        return int(id_usuario)
    except (ValueError, TypeError):
        raise PermissionError("Token inválido ou expirado.")


def identificar_usuario():
    token = request.args.get("token")
    if token:
        return validar_token(token)
    if os.environ.get("SIMBIOSE_DEV") == "1":
        try:
            return int(request.args.get("idUsuario", ""))
        except ValueError:
            raise PermissionError("Informe idUsuario no modo de desenvolvimento.")
    raise PermissionError("Autenticação necessária.")


@app.route("/gerar-relatorio", methods=["GET", "OPTIONS"])
def gerar_excel():
    if request.method == "OPTIONS":
        return "", 204
    try:
        tipo = request.args.get("tipo", "").strip().lower()
        if not tipo:
            raise ValueError("Informe tipo.")
        id_usuario = identificar_usuario()
        id_unidade = request.args.get("id_unidade")
        if id_unidade:
            id_unidade = int(id_unidade)
        arquivo = gerar_relatorio(tipo, id_usuario, id_unidade)
        nome = f"GrowthMap_{tipo}.xlsx"
        return send_file(
            arquivo, as_attachment=True, download_name=nome,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400
    except PermissionError as erro:
        return jsonify({"erro": str(erro)}), 403
    except Exception:
        traceback.print_exc()
        return jsonify({"erro": "Erro interno ao gerar o relatório."}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
