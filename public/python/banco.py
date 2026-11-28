"""
Consultas do banco GrowthMap e validação do escopo de acesso.
"""

import os
from datetime import date
import pymysql


def carregar_env():
    caminho = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(caminho):
        return
    with open(caminho, "r", encoding="utf-8") as arquivo:
        for linha in arquivo:
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha:
                continue
            chave, valor = linha.split("=", 1)
            os.environ.setdefault(chave.strip(), valor.strip().strip('"').strip("'"))


carregar_env()

AREAS = {
    "Linguagens": "lc",
    "Ciências Humanas": "ch",
    "Ciências da Natureza": "cn",
    "Matemática": "mt",
    "Redação": "redacao",
}


def conectar():
    senha = os.environ.get("DB_PASSWORD")
    if senha is None:
        raise RuntimeError("Configure DB_PASSWORD no arquivo .env.")
    return pymysql.connect(
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=senha,
        database=os.environ.get("DB_NAME", "growthmap"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def consultar(sql, parametros=()):
    conexao = conectar()
    try:
        with conexao.cursor() as cursor:
            cursor.execute(sql, parametros)
            return cursor.fetchall()
    finally:
        conexao.close()


def buscar_usuario(id_usuario):
    sql = """
        SELECT u.id AS id_usuario, u.nome AS nome_usuario, u.email,
               c.nome AS cargo, c.nivel_acesso,
               un.id AS id_unidade, un.nome AS nome_unidade,
               un.id_empresa, un.co_municipio,
               m.nome_municipio, m.uf
        FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        JOIN unidade un ON un.id = u.id_unidade
        JOIN municipio m ON m.co_municipio = un.co_municipio
        WHERE u.id = %s
    """
    linhas = consultar(sql, (id_usuario,))
    return linhas[0] if linhas else None


def buscar_escopo_usuario(id_usuario):
    usuario = buscar_usuario(id_usuario)
    if not usuario:
        raise PermissionError("Usuário não encontrado ou sem unidade vinculada.")

    cargo = usuario["cargo"].strip().casefold()
    if cargo == "diretor geral":
        escopo = "empresa"
    elif cargo == "coordenador":
        escopo = "unidade"
    elif cargo == "professor":
        escopo = "individual"
    else:
        raise PermissionError("Cargo sem permissão para gerar relatórios.")

    return {"usuario": usuario, "escopo": escopo}


def buscar_historico(co_municipio, limite=5):
    sql = """
        SELECT r.ano,
               r.media_lc AS municipio_lc, r.media_ch AS municipio_ch,
               r.media_cn AS municipio_cn, r.media_mt AS municipio_mt,
               r.media_redacao AS municipio_redacao,
               e.media_lc AS estado_lc, e.media_ch AS estado_ch,
               e.media_cn AS estado_cn, e.media_mt AS estado_mt,
               e.media_redacao AS estado_redacao,
               r.media_comp1, r.media_comp2, r.media_comp3,
               r.media_comp4, r.media_comp5,
               r.taxa_abstencao_dia1, r.taxa_abstencao_dia2,
               r.qtd_inscritos, r.qtd_participantes
        FROM desempenho_regional r
        JOIN municipio m ON m.co_municipio = r.co_municipio
        LEFT JOIN desempenho_estadual e ON e.uf = m.uf AND e.ano = r.ano
        WHERE r.co_municipio = %s
        ORDER BY r.ano DESC
        LIMIT %s
    """
    linhas = consultar(sql, (co_municipio, int(limite)))
    return list(reversed(linhas))


def buscar_unidades_empresa(id_empresa):
    return consultar("""
        SELECT un.id, un.nome, un.co_municipio,
               m.nome_municipio, m.uf
        FROM unidade un
        JOIN municipio m ON m.co_municipio = un.co_municipio
        WHERE un.id_empresa = %s
        ORDER BY un.nome
    """, (id_empresa,))


def validar_unidade_empresa(id_unidade, id_empresa):
    linhas = consultar("""
        SELECT un.id, un.nome, un.id_empresa, un.co_municipio,
               m.nome_municipio, m.uf
        FROM unidade un
        JOIN municipio m ON m.co_municipio = un.co_municipio
        WHERE un.id = %s AND un.id_empresa = %s
    """, (id_unidade, id_empresa))
    if not linhas:
        raise PermissionError("Unidade inexistente ou fora da empresa do diretor.")
    return linhas[0]


def buscar_eventos_unidade(id_unidade, ano=None):
    if ano is None:
        ano = date.today().year
    return consultar("""
        SELECT ev.id, ev.tipo, ev.nome, ev.area, ev.data, ev.rotulo,
               ev.feita, u.id AS id_usuario, u.nome AS professor
        FROM evento ev
        JOIN usuario u ON u.id = ev.fk_usuario
        WHERE u.id_unidade = %s AND YEAR(ev.data) = %s
        ORDER BY ev.data DESC, ev.id DESC
    """, (id_unidade, ano))


def buscar_eventos_empresa(id_empresa, ano=None):
    if ano is None:
        ano = date.today().year
    return consultar("""
        SELECT ev.id, ev.tipo, ev.nome, ev.area, ev.data, ev.rotulo,
               ev.feita, u.id AS id_usuario, u.nome AS professor,
               un.id AS id_unidade, un.nome AS nome_unidade
        FROM evento ev
        JOIN usuario u ON u.id = ev.fk_usuario
        JOIN unidade un ON un.id = u.id_unidade
        WHERE un.id_empresa = %s AND YEAR(ev.data) = %s
        ORDER BY ev.data DESC, ev.id DESC
    """, (id_empresa, ano))


def buscar_usuarios_unidade(id_unidade):
    return consultar("""
        SELECT u.id, u.nome, c.nome AS cargo
        FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        WHERE u.id_unidade = %s
        ORDER BY c.nome, u.nome
    """, (id_unidade,))


def buscar_planejamento_unidade(id_unidade, ano=None, semestre=None):
    hoje = date.today()
    ano = ano or hoje.year
    semestre = semestre or (1 if hoje.month <= 6 else 2)
    metas = consultar("""
        SELECT meta_eventos FROM meta_planejamento
        WHERE id_unidade = %s AND ano = %s AND semestre = %s
        LIMIT 1
    """, (id_unidade, ano, semestre))
    meta = int(metas[0]["meta_eventos"]) if metas else 10
    eventos = consultar("""
        SELECT COUNT(*) AS total
        FROM evento ev JOIN usuario u ON u.id = ev.fk_usuario
        WHERE u.id_unidade = %s AND YEAR(ev.data) = %s
          AND CASE WHEN MONTH(ev.data) <= 6 THEN 1 ELSE 2 END = %s
    """, (id_unidade, ano, semestre))
    return {
        "cadastrados": int(eventos[0]["total"]),
        "meta": meta, "ano": ano, "semestre": semestre
    }


def buscar_planejamento_empresa(id_empresa, ano=None, semestre=None):
    unidades = buscar_unidades_empresa(id_empresa)
    return [
        {"unidade": un["nome"],
         **buscar_planejamento_unidade(un["id"], ano, semestre)}
        for un in unidades
    ]


if __name__ == "__main__":
    import sys
    uid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    escopo = buscar_escopo_usuario(uid)
    print("ESCOPO:", escopo)
    print("UNIDADES DA EMPRESA:", buscar_unidades_empresa(escopo["usuario"]["id_empresa"]))
