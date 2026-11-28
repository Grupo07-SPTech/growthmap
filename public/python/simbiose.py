"""
GrowthMap - geração dos relatórios XLSX com gráficos Matplotlib.

Compatível com o banco.py atual:
- buscar_usuario / buscar_escopo_usuario
- buscar_historico
- buscar_unidades_empresa / validar_unidade_empresa
- buscar_eventos_unidade / buscar_eventos_empresa
- buscar_usuarios_unidade
- buscar_planejamento_unidade / buscar_planejamento_empresa

Os gráficos são gerados como PNG em memória e incorporados ao XLSX.
"""

from datetime import datetime, date
from io import BytesIO
from statistics import mean

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from openpyxl import Workbook
from openpyxl.drawing.image import Image as ExcelImage
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

import banco

VINHO = "#7A1F3D"
VINHO_CLARO = "#F5EBEF"
CINZA = "#666666"
CINZA_CLARO = "#F3F4F6"
CINZA_BORDA = "#E5E7EB"
VERDE = "#3D8B72"
LARANJA = "#D97706"
VERMELHO = "#C94C4C"
BRANCO = "#FFFFFF"

AREAS = {
    "Linguagens": "lc",
    "Ciências Humanas": "ch",
    "Ciências da Natureza": "cn",
    "Matemática": "mt",
    "Redação": "redacao",
}
AREAS_OBJETIVAS = [
    "Linguagens",
    "Ciências Humanas",
    "Ciências da Natureza",
    "Matemática",
]
SUFIXOS = {v: k for k, v in AREAS.items()}
COMPETENCIAS = [
    "Norma culta",
    "Compreensão do tema",
    "Argumentação",
    "Coesão textual",
    "Intervenção",
]


# ---------------------------------------------------------------------
# Formatação e utilitários
# ---------------------------------------------------------------------


def n(valor):
    """Converte valores do MySQL para float sem transformar NULL em zero."""
    return None if valor is None else float(valor)


def media(valores):
    validos = [float(v) for v in valores if v is not None]
    return mean(validos) if validos else None


def fmt(valor, casas=1, sufixo=""):
    if valor is None:
        return "N/D"
    return (
        f"{valor:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")
        + sufixo
    )


def pct(valor, casas=1):
    return fmt(valor, casas, "%")


def diferenca(a, b):
    if a is None or b is None:
        return None
    return a - b


def normalizar_area(valor):
    if not valor:
        return None
    texto = str(valor).strip().casefold()
    aliases = {
        "lc": "Linguagens",
        "linguagens": "Linguagens",
        "ch": "Ciências Humanas",
        "humanas": "Ciências Humanas",
        "ciências humanas": "Ciências Humanas",
        "cn": "Ciências da Natureza",
        "natureza": "Ciências da Natureza",
        "ciências da natureza": "Ciências da Natureza",
        "mt": "Matemática",
        "matematica": "Matemática",
        "matemática": "Matemática",
        "redacao": "Redação",
        "redação": "Redação",
    }
    return aliases.get(texto, str(valor).strip())


def criar_workbook(titulo):
    wb = Workbook()
    ws = wb.active
    ws.title = titulo[:31]
    ws.sheet_view.showGridLines = False
    return wb, ws


def configurar_aba(ws, titulo, subtitulo, rodape=None):
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "B7"
    for col in range(1, 17):
        ws.column_dimensions[get_column_letter(col)].width = 15
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 24

    ws.merge_cells("B2:O3")
    c = ws["B2"]
    c.value = titulo.upper()
    c.fill = PatternFill("solid", fgColor=VINHO.replace("#", ""))
    c.font = Font(name="Arial", size=18, bold=True, color=BRANCO.replace("#", ""))
    c.alignment = Alignment(vertical="center")
    ws.row_dimensions[2].height = 27
    ws.row_dimensions[3].height = 18

    ws.merge_cells("B4:O4")
    ws["B4"] = subtitulo
    ws["B4"].font = Font(name="Arial", size=10, color=CINZA.replace("#", ""))
    ws["B4"].alignment = Alignment(vertical="center")

    if rodape:
        ws.merge_cells("B5:O5")
        ws["B5"] = rodape
        ws["B5"].font = Font(
            name="Arial", size=8, italic=True, color=CINZA.replace("#", "")
        )


