"""
Geração modular dos quatro relatórios GrowthMap.
Usa Matplotlib para gráficos PNG e openpyxl para montar o XLSX.
"""

from datetime import datetime, date
from io import BytesIO

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from openpyxl import Workbook
from openpyxl.drawing.image import Image as ExcelImage
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

import banco


VINHO = "#7A1F3D"
VINHO_CLARO = "#F5EBEF"
CINZA = "#666666"
AREAS = banco.AREAS
COMPETENCIAS = [
    "Norma culta", "Compreensão do tema", "Argumentação",
    "Coesão textual", "Intervenção"
]


def numero(valor):
    return float(valor) if valor is not None else None


def criar_grafico(tipo, titulo, categorias, series, nomes_series=None,
                  eixo_y="Pontuação", limite_y=None):
    """Cria imagem de gráfico reutilizável e retorna BytesIO."""
    fig, ax = plt.subplots(figsize=(8, 3.8))
    cores = [VINHO, "#B66A83", "#777777", "#C9A3AF", "#444444"]

    if tipo == "linha":
        for i, valores in enumerate(series):
            ax.plot(categorias, valores, marker="o", linewidth=2.4,
                    color=cores[i % len(cores)],
                    label=(nomes_series[i] if nomes_series else f"Série {i+1}"))
        if nomes_series:
            ax.legend(frameon=False)
    elif tipo == "barra":
        valores = series[0]
        ax.bar(categorias, valores, color=VINHO, width=0.62)
        ax.tick_params(axis="x", rotation=20)
    elif tipo == "barras_grupo":
        import numpy as np
        x = np.arange(len(categorias))
        largura = 0.8 / max(len(series), 1)
        for i, valores in enumerate(series):
            ax.bar(x + (i - (len(series)-1)/2) * largura, valores,
                   largura, label=nomes_series[i], color=cores[i % len(cores)])
        ax.set_xticks(x)
        ax.set_xticklabels(categorias, rotation=15, ha="right")
        ax.legend(frameon=False)
    elif tipo == "donut":
        vals = series[0]
        if sum(vals) > 0:
            ax.pie(vals, labels=categorias, autopct="%1.0f%%",
                   startangle=90, colors=[VINHO, "#D9C3CB"],
                   wedgeprops={"width": 0.42, "edgecolor": "white"})
        else:
            ax.text(0.5, 0.5, "Sem registros", ha="center", va="center")
            ax.axis("off")

    ax.set_title(titulo, loc="left", color=VINHO, fontsize=12, fontweight="bold")
    if tipo != "donut":
        ax.set_ylabel(eixo_y, color=CINZA)
        ax.grid(axis="y", alpha=0.2)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        if limite_y:
            ax.set_ylim(*limite_y)
    fig.tight_layout()
    imagem = BytesIO()
    fig.savefig(imagem, format="png", dpi=160, bbox_inches="tight")
    plt.close(fig)
    imagem.seek(0)
    return imagem


def nova_aba(wb, titulo, subtitulo):
    aba = wb.active if len(wb.sheetnames) == 1 and wb.active.max_row == 1 else wb.create_sheet()
    aba.title = titulo[:31]
    aba.sheet_view.showGridLines = False
    for col, largura in {"A": 4, "B": 28, "C": 18, "D": 18, "E": 18,
                         "F": 18, "G": 18, "H": 18, "I": 18}.items():
        aba.column_dimensions[col].width = largura
    aba.merge_cells("B2:I2")
    aba["B2"] = "GROWTHMAP | " + titulo.upper()
    aba["B2"].font = Font(name="Arial", size=17, bold=True, color="FFFFFF")
    aba["B2"].fill = PatternFill("solid", fgColor="7A1F3D")
    aba["B2"].alignment = Alignment(vertical="center")
    aba.row_dimensions[2].height = 32
    aba.merge_cells("B3:I3")
    aba["B3"] = subtitulo
    aba["B3"].font = Font(name="Arial", size=9, color=CINZA[1:])
    aba["B4"] = f"Gerado em {datetime.now():%d/%m/%Y %H:%M}"
    aba["B4"].font = Font(size=8, color="777777")
    return aba


