import io
import os
import tempfile
from datetime import datetime

import pandas as pd
import xlwings as xw

import banco
from graficos import gerar_graficos


AREAS = {
    "linguagens": "Linguagens",
    "humanas": "Ciências Humanas",
    "natureza": "Ciências da Natureza",
    "matematica": "Matemática",
    "redacao": "Redação"
}

# Dia de aplicação do ENEM em que cada área é feita
# (define qual taxa de abstenção aparece: dia 1 ou dia 2)
DIA_PROVA = {
    "linguagens": 1,
    "humanas": 1,
    "natureza": 2,
    "matematica": 2,
    "redacao": 1
}

# Mesmos nomes usados no dashboard do professor
COMPETENCIAS_REDACAO = [
    "Norma culta da língua escrita",
    "Compreensão do tema e repertório",
    "Argumentação",
    "Coesão textual",
    "Proposta de intervenção"
]

VINHO = (122, 31, 61)
VINHO_CLARO = (245, 235, 239)
BRANCO = (255, 255, 255)
CINZA_CLARO = (245, 245, 247)
CINZA_TEXTO = (100, 100, 100)


# ---------------------------------------------------------------------------
# FUNÇÕES COMUNS (reaproveitadas por todos os relatórios)
# ---------------------------------------------------------------------------

def formatar_cartao(aba, colunas, titulo, valor, formato=None):

    coluna_inicio, coluna_fim = colunas

    faixa_titulo = f"{coluna_inicio}6:{coluna_fim}6"
    faixa_valor = f"{coluna_inicio}7:{coluna_fim}8"

    aba.range(faixa_titulo).merge()
    aba.range(faixa_valor).merge()

    aba.range(faixa_titulo).value = titulo
    aba.range(f"{coluna_inicio}7").value = valor

    # Fundo do cartão
    aba.range(f"{coluna_inicio}6:{coluna_fim}8").color = CINZA_CLARO

    # Título
    aba.range(faixa_titulo).font.bold = True
    aba.range(faixa_titulo).font.size = 9
    aba.range(faixa_titulo).font.color = CINZA_TEXTO
    aba.range(faixa_titulo).api.HorizontalAlignment = -4108

    # Valor
    aba.range(faixa_valor).font.bold = True
    aba.range(faixa_valor).font.size = 18
    aba.range(faixa_valor).font.color = VINHO
    aba.range(faixa_valor).api.HorizontalAlignment = -4108
    aba.range(faixa_valor).api.VerticalAlignment = -4108

    # Formatação numérica aplicada somente à célula principal
    if formato is not None:
        aba.range(f"{coluna_inicio}7").api.NumberFormat = formato


def numero(valor):
    """Converte para float. None e NaN viram None."""
    if valor is None or pd.isna(valor):
        return None
    return float(valor)


def variacao_percentual(atual, base):
    """((atual - base) / base) * 100. Devolve 0.0 se não der para calcular."""
    if atual is None or not base:
        return 0.0
    return (atual - base) / base * 100


def valor_ou_nd(valor, divisor=1):
    """Para exibir no cartão: 'N/D' quando o dado não existe no banco."""
    if valor is None:
        return "N/D"
    return valor / divisor


def gerar_excel(preencher):
    """
    Cuida do ciclo de vida do Excel, igual para qualquer relatório:
    cria o arquivo temporário, abre o Excel, chama preencher(wb, pasta_graficos),
    salva, fecha tudo e devolve o arquivo em memória (BytesIO).
    """

    arquivo_temporario = tempfile.NamedTemporaryFile(
        suffix=".xlsx",
        delete=False
    )

    caminho_excel = arquivo_temporario.name
    arquivo_temporario.close()

    app = None
    wb = None

    try:

        app = xw.App(visible=False)
        app.display_alerts = False
        app.screen_updating = False

        wb = app.books.add()

        with tempfile.TemporaryDirectory() as pasta_graficos:

            preencher(wb, pasta_graficos)

            wb.save(caminho_excel)

        wb.close()
        wb = None

        app.quit()
        app = None

        with open(caminho_excel, "rb") as arquivo:
            conteudo = arquivo.read()

        return io.BytesIO(conteudo)

    finally:

        if wb is not None:
            try:
                wb.close()
            except Exception:
                pass

        if app is not None:
            try:
                app.quit()
            except Exception:
                pass

        if os.path.exists(caminho_excel):
            os.remove(caminho_excel)


# ---------------------------------------------------------------------------
# DADOS DE UMA ÁREA (banco -> dicionário que o graficos.py já entende)
# ---------------------------------------------------------------------------