def escrever_kpis(ws, itens, linha=7):
    """
    Cada KPI ocupa três colunas. item = (título, valor, explicação).
    """
    inicio = 2
    largura = 3
    for i, (titulo, valor, explicacao) in enumerate(itens):
        c1 = inicio + i * largura
        c2 = c1 + largura - 1
        ws.merge_cells(start_row=linha, start_column=c1, end_row=linha, end_column=c2)
        ws.merge_cells(
            start_row=linha + 1, start_column=c1, end_row=linha + 2, end_column=c2
        )
        ws.merge_cells(
            start_row=linha + 3, start_column=c1, end_row=linha + 3, end_column=c2
        )

        a = ws.cell(linha, c1, titulo.upper())
        a.fill = PatternFill("solid", fgColor=CINZA_CLARO.replace("#", ""))
        a.font = Font(name="Arial", size=9, bold=True, color=CINZA.replace("#", ""))
        a.alignment = Alignment(horizontal="center", vertical="center")

        b = ws.cell(linha + 1, c1, valor)
        b.fill = PatternFill("solid", fgColor="FFFFFF")
        b.font = Font(name="Arial", size=18, bold=True, color=VINHO.replace("#", ""))
        b.alignment = Alignment(horizontal="center", vertical="center")

        d = ws.cell(linha + 3, c1, explicacao)
        d.font = Font(name="Arial", size=8, color=CINZA.replace("#", ""))
        d.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        for r in range(linha, linha + 4):
            for col in range(c1, c2 + 1):
                ws.cell(r, col).border = Border(
                    bottom=Side(style="thin", color=CINZA_BORDA.replace("#", ""))
                )
    ws.row_dimensions[linha + 1].height = 27
    ws.row_dimensions[linha + 3].height = 30


def titulo_secao(ws, celula, texto):
    ws[celula] = texto
    ws[celula].font = Font(
        name="Arial", size=12, bold=True, color=VINHO.replace("#", "")
    )


def escrever_tabela(ws, linha, coluna, cabecalhos, linhas, larguras=None):
    for j, cab in enumerate(cabecalhos):
        c = ws.cell(linha, coluna + j, cab)
        c.fill = PatternFill("solid", fgColor=VINHO.replace("#", ""))
        c.font = Font(name="Arial", size=9, bold=True, color=BRANCO.replace("#", ""))
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for i, dados in enumerate(linhas, start=linha + 1):
        for j, valor in enumerate(dados):
            c = ws.cell(i, coluna + j, valor)
            c.font = Font(name="Arial", size=9, color="333333")
            c.alignment = Alignment(vertical="center", wrap_text=True)
            if (i - linha) % 2 == 0:
                c.fill = PatternFill("solid", fgColor="FAF7F8")
    if larguras:
        for j, largura in enumerate(larguras):
            ws.column_dimensions[get_column_letter(coluna + j)].width = largura
    return linha + len(linhas) + 1


def inserir_grafico(ws, figura, ancora, largura=15, altura=8):
    buffer = BytesIO()
    figura.savefig(
        buffer, format="png", dpi=170, bbox_inches="tight", facecolor="white"
    )
    plt.close(figura)
    buffer.seek(0)
    imagem = ExcelImage(buffer)
    imagem.width = largura * 38
    imagem.height = altura * 38
    ws.add_image(imagem, ancora)


def grafico_linhas(titulo, anos, series, ylabel="Pontuação média"):
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    for nome, valores, cor, estilo in series:
        ax.plot(
            anos,
            valores,
            marker="o",
            linewidth=2.3,
            color=cor,
            linestyle=estilo,
            label=nome,
        )
    ax.set_title(titulo, loc="left", fontsize=12, fontweight="bold", pad=14)
    ax.set_ylabel(ylabel, fontsize=9)
    ax.set_xlabel("Ano", fontsize=9)
    ax.grid(axis="y", alpha=0.22)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, fontsize=8)
    fig.tight_layout()
    return fig


def grafico_barras(titulo, categorias, series, ylabel="Pontuação"):
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    x = np.arange(len(categorias))
    largura = 0.8 / max(1, len(series))
    for i, (nome, valores, cor) in enumerate(series):
        pos = x - 0.4 + largura / 2 + i * largura
        ax.bar(pos, valores, largura, label=nome, color=cor, zorder=3)
    ax.set_title(titulo, loc="left", fontsize=12, fontweight="bold", pad=14)
    ax.set_ylabel(ylabel, fontsize=9)
    ax.set_xticks(x)
    ax.set_xticklabels(categorias, rotation=18, ha="right", fontsize=8)
    ax.grid(axis="y", alpha=0.2, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, fontsize=8)
    fig.tight_layout()
    return fig


def grafico_rosca(titulo, concluido, restante):
    fig, ax = plt.subplots(figsize=(4.0, 3.4))
    valores = [max(0, concluido), max(0, restante)]
    if sum(valores) == 0:
        valores = [0, 1]
    ax.pie(
        valores,
        startangle=90,
        counterclock=False,
        colors=[VINHO, "#E9E3E6"],
        wedgeprops={"width": 0.27, "edgecolor": "white"},
    )
    percentual = (
        concluido / (concluido + restante) * 100 if concluido + restante > 0 else 0
    )
    ax.text(
        0,
        0.04,
        f"{percentual:.0f}%",
        ha="center",
        va="center",
        fontsize=20,
        fontweight="bold",
        color=VINHO,
    )
    ax.text(0, -0.20, "da meta", ha="center", va="center", fontsize=8, color=CINZA)
    ax.set_title(titulo, loc="left", fontsize=11, fontweight="bold")
    fig.tight_layout()
    return fig


def salvar_bytes(wb):
    saida = BytesIO()
    wb.save(saida)
    saida.seek(0)
    return saida


def obter_historico(usuario):
    historico = banco.buscar_historico(usuario["co_municipio"])
    if not historico:
        raise ValueError(
            f"Não há dados do ENEM cadastrados para {usuario['nome_municipio']}/{usuario['uf']}."
        )
    return historico