def escrever_tabela(aba, linha, cabecalhos, registros):
    for c, valor in enumerate(cabecalhos, 2):
        cel = aba.cell(linha, c, valor)
        cel.font = Font(bold=True, color="FFFFFF")
        cel.fill = PatternFill("solid", fgColor="7A1F3D")
    for r, registro in enumerate(registros, linha + 1):
        for c, valor in enumerate(registro, 2):
            cel = aba.cell(r, c, valor)
            if r % 2 == 0:
                cel.fill = PatternFill("solid", fgColor="F5EBEF")
    return linha + len(registros) + 1


def inserir_grafico(aba, imagem, ancora):
    figura = ExcelImage(imagem)
    figura.width = 650
    figura.height = 300
    aba.add_image(figura, ancora)


def salvar_workbook(wb):
    saida = BytesIO()
    wb.save(saida)
    saida.seek(0)
    return saida


def dados_historico(usuario):
    historico = banco.buscar_historico(usuario["co_municipio"])
    if not historico:
        raise ValueError("Não há dados do ENEM para o município da unidade.")
    return historico


def relatorio_professor(usuario):
    historico = dados_historico(usuario)
    planejamento = banco.buscar_planejamento_unidade(usuario["id_unidade"])
    wb = Workbook()
    wb.remove(wb.active)

    for area, sufixo in AREAS.items():
        aba = wb.create_sheet(area[:31])
        aba.sheet_view.showGridLines = False
        for col in range(1, 10):
            aba.column_dimensions[get_column_letter(col)].width = 18
        aba.merge_cells("B2:I2")
        aba["B2"] = f"GROWTHMAP | PROFESSOR — {area.upper()}"
        aba["B2"].font = Font(size=16, bold=True, color="FFFFFF")
        aba["B2"].fill = PatternFill("solid", fgColor="7A1F3D")
        aba.merge_cells("B3:I3")
        aba["B3"] = f"{usuario['nome_unidade']} · {usuario['nome_municipio']}/{usuario['uf']}"
        atual = historico[-1]
        estado = numero(atual.get(f"estado_{sufixo}"))
        media = numero(atual.get(f"municipio_{sufixo}"))
        aba["B5"], aba["C5"] = "Indicador", "Valor"
        escrever_tabela(aba, 5, ["Indicador", "Valor"], [
            ["Média municipal", media], ["Média estadual", estado],
            ["Diferença (município - estado)", (media - estado) if media is not None and estado is not None else None],
            ["Eventos no semestre", planejamento["cadastrados"]],
            ["Meta de eventos", planejamento["meta"]],
        ])
        anos = [str(x["ano"]) for x in historico]
        municipio = [numero(x.get(f"municipio_{sufixo}")) for x in historico]
        estadual = [numero(x.get(f"estado_{sufixo}")) for x in historico]
        inserir_grafico(aba, criar_grafico("linha", f"Evolução — {area}",
                                           anos, [municipio, estadual],
                                           ["Município", "Estado"]), "B14")
        if area == "Redação":
            competencias = [numero(atual.get(f"media_comp{i}")) for i in range(1, 6)]
            escrever_tabela(aba, 32, ["Competência", "Pontuação"], [
                [COMPETENCIAS[i], competencias[i]] for i in range(5)
            ])
            inserir_grafico(aba, criar_grafico(
                "barra", "Média por competência", [f"C{i}" for i in range(1, 6)],
                [competencias]), "B40")
    return salvar_workbook(wb)