def montar_dados_area(chave, historico, planejamento):
    """
    Recebe o DataFrame de banco.buscar_historico() e calcula, para uma área,
    os mesmos indicadores que o dashboard calcula no JavaScript.
    """

    sufixo = banco.COLUNAS_AREA[chave]

    serie_municipio = historico[f"municipio_{sufixo}"]
    serie_estado = historico[f"estado_{sufixo}"]

    media_atual = numero(serie_municipio.iloc[-1])
    media_inicial = numero(serie_municipio.iloc[0])
    estado_atual = numero(serie_estado.iloc[-1])

    dia = DIA_PROVA[chave]
    abstencao = numero(historico[f"taxa_abstencao_dia{dia}"].iloc[-1])

    kpis = {
        "media": media_atual,
        "abstencao": abstencao,
        "evolucao": variacao_percentual(media_atual, media_inicial),
        "diferencial": variacao_percentual(media_atual, estado_atual),
        "eventosCadastrados": planejamento["cadastrados"],
        "metaEventos": planejamento["meta"],
        "diaProva": dia
    }

    lista_historico = []

    for ano, municipio, estado in zip(
        historico["ano"], serie_municipio, serie_estado
    ):
        lista_historico.append({
            "ano": int(ano),
            "municipio": numero(municipio),
            "estado": numero(estado)
        })

    dados_area = {
        "kpis": kpis,
        "historico": lista_historico,
        "anos": (int(historico["ano"].iloc[0]), int(historico["ano"].iloc[-1]))
    }

    # Exclusivo da Redação: competências e gargalo
    if chave == "redacao":

        ultimo = historico.iloc[-1]

        notas = [
            numero(ultimo[f"media_comp{i}"]) or 0.0
            for i in range(1, 6)
        ]

        dados_area["competencias"] = [
            {"nome": f"Comp. {i + 1}", "pontuacao": nota}
            for i, nota in enumerate(notas)
        ]

        indice_gargalo = notas.index(min(notas))

        dados_area["gargalo"] = {
            "titulo": f"Competência {indice_gargalo + 1}",
            "descricao": COMPETENCIAS_REDACAO[indice_gargalo],
            "pontuacao": notas[indice_gargalo]
        }

    return dados_area


# ---------------------------------------------------------------------------
# UMA ABA DE ÁREA (a mesma para qualquer relatório que mostre áreas do ENEM)
# ---------------------------------------------------------------------------

def criar_aba_area(wb, indice, chave, nome_aba, dados_area, cabecalho,
                   pasta_graficos):
    """
    cabecalho = {"subtitulo": "...", "rodape": "..."}
    """

    if indice == 0:
        aba = wb.sheets[0]
        aba.name = nome_aba
    else:
        aba = wb.sheets.add(nome_aba)

    kpis = dados_area["kpis"]
    ano_inicial, ano_final = dados_area["anos"]

    # CONFIGURAÇÃO VISUAL DA ABA

    aba.activate()

    aba.api.Application.ActiveWindow.DisplayGridlines = False
    aba.api.Application.ActiveWindow.Zoom = 90

    aba.range("B:K").column_width = 13
    aba.range("1:1").row_height = 8
    aba.range("2:3").row_height = 25
    aba.range("4:4").row_height = 24
    aba.range("5:5").row_height = 12
    aba.range("6:6").row_height = 23
    aba.range("7:8").row_height = 27
    aba.range("9:10").row_height = 10

    # Fundo geral
    aba.range("A1:L52").color = BRANCO

    # CABEÇALHO

    aba.range("B2:K3").merge()

    aba.range("B2").value = f"GROWTHMAP  |  {nome_aba.upper()}"

    aba.range("B2:K3").color = VINHO
    aba.range("B2").font.bold = True
    aba.range("B2").font.size = 20
    aba.range("B2").font.color = BRANCO
    aba.range("B2").api.VerticalAlignment = -4108

    # Subtítulo
    aba.range("B4:K4").merge()
    aba.range("B4").value = cabecalho["subtitulo"]
    aba.range("B4").font.size = 10
    aba.range("B4").font.color = CINZA_TEXTO

    # Rodapé do cabeçalho (unidade, data de geração)
    aba.range("B5:K5").merge()
    aba.range("B5").value = cabecalho["rodape"]
    aba.range("B5").font.size = 8
    aba.range("B5").font.italic = True
    aba.range("B5").font.color = CINZA_TEXTO

    # INDICADORES

    formatar_cartao(
        aba, ("B", "C"),
        "MÉDIA DE DESEMPENHO",
        valor_ou_nd(kpis["media"]),
        "0.00"
    )

    formatar_cartao(
        aba, ("D", "E"),
        "TAXA DE ABSTENÇÃO",
        valor_ou_nd(kpis["abstencao"], 100),
        "0.0%"
    )

    formatar_cartao(
        aba, ("F", "G"),
        f"EVOLUÇÃO {ano_inicial}–{ano_final}",
        kpis["evolucao"] / 100,
        "+0.00%;-0.00%;0.00%"
    )

    formatar_cartao(
        aba, ("H", "I"),
        "DIFERENCIAL REGIONAL",
        kpis["diferencial"] / 100,
        "+0.00%;-0.00%;0.00%"
    )

    formatar_cartao(
        aba, ("J", "K"),
        "EVENTOS CADASTRADOS",
        f"{kpis['eventosCadastrados']} / {kpis['metaEventos']}"
    )

    # INFORMAÇÃO DO DIA DE PROVA

    aba.range("B9:K9").merge()

    aba.range("B9").value = (
        f"Taxa de abstenção referente ao "
        f"{kpis['diaProva']}º dia de prova"
    )

    aba.range("B9").font.size = 9
    aba.range("B9").font.italic = True
    aba.range("B9").font.color = CINZA_TEXTO

    # GRÁFICOS

    caminhos = gerar_graficos(chave, dados_area, pasta_graficos)

    aba.pictures.add(
        caminhos["progresso"],
        name=f"Progresso_{chave}",
        left=aba.range("B11").left,
        top=aba.range("B11").top,
        width=330,
        height=250
    )

    aba.pictures.add(
        caminhos["historico"],
        name=f"Historico_{chave}",
        left=aba.range("F11").left,
        top=aba.range("F11").top,
        width=520,
        height=250
    )

    # EXCLUSIVO DA REDAÇÃO: faixa de gargalo + gráfico de competências

    if chave == "redacao":

        gargalo = dados_area["gargalo"]

        aba.range("B28:K28").merge()
        aba.range("28:28").row_height = 24

        aba.range("B28").value = (
            f"GARGALO NA REDAÇÃO:  {gargalo['titulo']} - "
            f"{gargalo['descricao']} "
            f"({gargalo['pontuacao']:.1f} pts)"
        )

        aba.range("B28:K28").color = VINHO_CLARO
        aba.range("B28").font.bold = True
        aba.range("B28").font.size = 10
        aba.range("B28").font.color = VINHO
        aba.range("B28").api.HorizontalAlignment = -4108
        aba.range("B28").api.VerticalAlignment = -4108

        aba.pictures.add(
            caminhos["competencias"],
            name="Competencias_Redacao",
            left=aba.range("B30").left,
            top=aba.range("B30").top,
            width=850,
            height=280
        )