def montar_serie(historico, sufixo):
    return {
        "anos": [int(x["ano"]) for x in historico],
        "municipio": [n(x.get(f"municipio_{sufixo}")) for x in historico],
        "estado": [n(x.get(f"estado_{sufixo}")) for x in historico],
    }


def areas_ultimo_ano(historico):
    ultimo = historico[-1]
    return {
        area: n(ultimo.get(f"municipio_{sufixo}")) for area, sufixo in AREAS.items()
    }


def menor_area(valores):
    disponiveis = {
        k: v for k, v in valores.items() if k in AREAS_OBJETIVAS and v is not None
    }
    return min(disponiveis, key=disponiveis.get) if disponiveis else None


def eventos_por_area(eventos):
    contagem = {a: 0 for a in AREAS}
    for evento in eventos:
        area = normalizar_area(evento.get("area"))
        if area in contagem:
            contagem[area] += 1
    return contagem


def professor_por_area_atuacao(id_unidade):
    linhas = banco.consultar(
        """
        SELECT u.id, u.nome, u.area_atuacao
        FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        WHERE u.id_unidade = %s
          AND LOWER(c.nome) = 'professor'
        ORDER BY u.nome
    """,
        (id_unidade,),
    )
    return linhas


def resumo_desempenho(historico):
    ultimo = historico[-1]
    valores = [n(ultimo.get(f"municipio_{AREAS[a]}")) for a in AREAS_OBJETIVAS]
    estados = [n(ultimo.get(f"estado_{AREAS[a]}")) for a in AREAS_OBJETIVAS]
    return media(valores), media(estados), areas_ultimo_ano(historico)


# ---------------------------------------------------------------------
# Relatório do professor
# ---------------------------------------------------------------------


def relatorio_professor(usuario):
    historico = obter_historico(usuario)
    planejamento = banco.buscar_planejamento_unidade(usuario["id_unidade"])
    wb, _ = criar_workbook("Linguagens")

    for indice, (area, sufixo) in enumerate(AREAS.items()):
        ws = wb.active if indice == 0 else wb.create_sheet()
        ws.title = area[:31]
        serie = montar_serie(historico, sufixo)
        atual = serie["municipio"][-1]
        estado = serie["estado"][-1]
        inicial = serie["municipio"][0]
        dia = 2 if area in ("Ciências da Natureza", "Matemática") else 1
        abst = n(historico[-1].get(f"taxa_abstencao_dia{dia}"))
        delta = diferenca(atual, estado)

        rodape = (
            f"Unidade: {usuario['nome_unidade']} | "
            f"Município: {usuario['nome_municipio']}/{usuario['uf']} | "
            f"ENEM: {historico[-1]['ano']} | "
            f"Relatório gerado em {datetime.now():%d/%m/%Y %H:%M}"
        )
        configurar_aba(ws, f"GrowthMap | {area}", f"Análise regional de {area}", rodape)

        kpis = [
            (
                "Média municipal",
                fmt(atual),
                "Média do município no último ENEM disponível.",
            ),
            ("Abstenção", pct(abst), f"Taxa de abstenção do {dia}º dia de prova."),
            (
                "Evolução histórica",
                fmt(
                    (
                        atual - inicial
                        if atual is not None and inicial is not None
                        else None
                    ),
                    1,
                    " pts",
                ),
                "Diferença entre o primeiro e o último ano do histórico.",
            ),
            (
                "Diferença vs. estado",
                fmt(delta, 1, " pts"),
                "Município menos média estadual no mesmo ano.",
            ),
        ]
        if area == "Redação":
            comps = [n(historico[-1].get(f"media_comp{i}")) for i in range(1, 6)]
            media_comp = media(comps)
            kpis.append(
                (
                    "Média das competências",
                    fmt(media_comp),
                    "Média das cinco competências da redação.",
                )
            )
        escrever_kpis(ws, kpis)

        # Gráfico 1: evolução do município e do estado.
        inserir_grafico(
            ws,
            grafico_linhas(
                f"Evolução de {area}: município x estado",
                serie["anos"],
                [
                    ("Município", serie["municipio"], VINHO, "-"),
                    ("Estado", serie["estado"], "#9CA3AF", "--"),
                ],
            ),
            "B13",
            15,
            8,
        )

        # Gráfico 2: progresso da meta de eventos do semestre.
        inserir_grafico(
            ws,
            grafico_rosca(
                "Planejamento pedagógico",
                planejamento["cadastrados"],
                max(0, planejamento["meta"] - planejamento["cadastrados"]),
            ),
            "J13",
            8,
            7,
        )
        titulo_secao(ws, "B30", "LEITURA DO INDICADOR")
        texto = (
            f"No último ano disponível, {area.lower()} registrou "
            f"{fmt(atual)} pontos no município, contra {fmt(estado)} no estado. "
            f"A diferença foi de {fmt(delta, 1, ' pontos')}."
        )
        ws.merge_cells("B31:O33")
        ws["B31"] = texto
        ws["B31"].alignment = Alignment(wrap_text=True, vertical="top")
        ws["B31"].font = Font(name="Arial", size=10, color="333333")

        if area == "Redação":
            titulo_secao(ws, "B35", "DESEMPENHO POR COMPETÊNCIA")
            linhas = [(COMPETENCIAS[i], fmt(comps[i])) for i in range(5)]
            escrever_tabela(ws, 37, 2, ["Competência", "Pontuação"], linhas, [30, 18])
            fig, ax = plt.subplots(figsize=(7.2, 3.4))
            ax.bar(
                COMPETENCIAS,
                [v if v is not None else 0 for v in comps],
                color=VINHO,
                zorder=3,
            )
            ax.set_title(
                "Pontuação por competência",
                loc="left",
                fontsize=12,
                fontweight="bold",
                pad=12,
            )
            ax.set_ylabel("Pontos")
            ax.set_ylim(0, 200)
            ax.tick_params(axis="x", rotation=20, labelsize=8)
            ax.grid(axis="y", alpha=0.2, zorder=0)
            ax.spines[["top", "right"]].set_visible(False)
            fig.tight_layout()
            inserir_grafico(ws, fig, "H35", 15, 8)

    return salvar_bytes(wb)