def relatorio_coordenador(usuario):
    """Relatório da unidade do coordenador; o schema atual não associa várias unidades."""
    historico = dados_historico(usuario)
    eventos = banco.buscar_eventos_unidade(usuario["id_unidade"])
    usuarios = banco.buscar_usuarios_unidade(usuario["id_unidade"])
    planejamento = banco.buscar_planejamento_unidade(usuario["id_unidade"])
    wb = Workbook()
    aba = nova_aba(wb, "Visão do Coordenador",
                   f"{usuario['nome_unidade']} · {usuario['nome_municipio']}/{usuario['uf']}")
    atual = historico[-1]
    registros = []
    for nome, sufixo in AREAS.items():
        mun = numero(atual.get(f"municipio_{sufixo}"))
        est = numero(atual.get(f"estado_{sufixo}"))
        registros.append([nome, mun, est, (mun-est) if mun is not None and est is not None else None])
    escrever_tabela(aba, 6, ["Área", "Município", "Estado", "Diferença"], registros)
    anos = [str(x["ano"]) for x in historico]
    medias = [sum(numero(x.get(f"municipio_{sufixo}")) or 0 for sufixo in AREAS.values()) /
              sum(1 for sufixo in AREAS.values() if x.get(f"municipio_{sufixo}") is not None)
              for x in historico]
    inserir_grafico(aba, criar_grafico("linha", "Evolução da média das áreas",
                                       anos, [medias], ["Município"]), "B15")
    contagem = {}
    for ev in eventos:
        contagem[ev["professor"]] = contagem.get(ev["professor"], 0) + 1
    escrever_tabela(aba, 34, ["Professor", "Registros no ano"],
                    [[n, q] for n, q in sorted(contagem.items())])
    inserir_grafico(aba, criar_grafico("barra", "Registros por professor",
                                       list(contagem) or ["Sem registros"],
                                       [list(contagem.values()) or [0]],
                                       eixo_y="Registros"), "B43")
    escrever_tabela(aba, 62, ["Indicador", "Valor"], [
        ["Eventos cadastrados no semestre", planejamento["cadastrados"]],
        ["Meta de eventos no semestre", planejamento["meta"]],
        ["Usuários vinculados à unidade", len(usuarios)],
    ])
    escrever_tabela(aba, 70, ["Data", "Professor", "Evento", "Área", "Status"], [
        [str(e["data"]), e["professor"], e["nome"], e["area"] or "Não informada",
         "Concluído" if e["feita"] else "Pendente"] for e in eventos[:20]
    ])
    return salvar_workbook(wb)


def relatorio_diretor_filial(usuario, id_unidade):
    unidade = banco.validar_unidade_empresa(id_unidade, usuario["id_empresa"])
    historico = banco.buscar_historico(unidade["co_municipio"])
    if not historico:
        raise ValueError("Não há dados do ENEM para o município desta unidade.")
    eventos = banco.buscar_eventos_unidade(unidade["id"])
    planejamento = banco.buscar_planejamento_unidade(unidade["id"])
    wb = Workbook()
    aba = nova_aba(wb, "Diretor - Filial",
                   f"{unidade['nome']} · {unidade['nome_municipio']}/{unidade['uf']}")
    atual = historico[-1]
    comparativo = []
    for nome, suf in AREAS.items():
        comparativo.append([nome, numero(atual.get(f"municipio_{suf}")),
                            numero(atual.get(f"estado_{suf}"))])
    escrever_tabela(aba, 6, ["Área", "Município", "Estado"], comparativo)
    inserir_grafico(aba, criar_grafico(
        "barras_grupo", "Município x Estado por área",
        [x[0] for x in comparativo],
        [[x[1] or 0 for x in comparativo], [x[2] or 0 for x in comparativo]],
        ["Município", "Estado"]), "B15")
    anos = [str(x["ano"]) for x in historico]
    medias = [sum(numero(x.get(f"municipio_{s}")) or 0 for s in AREAS.values()) /
              max(1, sum(1 for s in AREAS.values() if x.get(f"municipio_{s}") is not None))
              for x in historico]
    inserir_grafico(aba, criar_grafico("linha", "Evolução da média municipal",
                                       anos, [medias], ["Município"]), "B34")
    escrever_tabela(aba, 54, ["Indicador", "Valor"], [
        ["Eventos cadastrados no semestre", planejamento["cadastrados"]],
        ["Meta de eventos no semestre", planejamento["meta"]],
        ["Professores com eventos no ano", len(set(e["id_usuario"] for e in eventos))],
    ])
    return salvar_workbook(wb)