# ---------------------------------------------------------------------------
# RELATÓRIO DO PROFESSOR
# ---------------------------------------------------------------------------

def gerar_relatorio_professor(id_usuario, co_municipio=None):

    usuario = banco.buscar_usuario(id_usuario)

    if usuario is None:
        raise PermissionError("Usuário não encontrado.")

    if usuario["cargo"].strip().lower() != "professor":
        raise PermissionError(
            "Este relatório é exclusivo para professores."
        )

    # Município: o escolhido na tela ou, se não veio, o da unidade
    if co_municipio is None:

        municipio = {
            "co_municipio": usuario["co_municipio"],
            "nome_municipio": usuario["nome_municipio"],
            "uf": usuario["uf"]
        }

    else:

        municipio = banco.buscar_municipio(co_municipio)

        if municipio is None:
            raise ValueError("Município não encontrado.")

    historico = banco.buscar_historico(municipio["co_municipio"])

    if historico.empty:
        raise ValueError(
            "Não há dados de desempenho para este município."
        )

    planejamento = banco.buscar_planejamento(usuario["id_unidade"])

    cabecalho = {
        "subtitulo": (
            f"Desempenho de {municipio['nome_municipio']} - "
            f"{municipio['uf']}"
        ),
        "rodape": (
            f"Unidade: {usuario['nome_unidade']}  |  "
            f"Planejamento: {planejamento['ano']}/"
            f"{planejamento['semestre']}º semestre  |  "
            f"Gerado em {datetime.now():%d/%m/%Y %H:%M}"
        )
    }

    def preencher(wb, pasta_graficos):

        for indice, (chave, nome_aba) in enumerate(AREAS.items()):

            dados_area = montar_dados_area(chave, historico, planejamento)

            criar_aba_area(
                wb, indice, chave, nome_aba,
                dados_area, cabecalho, pasta_graficos
            )

    return gerar_excel(preencher)


# ---------------------------------------------------------------------------
# PONTO DE ENTRADA (chamado pelo api.py)
# ---------------------------------------------------------------------------

def gerar_relatorio(tipo, id_usuario, co_municipio=None):

    if tipo == "professor":
        return gerar_relatorio_professor(id_usuario, co_municipio)

    if tipo in ("diretor", "coordenador"):
        raise NotImplementedError(
            f"O relatório do {tipo} ainda não foi implementado."
        )

    raise ValueError(f"Tipo de relatório desconhecido: {tipo}")
