"""
banco.py - Conexão com o MySQL e consultas reutilizáveis da Simbiose.

Este arquivo só BUSCA dados. Cálculos (evolução, diferencial, gargalo...)
ficam no simbiose.py.

Configuração: defina as variáveis de ambiente abaixo (ou um arquivo .env
na mesma pasta, se tiver instalado o python-dotenv):

    DB_HOST      (padrão: 127.0.0.1)
    DB_PORT      (padrão: 3306)
    DB_USER      (padrão: root)
    DB_PASSWORD  (sem padrão - nunca coloque a senha no código)
    DB_NAME      (padrão: growthmap)
"""

import os
from datetime import date

import pandas as pd
import pymysql

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # sem python-dotenv, usa só as variáveis de ambiente do sistema


# As 5 áreas do ENEM: chave usada no sistema -> sufixo da coluna no banco
# (desempenho_regional.media_XX e desempenho_estadual.media_XX)
COLUNAS_AREA = {
    "linguagens": "lc",
    "humanas": "ch",
    "natureza": "cn",
    "matematica": "mt",
    "redacao": "redacao",
}


# ---------------------------------------------------------------------------
# CONEXÃO E EXECUÇÃO
# ---------------------------------------------------------------------------

def conectar():
    """Abre uma conexão nova com o MySQL."""
    return pymysql.connect(
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("DB_PORT", 3306)),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "growthmap"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def consultar(sql, parametros=None):
    """
    Executa um SELECT e devolve um DataFrame do Pandas.
    Sempre usa %s + parametros (nunca monte SQL com f-string),
    o que evita SQL Injection. A conexão é sempre fechada.
    """
    conexao = conectar()
    try:
        with conexao.cursor() as cursor:
            cursor.execute(sql, parametros or ())
            linhas = cursor.fetchall()
        return pd.DataFrame(linhas)
    finally:
        conexao.close()


# ---------------------------------------------------------------------------
# CONSULTAS REUTILIZÁVEIS (servem aos três dashboards)
# ---------------------------------------------------------------------------

def buscar_usuario(id_usuario):
    """
    Dados do usuário + cargo + unidade + município da unidade.
    Devolve um dicionário, ou None se o usuário não existir.
    """
    sql = """
        SELECT u.id            AS id_usuario,
               u.nome          AS nome_usuario,
               c.nome          AS cargo,
               un.id           AS id_unidade,
               un.nome         AS nome_unidade,
               un.id_empresa   AS id_empresa,
               m.co_municipio  AS co_municipio,
               m.nome_municipio AS nome_municipio,
               m.uf            AS uf
        FROM usuario u
        JOIN cargo c      ON c.id_cargo = u.fk_cargo
        JOIN unidade un   ON un.id = u.id_unidade
        JOIN municipio m  ON m.co_municipio = un.co_municipio
        WHERE u.id = %s
    """
    df = consultar(sql, (id_usuario,))
    if df.empty:
        return None
    return df.iloc[0].to_dict()


def buscar_municipio(co_municipio):
    """Nome e UF de um município. Devolve None se não existir."""
    sql = """
        SELECT co_municipio, nome_municipio, uf
        FROM municipio
        WHERE co_municipio = %s
    """
    df = consultar(sql, (co_municipio,))
    if df.empty:
        return None
    return df.iloc[0].to_dict()


def buscar_historico(co_municipio, qtd_anos=3):
    """
    Histórico município x estado, um registro por ano (últimos qtd_anos).

    Colunas devolvidas (mesmos nomes que o dashboard já usa):
      ano,
      municipio_lc, municipio_ch, municipio_cn, municipio_mt, municipio_redacao,
      estado_lc,    estado_ch,    estado_cn,    estado_mt,    estado_redacao,
      media_comp1 ... media_comp5   (competências da redação, do município),
      taxa_abstencao_dia1, taxa_abstencao_dia2   (do município)
    """
    sql = """
        SELECT r.ano,
               r.media_lc        AS municipio_lc,
               r.media_ch        AS municipio_ch,
               r.media_cn        AS municipio_cn,
               r.media_mt        AS municipio_mt,
               r.media_redacao   AS municipio_redacao,
               e.media_lc        AS estado_lc,
               e.media_ch        AS estado_ch,
               e.media_cn        AS estado_cn,
               e.media_mt        AS estado_mt,
               e.media_redacao   AS estado_redacao,
               r.media_comp1, r.media_comp2, r.media_comp3,
               r.media_comp4, r.media_comp5,
               r.taxa_abstencao_dia1,
               r.taxa_abstencao_dia2
        FROM desempenho_regional r
        JOIN municipio m ON m.co_municipio = r.co_municipio
        LEFT JOIN desempenho_estadual e
               ON e.uf = m.uf AND e.ano = r.ano
        WHERE r.co_municipio = %s
        ORDER BY r.ano
    """
    df = consultar(sql, (co_municipio,))

    if df.empty:
        return df

    # Uma linha por ano (a tabela estadual não tem restrição de unicidade)
    df = df.drop_duplicates(subset="ano", keep="last")

    # O MySQL devolve DECIMAL como Decimal; converte tudo para número comum
    for coluna in df.columns:
        df[coluna] = pd.to_numeric(df[coluna])

    return df.tail(qtd_anos).reset_index(drop=True)


def periodo_atual():
    """(ano, semestre) de hoje. Semestre 1 = jan-jun, semestre 2 = jul-dez."""
    hoje = date.today()
    return hoje.year, (1 if hoje.month <= 6 else 2)


def buscar_planejamento(id_unidade, ano=None, semestre=None):
    """
    Meta e eventos cadastrados de uma unidade em um ano/semestre.
    Devolve {"cadastrados": int, "meta": int, "ano": int, "semestre": int}.

    ATENÇÃO - DUAS SUPOSIÇÕES (confirmar com o seu backend Node):
      1) "Eventos cadastrados" = todos os eventos dos usuários da unidade
         cuja data cai no ano/semestre (não filtra por evento.feita).
      2) Sem meta cadastrada, usa 10 (padrão da coluna meta_eventos).
    """
    if ano is None or semestre is None:
        ano, semestre = periodo_atual()

    df_meta = consultar(
        """
        SELECT meta_eventos
        FROM meta_planejamento
        WHERE id_unidade = %s AND ano = %s AND semestre = %s
        LIMIT 1
        """,
        (id_unidade, ano, semestre),
    )
    meta = int(df_meta.iloc[0]["meta_eventos"]) if not df_meta.empty else 10

    df_eventos = consultar(
        """
        SELECT COUNT(*) AS total
        FROM evento ev
        JOIN usuario u ON u.id = ev.fk_usuario
        WHERE u.id_unidade = %s
          AND YEAR(ev.data) = %s
          AND CASE WHEN MONTH(ev.data) <= 6 THEN 1 ELSE 2 END = %s
        """,
        (id_unidade, ano, semestre),
    )
    cadastrados = int(df_eventos.iloc[0]["total"])

    return {
        "cadastrados": cadastrados,
        "meta": meta,
        "ano": ano,
        "semestre": semestre,
    }


# ---------------------------------------------------------------------------
# TESTE RÁPIDO:  python banco.py 1     (1 = id de um usuário existente)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    id_teste = int(sys.argv[1]) if len(sys.argv) > 1 else 1

    usuario = buscar_usuario(id_teste)
    print("USUÁRIO:", usuario)

    if usuario:
        print("\nHISTÓRICO:")
        print(buscar_historico(usuario["co_municipio"]).to_string())
        print("\nPLANEJAMENTO:", buscar_planejamento(usuario["id_unidade"]))