def relatorio_diretor_rede(usuario):
    unidades = banco.buscar_unidades_empresa(usuario["id_empresa"])
    eventos = banco.buscar_eventos_empresa(usuario["id_empresa"])
    wb = Workbook()
    aba = nova_aba(wb, "Diretor - Rede", f"Empresa: {usuario['id_empresa']} · {len(unidades)} unidade(s)")
    linhas = []
    for un in unidades:
        hist = banco.buscar_historico(un["co_municipio"], limite=1)
        if not hist:
            continue
        atual = hist[-1]
        valores = [numero(atual.get(f"municipio_{s}")) for s in AREAS.values()]
        validos = [v for v in valores if v is not None]
        media = sum(validos) / len(validos) if validos else None
        linhas.append([un["nome"], un["nome_municipio"], un["uf"], media,
                       sum(1 for e in eventos if e["id_unidade"] == un["id"])])
    escrever_tabela(aba, 6, ["Unidade", "Município", "UF", "Média das áreas", "Eventos no ano"], linhas)
    inserir_grafico(aba, criar_grafico("barra", "Média por unidade",
                                       [x[0] for x in linhas] or ["Sem dados"],
                                       [[x[3] or 0 for x in linhas] or [0]]), "B16")
    por_area = []
    for nome, suf in AREAS.items():
        valores = []
        for un in unidades:
            hist = banco.buscar_historico(un["co_municipio"], limite=1)
            if hist and hist[-1].get(f"municipio_{suf}") is not None:
                valores.append(float(hist[-1][f"municipio_{suf}"]))
        por_area.append([nome, sum(valores)/len(valores) if valores else None])
    escrever_tabela(aba, 36, ["Área", "Média municipal média da rede"], por_area)
    inserir_grafico(aba, criar_grafico("barra", "Média por área na rede",
                                       [x[0] for x in por_area],
                                       [[x[1] or 0 for x in por_area]]), "B45")
    escrever_tabela(aba, 64, ["Indicador", "Valor"], [
        ["Unidades na empresa", len(unidades)],
        ["Eventos registrados no ano", len(eventos)],
        ["Professores com eventos registrados", len(set(e["id_usuario"] for e in eventos))],
    ])
    return salvar_workbook(wb)


def gerar_relatorio(tipo, id_usuario, id_unidade=None):
    """Valida cargo e escopo no banco antes de gerar o arquivo."""
    acesso = banco.buscar_escopo_usuario(id_usuario)
    usuario = acesso["usuario"]
    tipo = tipo.strip().lower()

    if tipo == "professor":
        if acesso["escopo"] != "individual":
            raise PermissionError("Somente professores podem gerar este relatório.")
        return relatorio_professor(usuario)

    if tipo == "coordenador":
        if acesso["escopo"] != "unidade":
            raise PermissionError("Somente coordenadores podem gerar este relatório.")
        return relatorio_coordenador(usuario)

    if tipo in ("diretor_rede", "diretor"):
        if acesso["escopo"] != "empresa":
            raise PermissionError("Somente o diretor geral pode gerar a visão da rede.")
        return relatorio_diretor_rede(usuario)

    if tipo == "diretor_filial":
        if acesso["escopo"] != "empresa":
            raise PermissionError("Somente o diretor geral pode consultar filiais.")
        if not id_unidade:
            raise ValueError("Informe id_unidade para o relatório da filial.")
        return relatorio_diretor_filial(usuario, int(id_unidade))

    raise ValueError("Tipo inválido. Use professor, coordenador, diretor_rede ou diretor_filial.")