# ---------------------------------------------------------------------
# Relatório do coordenador
# ---------------------------------------------------------------------


def relatorio_coordenador(usuario):
    historico = obter_historico(usuario)
    eventos = banco.buscar_eventos_unidade(usuario["id_unidade"])
    planejamento = banco.buscar_planejamento_unidade(usuario["id_unidade"])
    professores = professor_por_area_atuacao(usuario["id_unidade"])
    media_mun, media_est, valores = resumo_desempenho(historico)
    pior = menor_area(valores)
    total_eventos = len(eventos)
    percentual_meta = (
        total_eventos / planejamento["meta"] * 100 if planejamento["meta"] else 0
    )

    wb, ws = criar_workbook("Coordenador")
    configurar_aba(
        ws,
        "GrowthMap | Dashboard do Coordenador",
        f"Visão pedagógica da unidade {usuario['nome_unidade']} "
        f"({usuario['nome_municipio']}/{usuario['uf']})",
        f"Notas do ENEM são municipais, não representam notas individuais dos alunos. "
        f"Gerado em {datetime.now():%d/%m/%Y %H:%M}",
    )

    kpis = [
        (
            "Média das áreas objetivas",
            fmt(media_mun),
            "Média simples das quatro áreas objetivas do município.",
        ),
        (
            "Área de maior atenção",
            pior or "N/D",
            "Área objetiva com a menor média municipal.",
        ),
        (
            "Eventos cadastrados",
            str(total_eventos),
            "Eventos da unidade no ano corrente.",
        ),
        (
            "Meta de planejamento",
            pct(percentual_meta),
            f"{total_eventos} eventos de uma meta de {planejamento['meta']}.",
        ),
    ]
    escrever_kpis(ws, kpis)

    # Evolução da média das áreas objetivas.
    anos = [int(x["ano"]) for x in historico]
    serie_mun = []
    serie_est = []
    for item in historico:
        serie_mun.append(
            media([n(item.get(f"municipio_{AREAS[a]}")) for a in AREAS_OBJETIVAS])
        )
        serie_est.append(
            media([n(item.get(f"estado_{AREAS[a]}")) for a in AREAS_OBJETIVAS])
        )
    inserir_grafico(
        ws,
        grafico_linhas(
            "Evolução média: município x estado",
            anos,
            [
                ("Município", serie_mun, VINHO, "-"),
                ("Estado", serie_est, "#9CA3AF", "--"),
            ],
        ),
        "B13",
        15,
        8,
    )

    # Eventos por professor.
    por_professor = {}
    for ev in eventos:
        nome = ev.get("professor", "Não identificado")
        por_professor[nome] = por_professor.get(nome, 0) + 1
    nomes = list(por_professor) or ["Sem eventos"]
    quantidades = list(por_professor.values()) or [0]
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    ax.barh(nomes, quantidades, color=VINHO, zorder=3)
    ax.set_title(
        "Eventos cadastrados por professor",
        loc="left",
        fontsize=12,
        fontweight="bold",
        pad=14,
    )
    ax.set_xlabel("Quantidade de eventos")
    ax.grid(axis="x", alpha=0.2, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    inserir_grafico(ws, fig, "J13", 15, 8)

    titulo_secao(ws, "B30", "EQUIPE PEDAGÓGICA")
    linhas_prof = []
    for prof in professores:
        area = normalizar_area(prof.get("area_atuacao")) or "Não informada"
        linhas_prof.append((prof["nome"], area))
    if not linhas_prof:
        linhas_prof = [("Nenhum professor encontrado", "N/D")]
    proxima = escrever_tabela(
        ws, 32, 2, ["Professor", "Área de atuação"], linhas_prof, [32, 24]
    )

    titulo_secao(ws, f"B{proxima + 2}", "PLANEJAMENTO DA UNIDADE")
    escrever_tabela(
        ws,
        proxima + 4,
        2,
        ["Ano", "Semestre", "Eventos cadastrados", "Meta", "Atingimento"],
        [
            (
                planejamento["ano"],
                planejamento["semestre"],
                total_eventos,
                planejamento["meta"],
                pct(percentual_meta),
            )
        ],
        [14, 14, 22, 14, 18],
    )
    # Sem lista de atividade recente, conforme solicitado.
    return salvar_bytes(wb)


# ---------------------------------------------------------------------
# Consultas agregadas do diretor
# ---------------------------------------------------------------------


def dados_rede(id_empresa, ano=None):
    ano = ano or date.today().year - 1
    unidades = banco.buscar_unidades_empresa(id_empresa)
    if not unidades:
        raise ValueError("A empresa não possui unidades cadastradas.")

    municipios = {}
    for unidade in unidades:
        codigo = unidade["co_municipio"]
        if codigo not in municipios:
            hist = banco.buscar_historico(codigo)
            if hist:
                municipios[codigo] = {
                    "unidade": unidade,
                    "historico": hist,
                    "ultimo": next((x for x in hist if int(x["ano"]) == ano), hist[-1]),
                }

    eventos = banco.buscar_eventos_empresa(id_empresa, date.today().year)
    professores = banco.consultar(
        """
        SELECT u.id, u.id_unidade, u.area_atuacao
        FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        JOIN unidade un ON un.id = u.id_unidade
        WHERE un.id_empresa = %s AND LOWER(c.nome) = 'professor'
    """,
        (id_empresa,),
    )

    return unidades, municipios, eventos, professores, ano


def calcular_indicadores_rede(unidades, municipios, eventos, professores):
    # Cada município é contado uma única vez, mesmo que tenha mais de uma unidade.
    total_participantes = 0
    soma_diferencas = 0
    peso_total = 0
    cidades_area = {}
    for codigo, pacote in municipios.items():
        item = pacote["ultimo"]
        participantes = n(item.get("qtd_participantes")) or 0
        total_participantes += participantes
        gaps = []
        for area in AREAS_OBJETIVAS:
            suf = AREAS[area]
            mun = n(item.get(f"municipio_{suf}"))
            est = n(item.get(f"estado_{suf}"))
            gap = diferenca(mun, est)
            if gap is not None:
                gaps.append(gap)
                cidades_area.setdefault(pacote["unidade"]["nome_municipio"], {})[
                    area
                ] = gap
        gap_medio = media(gaps)
        if gap_medio is not None and participantes > 0:
            soma_diferencas += gap_medio * participantes
            peso_total += participantes

    gap_ponderado = soma_diferencas / peso_total if peso_total else None

    # Cobertura: unidades que possuem professor na área objetiva mais fraca
    # do município. A contagem é por unidade, não por professor.
    professores_por_unidade = {}
    for prof in professores:
        professores_por_unidade.setdefault(prof["id_unidade"], set()).add(
            normalizar_area(prof.get("area_atuacao"))
        )
    unidades_sem_cobertura = 0
    for un in unidades:
        pacote = municipios.get(un["co_municipio"])
        pior = menor_area(areas_ultimo_ano(pacote["historico"])) if pacote else None
        areas_prof = professores_por_unidade.get(un["id"], set())
        if pior and pior not in areas_prof:
            unidades_sem_cobertura += 1

    # Aderência: proporção de eventos na área objetiva mais fraca do município.
    total_eventos = len(eventos)
    eventos_aderentes = 0
    unidade_por_id = {u["id"]: u for u in unidades}
    for ev in eventos:
        uid = ev.get("id_unidade")
        un = unidade_por_id.get(uid)
        if not un:
            continue
        pacote = municipios.get(un["co_municipio"])
        if not pacote:
            continue
        pior = menor_area(areas_ultimo_ano(pacote["historico"]))
        if normalizar_area(ev.get("area")) == pior:
            eventos_aderentes += 1
    aderencia = eventos_aderentes / total_eventos * 100 if total_eventos else None

    return {
        "gap": gap_ponderado,
        "participantes": total_participantes,
        "sem_cobertura": unidades_sem_cobertura,
        "total_unidades": len(unidades),
        "aderencia": aderencia,
        "eventos_aderentes": eventos_aderentes,
        "total_eventos": total_eventos,
        "cidades_area": cidades_area,
    }


def buscar_oportunidades(id_empresa):
    """
    Índice demonstrativo: participantes x déficit médio positivo nas quatro
    áreas objetivas, normalizado para 0-100. Municípios já atendidos aparecem
    identificados na tabela, mas podem ser filtrados pelo leitor.
    """
    linhas = banco.consultar("""
        SELECT m.co_municipio, m.nome_municipio, m.uf,
               r.ano, r.media_lc, r.media_ch, r.media_cn, r.media_mt,
               r.qtd_participantes,
               e.media_lc AS estado_lc, e.media_ch AS estado_ch,
               e.media_cn AS estado_cn, e.media_mt AS estado_mt
        FROM desempenho_regional r
        JOIN municipio m ON m.co_municipio = r.co_municipio
        LEFT JOIN desempenho_estadual e ON e.uf = m.uf AND e.ano = r.ano
        WHERE r.ano = (
            SELECT MAX(r2.ano)
            FROM desempenho_regional r2
            WHERE r2.co_municipio = r.co_municipio
        )
        ORDER BY m.nome_municipio
    """)
    atendidos = {x["co_municipio"] for x in banco.buscar_unidades_empresa(id_empresa)}
    itens = []
    for row in linhas:
        gaps = []
        for area in ("lc", "ch", "cn", "mt"):
            mun = n(row.get(f"media_{area}"))
            est = n(row.get(f"estado_{area}"))
            if mun is not None and est is not None:
                gaps.append(max(0, est - mun))
        deficit = media(gaps)
        participantes = n(row.get("qtd_participantes")) or 0
        bruto = deficit * participantes if deficit is not None else 0
        itens.append(
            {
                "municipio": row["nome_municipio"],
                "uf": row["uf"],
                "participantes": participantes,
                "deficit": deficit,
                "bruto": bruto,
                "situacao": (
                    "Atendido" if row["co_municipio"] in atendidos else "Sem unidade"
                ),
            }
        )
    maximo = max((x["bruto"] for x in itens), default=0)
    for item in itens:
        item["indice"] = item["bruto"] / maximo * 100 if maximo else 0
    return sorted(itens, key=lambda x: x["indice"], reverse=True)


# ---------------------------------------------------------------------
# Relatório do diretor geral
# ---------------------------------------------------------------------


def relatorio_diretor_rede(usuario):
    unidades, municipios, eventos, professores, ano = dados_rede(
        usuario["id_empresa"], date.today().year - 1
    )
    ind = calcular_indicadores_rede(unidades, municipios, eventos, professores)
    oportunidades = buscar_oportunidades(usuario["id_empresa"])

    wb, ws = criar_workbook("Visão da Rede")
    configurar_aba(
        ws,
        "GrowthMap | Diretor Geral",
        f"Visão estratégica da empresa {usuario['id_empresa']} | ENEM {ano}",
        "As notas representam o desempenho dos municípios atendidos, não dos alunos das unidades.",
    )

    escrever_kpis(
        ws,
        [
            (
                "Diferença vs. estado",
                fmt(ind["gap"], 1, " pts"),
                "Média das quatro áreas objetivas, ponderada por participantes.",
            ),
            (
                "Base de candidatos",
                fmt(ind["participantes"], 0),
                "Participantes nos municípios atendidos, sem duplicar municípios.",
            ),
            (
                "Cobertura de professores",
                f"{ind['sem_cobertura']} de {ind['total_unidades']}",
                "Unidades sem professor na área objetiva de menor média.",
            ),
            (
                "Aderência pedagógica",
                pct(ind["aderencia"]),
                f"{ind['eventos_aderentes']} de {ind['total_eventos']} eventos na área de maior atenção.",
            ),
        ],
    )

    titulo_secao(ws, "B13", "UNIDADES ANALISADAS")
    linhas_unidades = []
    for un in unidades:
        pacote = municipios.get(un["co_municipio"])
        if pacote:
            media_mun, media_est, _ = resumo_desempenho(pacote["historico"])
            gap = diferenca(media_mun, media_est)
            ano_usado = pacote["ultimo"]["ano"]
        else:
            gap, ano_usado = None, "Sem dados"
        linhas_unidades.append(
            (un["nome"], un["nome_municipio"], un["uf"], ano_usado, fmt(gap, 1, " pts"))
        )
    fim = escrever_tabela(
        ws,
        15,
        2,
        ["Unidade", "Município", "UF", "Ano", "Diferença vs. estado"],
        linhas_unidades,
        [26, 22, 10, 12, 24],
    )

    # Gráfico de diferença média por município atendido.
    cidades = []
    gaps = []
    for pacote in municipios.values():
        m, e, _ = resumo_desempenho(pacote["historico"])
        if m is not None and e is not None:
            cidades.append(pacote["unidade"]["nome_municipio"])
            gaps.append(m - e)
    fig, ax = plt.subplots(figsize=(7.2, 3.7))
    cores = [VERDE if v >= 0 else VINHO for v in gaps]
    ax.bar(cidades or ["Sem dados"], gaps or [0], color=cores, zorder=3)
    ax.axhline(0, color="#555555", linewidth=0.8)
    ax.set_title(
        "Diferença média vs. estado por município",
        loc="left",
        fontsize=12,
        fontweight="bold",
        pad=14,
    )
    ax.set_ylabel("Pontos")
    ax.tick_params(axis="x", rotation=20, labelsize=8)
    ax.grid(axis="y", alpha=0.2, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    inserir_grafico(ws, fig, f"B{fim + 2}", 15, 8)

    # Heatmap: diferença por município e área objetiva.
    cidades_heat = list(ind["cidades_area"].keys())
    matriz = [
        [ind["cidades_area"][cidade].get(area, np.nan) for area in AREAS_OBJETIVAS]
        for cidade in cidades_heat
    ]
    fig, ax = plt.subplots(figsize=(7.2, max(3.2, len(cidades_heat) * 0.55)))
    if matriz:
        imagem = ax.imshow(matriz, cmap="RdYlGn", aspect="auto", vmin=-40, vmax=40)
        ax.set_yticks(range(len(cidades_heat)))
        ax.set_yticklabels(cidades_heat, fontsize=8)
        ax.set_xticks(range(len(AREAS_OBJETIVAS)))
        ax.set_xticklabels(
            ["Linguagens", "Humanas", "Natureza", "Matemática"],
            rotation=20,
            ha="right",
            fontsize=8,
        )
        for i, linha in enumerate(matriz):
            for j, valor in enumerate(linha):
                if not np.isnan(valor):
                    ax.text(
                        j,
                        i,
                        f"{valor:+.0f}",
                        ha="center",
                        va="center",
                        fontsize=8,
                        color="#222222",
                    )
        fig.colorbar(imagem, ax=ax, shrink=0.8, label="Pontos vs. estado")
    else:
        ax.text(0.5, 0.5, "Sem dados comparáveis", ha="center", va="center")
        ax.axis("off")
    ax.set_title(
        "Diferença vs. estado por município e área",
        loc="left",
        fontsize=12,
        fontweight="bold",
        pad=14,
    )
    fig.tight_layout()
    inserir_grafico(ws, fig, f"J{fim + 2}", 15, 8)

    linha_opp = fim + 20
    titulo_secao(ws, f"B{linha_opp}", "MELHORES OPORTUNIDADES DE EXPANSÃO")
    escrever_tabela(
        ws,
        linha_opp + 2,
        2,
        [
            "Município",
            "UF",
            "Participantes",
            "Déficit médio",
            "Índice 0-100",
            "Situação",
        ],
        [
            (
                x["municipio"],
                x["uf"],
                int(x["participantes"]),
                fmt(x["deficit"]),
                fmt(x["indice"], 1),
                x["situacao"],
            )
            for x in oportunidades[:10]
        ],
        [24, 8, 16, 16, 15, 18],
    )
    ws.merge_cells(
        start_row=linha_opp + 14, start_column=2, end_row=linha_opp + 15, end_column=15
    )
    ws.cell(linha_opp + 14, 2).value = (
        "Metodologia demonstrativa: participantes x déficit médio positivo "
        "em relação ao estado nas quatro áreas objetivas, normalizado para 0-100. "
        "O índice mede volume e necessidade pedagógica, não poder de compra."
    )
    ws.cell(linha_opp + 14, 2).alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(linha_opp + 14, 2).font = Font(
        name="Arial", size=9, italic=True, color=CINZA.replace("#", "")
    )
    return salvar_bytes(wb)


# ---------------------------------------------------------------------
# Relatório do diretor de filial
# ---------------------------------------------------------------------


def relatorio_diretor_filial(usuario, id_unidade):
    unidade = banco.validar_unidade_empresa(id_unidade, usuario["id_empresa"])
    historico = banco.buscar_historico(unidade["co_municipio"])
    if not historico:
        raise ValueError("Não há histórico do ENEM para o município desta unidade.")
    eventos = banco.buscar_eventos_unidade(id_unidade)
    planejamento = banco.buscar_planejamento_unidade(id_unidade)
    professores = professor_por_area_atuacao(id_unidade)

    media_mun, media_est, valores = resumo_desempenho(historico)
    pior = menor_area(valores)
    total_eventos = len(eventos)
    eventos_area = eventos_por_area(eventos)
    aderentes = eventos_area.get(pior, 0) if pior else 0
    aderencia = aderentes / total_eventos * 100 if total_eventos else None
    cobertura = sum(
        1 for p in professores if normalizar_area(p.get("area_atuacao")) == pior
    )
    delta = diferenca(media_mun, media_est)

    wb, ws = criar_workbook("Diretor Filial")
    configurar_aba(
        ws,
        "GrowthMap | Diretor de Filial",
        f"Município analisado: {unidade['nome_municipio']}/{unidade['uf']} | "
        f"Unidade: {unidade['nome']}",
        "As notas do ENEM representam o município da unidade, não o desempenho individual dos alunos.",
    )

    titulo_secao(
        ws, "B7", f"CIDADE ANALISADA: {unidade['nome_municipio']} - {unidade['uf']}"
    )
    titulo_secao(ws, "B9", "LEITURA RÁPIDA")
    leitura = (
        f"A área de menor média é {pior or 'não identificada'}. "
        f"A média das quatro áreas objetivas é {fmt(media_mun)}, "
        f"com diferença de {fmt(delta, 1, ' pontos')} em relação ao estado. "
        f"A unidade possui {total_eventos} eventos cadastrados no ano corrente."
    )
    ws.merge_cells("B10:O11")
    ws["B10"] = leitura
    ws["B10"].alignment = Alignment(wrap_text=True, vertical="center")
    ws["B10"].font = Font(name="Arial", size=10, color="333333")

    escrever_kpis(
        ws,
        [
            (
                "Diferença vs. estado",
                fmt(delta, 1, " pts"),
                "Média das quatro áreas objetivas do município menos a estadual.",
            ),
            (
                "Base de candidatos",
                fmt(historico[-1].get("qtd_participantes"), 0),
                "Participantes do ENEM no município analisado.",
            ),
            (
                "Cobertura na área crítica",
                f"{cobertura} de {len(professores)}",
                f"Professores cadastrados com atuação em {pior or 'área não identificada'}.",
            ),
            (
                "Aderência pedagógica",
                pct(aderencia),
                f"{aderentes} de {total_eventos} eventos na área de menor média.",
            ),
        ],
        linha=13,
    )

    # Gráfico 1: desempenho por área, município x estado.
    ultimo = historico[-1]
    mun_vals = [n(ultimo.get(f"municipio_{AREAS[a]}")) for a in AREAS_OBJETIVAS]
    est_vals = [n(ultimo.get(f"estado_{AREAS[a]}")) for a in AREAS_OBJETIVAS]
    inserir_grafico(
        ws,
        grafico_barras(
            "Desempenho por área: município x estado",
            ["Linguagens", "Humanas", "Natureza", "Matemática"],
            [
                ("Município", [v or 0 for v in mun_vals], VINHO),
                ("Estado", [v or 0 for v in est_vals], "#9CA3AF"),
            ],
        ),
        "B20",
        15,
        8,
    )

    # Gráfico 2: evolução da média objetiva.
    anos = [int(x["ano"]) for x in historico]
    evol_mun = [
        media([n(x.get(f"municipio_{AREAS[a]}")) for a in AREAS_OBJETIVAS])
        for x in historico
    ]
    evol_est = [
        media([n(x.get(f"estado_{AREAS[a]}")) for a in AREAS_OBJETIVAS])
        for x in historico
    ]
    inserir_grafico(
        ws,
        grafico_linhas(
            "Evolução da média objetiva",
            anos,
            [
                ("Município", evol_mun, VINHO, "-"),
                ("Estado", evol_est, "#9CA3AF", "--"),
            ],
        ),
        "J20",
        15,
        8,
    )

    # Último gráfico: distribuição dos eventos por área.
    inserir_grafico(
        ws,
        grafico_barras(
            "Eventos cadastrados por área",
            list(AREAS.keys()),
            [("Eventos", [eventos_area[a] for a in AREAS], VINHO)],
            ylabel="Quantidade",
        ),
        "B38",
        15,
        8,
    )

    titulo_secao(ws, "J38", "PLANEJAMENTO")
    ws["J40"] = "Eventos cadastrados"
    ws["K40"] = total_eventos
    ws["J41"] = "Meta do semestre"
    ws["K41"] = planejamento["meta"]
    ws["J42"] = "Ano / semestre"
    ws["K42"] = f"{planejamento['ano']} / {planejamento['semestre']}º"
    for cel in ("J40", "J41", "J42"):
        ws[cel].font = Font(
            name="Arial", size=9, bold=True, color=CINZA.replace("#", "")
        )
    for cel in ("K40", "K41", "K42"):
        ws[cel].font = Font(
            name="Arial", size=10, bold=True, color=VINHO.replace("#", "")
        )
    return salvar_bytes(wb)


# ---------------------------------------------------------------------
# Entrada pública chamada pela API
# ---------------------------------------------------------------------


def gerar_relatorio(tipo, id_usuario, id_unidade=None):
    """
    Gera o XLSX de acordo com o perfil do usuário.

    tipo: professor | coordenador | diretor_filial | diretor_rede
    id_unidade: obrigatório para diretor_filial; validado dentro da empresa.
    """
    tipo = str(tipo).strip().lower()
    contexto = banco.buscar_escopo_usuario(int(id_usuario))
    usuario = contexto["usuario"]
    cargo = usuario["cargo"].strip().casefold()

    if tipo == "professor":
        if cargo != "professor":
            raise PermissionError(
                "O relatório de professor exige um usuário professor."
            )
        return relatorio_professor(usuario)

    if tipo == "coordenador":
        if cargo != "coordenador":
            raise PermissionError(
                "O relatório de coordenador exige um usuário coordenador."
            )
        return relatorio_coordenador(usuario)

    if tipo in ("diretor", "diretor_rede", "diretor_geral"):
        if cargo != "diretor geral":
            raise PermissionError("O relatório da rede exige um Diretor Geral.")
        return relatorio_diretor_rede(usuario)

    if tipo in ("diretor_filial", "filial"):
        if cargo != "diretor geral":
            raise PermissionError("O relatório de filial exige um Diretor Geral.")
        if id_unidade is None:
            id_unidade = usuario["id_unidade"]
        return relatorio_diretor_filial(usuario, int(id_unidade))

    raise ValueError(f"Tipo de relatório desconhecido: {tipo}")


if __name__ == "__main__":
    # Teste local: python simbiose.py professor 4
    import sys

    tipo = sys.argv[1] if len(sys.argv) > 1 else "diretor_rede"
    uid = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    unidade = int(sys.argv[3]) if len(sys.argv) > 3 else None
    arquivo = gerar_relatorio(tipo, uid, unidade)
    nome = f"relatorio_{tipo}_{uid}.xlsx"
    with open(nome, "wb") as f:
        f.write(arquivo.getvalue())
    print(f"Relatório salvo em: {nome}")
