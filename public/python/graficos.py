
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd
import os


VINHO = "#7a1f3d"
VINHO_CLARO = "#b76b84"
CINZA = "#e5e5e5"
CINZA_TEXTO = "#666666"
CINZA_LINHA = "#eeeeee"


def configurar_grafico(fig, ax, titulo):

    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    ax.set_title(
        titulo,
        fontsize=14,
        fontweight="bold",
        color=VINHO,
        pad=18
    )

    ax.tick_params(
        axis="both",
        labelsize=9,
        colors=CINZA_TEXTO
    )

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    ax.spines["left"].set_color(CINZA)
    ax.spines["bottom"].set_color(CINZA)

    ax.grid(
        axis="y",
        color=CINZA_LINHA,
        linewidth=0.8
    )

    ax.set_axisbelow(True)


def gerar_graficos(nome_area, dados_area, pasta):

    caminhos = {}

    kpis = dados_area["kpis"]

    # GRÁFICO DE PROGRESSO

    eventos = kpis["eventosCadastrados"]
    meta = kpis["metaEventos"]

    fig, ax = plt.subplots(figsize=(5, 4))

    fig.patch.set_facecolor("white")

    if meta > 0:

        restantes = max(meta - eventos, 0)

        ax.pie(
            [eventos, restantes],
            colors=[VINHO, CINZA],
            startangle=90,
            counterclock=False,
            wedgeprops={
                "width": 0.32,
                "edgecolor": "white",
                "linewidth": 2
            }
        )

        percentual = min(eventos / meta, 1) * 100

        ax.text(
            0,
            0,
            f"{percentual:.0f}%",
            ha="center",
            va="center",
            fontsize=23,
            fontweight="bold",
            color=VINHO
        )

    else:

        ax.text(
            0,
            0,
            "Sem meta",
            ha="center",
            va="center",
            fontsize=16,
            color=CINZA_TEXTO
        )

    ax.set_title(
        "Progresso do planejamento",
        fontsize=14,
        fontweight="bold",
        color=VINHO,
        pad=15
    )

    ax.axis("equal")

    caminho_progresso = os.path.join(
        pasta,
        f"{nome_area}_progresso.png"
    )

    fig.savefig(
        caminho_progresso,
        dpi=150,
        bbox_inches="tight",
        facecolor="white"
    )

    plt.close(fig)

    caminhos["progresso"] = caminho_progresso

    # GRÁFICO HISTÓRICO

    historico = pd.DataFrame(
        dados_area["historico"]
    )

    fig, ax = plt.subplots(figsize=(7, 4))

    configurar_grafico(
        fig,
        ax,
        "Desempenho: Estado vs. Município"
    )

    ax.plot(
        historico["ano"],
        historico["estado"],
        marker="o",
        markersize=7,
        linewidth=2.5,
        label="Estado",
        color="#999999"
    )

    ax.plot(
        historico["ano"],
        historico["municipio"],
        marker="o",
        markersize=7,
        linewidth=2.5,
        label="Município",
        color=VINHO
    )

    ax.set_xlabel(
        "Ano",
        fontsize=10,
        color=CINZA_TEXTO
    )

    ax.set_ylabel(
        "Pontuação média",
        fontsize=10,
        color=CINZA_TEXTO
    )

    ax.legend(
        frameon=False,
        fontsize=9,
        loc="best"
    )

    ax.grid(
        axis="x",
        visible=False
    )

    fig.tight_layout()

    caminho_historico = os.path.join(
        pasta,
        f"{nome_area}_historico.png"
    )

    fig.savefig(
        caminho_historico,
        dpi=150,
        bbox_inches="tight",
        facecolor="white"
    )

    plt.close(fig)

    caminhos["historico"] = caminho_historico

    # GRÁFICO DE COMPETÊNCIAS DE REDACAO

    if nome_area == "redacao":

        competencias = pd.DataFrame(
            dados_area["competencias"]
        )

        fig, ax = plt.subplots(figsize=(9, 4))

        configurar_grafico(
            fig,
            ax,
            "Desempenho por competência"
        )

        barras = ax.bar(
            competencias["nome"],
            competencias["pontuacao"],
            color=VINHO,
            width=0.55
        )

        ax.set_ylabel(
            "Pontuação",
            fontsize=10,
            color=CINZA_TEXTO
        )

        ax.set_ylim(0, 220)

        ax.set_xticks(
            range(len(competencias))
        )

        ax.set_xticklabels(
            competencias["nome"],
            fontsize=9
        )

        ax.grid(
            axis="x",
            visible=False
        )

        # Valores acima das barras
        for barra in barras:

            altura = barra.get_height()

            ax.text(
                barra.get_x() + barra.get_width() / 2,
                altura + 5,
                f"{altura:.0f}",
                ha="center",
                va="bottom",
                fontsize=9,
                color=CINZA_TEXTO
            )

        fig.tight_layout()

        caminho_competencias = os.path.join(
            pasta,
            "redacao_competencias.png"
        )

        fig.savefig(
            caminho_competencias,
            dpi=150,
            bbox_inches="tight",
            facecolor="white"
        )

        plt.close(fig)

        caminhos["competencias"] = caminho_competencias

    return caminhos
