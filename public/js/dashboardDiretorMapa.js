(function () {
    const URL_ESTADOS = "https://cdn.jsdelivr.net/gh/henriquemalvar/br-geojson@main/dist/estados.geojson";
    const URL_MUNICIPIOS = "https://cdn.jsdelivr.net/gh/henriquemalvar/br-geojson@main/dist/municipios/";
    const META_MEDIA_ENEM = 600;
    const CORES_CONTAGEM = {
        semDados: "#e5e7eb",
        zero: "#d8e9df",
        um: "#f5d775",
        dois: "#ee9a57",
        tresOuMais: "#c85858"
    };
    const ESCALA_NOTAS = [
        { nota: 500, cor: "#7f1d1d" },
        { nota: 560, cor: "#c2413b" },
        { nota: 600, cor: "#fca5a5" },
        { nota: 650, cor: "#f4e6a1" },
        { nota: 700, cor: "#d8e9df" }
    ];

    const elementoMapa = document.getElementById("opportunity-map");
    if (!elementoMapa) return;

    const status = document.getElementById("opportunity-map-status");
    if (typeof L === "undefined") {
        status.textContent = "Não foi possível iniciar o mapa. Verifique sua conexão e recarregue a página.";
        return;
    }

    const mapa = L.map(elementoMapa, {
        minZoom: 3,
        maxZoom: 12,
        scrollWheelZoom: false,
        renderer: L.svg({ padding: 0.25 })
    });

    let camadaEstados;
    let camadaMunicipios;
    let solicitacaoAtual = 0;
    let municipiosDemonstrativos = [];
    let ufSelecionada = "";
    let nomeEstadoSelecionado = "";
    let estadoEmDestaque = null;
    let municipioEmDestaque = null;
    let notasPorCodigo = new Map();
    let notasPorNome = new Map();
    const tooltipMapa = L.tooltip({ sticky: true, direction: "top", opacity: 0.95 });

    const botaoVoltar = document.getElementById("map-back-to-brazil");
    const visualizacaoAtual = document.getElementById("map-current-view");
    const listaAtencao = document.getElementById("attention-ranking");
    const escopoAtencao = document.getElementById("attention-scope");
    const legendaEstados = document.getElementById("legend-estados");
    const legendaMunicipios = document.getElementById("legend-municipios");

    function reconstruirIndiceNotas() {
        notasPorCodigo = new Map();
        notasPorNome = new Map();

        municipiosDemonstrativos.forEach(function (municipio) {
            const nota = Number(municipio.mediaEnem);
            if (!Number.isFinite(nota)) return;
            if (municipio.codigoIbge) notasPorCodigo.set(String(municipio.codigoIbge), nota);
            notasPorNome.set(municipio.uf + "|" + normalizarNome(municipio.municipio), nota);
        });
    }

    function obterNotaMunicipio(feature) {
        const propriedades = feature.properties || {};
        const codigo = String(propriedades.cd_geocmu || propriedades.codigo_ibge || "");
        if (codigo && notasPorCodigo.has(codigo)) return notasPorCodigo.get(codigo);

        const nome = propriedades.nome || propriedades.name || "";
        return notasPorNome.get(ufSelecionada + "|" + normalizarNome(nome));
    }

    function interpolarCorNota(nota) {
        const valor = Math.max(ESCALA_NOTAS[0].nota, Math.min(ESCALA_NOTAS[ESCALA_NOTAS.length - 1].nota, nota));
        let inferior = ESCALA_NOTAS[0];
        let superior = ESCALA_NOTAS[ESCALA_NOTAS.length - 1];

        for (let indice = 1; indice < ESCALA_NOTAS.length; indice++) {
            if (valor <= ESCALA_NOTAS[indice].nota) {
                inferior = ESCALA_NOTAS[indice - 1];
                superior = ESCALA_NOTAS[indice];
                break;
            }
        }

        const proporcao = (valor - inferior.nota) / (superior.nota - inferior.nota);
        const canal = function (cor, posicao) {
            return parseInt(cor.slice(posicao, posicao + 2), 16);
        };
        const rgb = [1, 3, 5].map(function (posicao) {
            const inicio = canal(inferior.cor, posicao);
            const fim = canal(superior.cor, posicao);
            return Math.round(inicio + (fim - inicio) * proporcao);
        });

        return "#" + rgb.map(function (valorCanal) {
            return valorCanal.toString(16).padStart(2, "0");
        }).join("");
    }

    function estiloMunicipio(feature) {
        const nota = obterNotaMunicipio(feature);
        return {
            color: "#ffffff",
            weight: 0.45,
            fillColor: nota === undefined ? CORES_CONTAGEM.semDados : interpolarCorNota(nota),
            fillOpacity: 0.9
        };
    }

    function resumoEstado(uf) {
        const municipiosComNota = municipiosDemonstrativos.filter(function (municipio) {
            return municipio.uf === uf && Number.isFinite(Number(municipio.mediaEnem));
        });

        return {
            total: municipiosComNota.length,
            abaixoDaMeta: municipiosComNota.filter(function (municipio) {
                return Number(municipio.mediaEnem) < META_MEDIA_ENEM;
            }).length
        };
    }

    function estiloEstado(feature) {
        const resumo = resumoEstado(siglaEstado(feature));
        let fillColor = CORES_CONTAGEM.semDados;

        if (resumo.total > 0) {
            if (resumo.abaixoDaMeta === 0) fillColor = CORES_CONTAGEM.zero;
            else if (resumo.abaixoDaMeta === 1) fillColor = CORES_CONTAGEM.um;
            else if (resumo.abaixoDaMeta === 2) fillColor = CORES_CONTAGEM.dois;
            else fillColor = CORES_CONTAGEM.tresOuMais;
        }

        return {
            color: "#ffffff",
            weight: 1.8,
            lineCap: "round",
            lineJoin: "round",
            fillColor: fillColor,
            fillOpacity: 0.9
        };
    }

    function descricaoEstado(uf) {
        const resumo = resumoEstado(uf);
        if (resumo.total === 0) return "Sem médias demonstrativas disponíveis";
        return resumo.abaixoDaMeta + " de " + resumo.total + " municípios com nota abaixo da meta de " + META_MEDIA_ENEM;
    }

    function atualizarRankingAtencao() {
        const municipios = municipiosDemonstrativos
            .filter(function (municipio) {
                return !ufSelecionada || municipio.uf === ufSelecionada;
            })
            .sort(function (a, b) {
                return Number(a.mediaEnem) - Number(b.mediaEnem);
            })
            .slice(0, 5);

        escopoAtencao.textContent = (nomeEstadoSelecionado || "Brasil") + " · menores médias ENEM";
        listaAtencao.replaceChildren();

        if (municipios.length === 0) {
            const vazio = document.createElement("li");
            vazio.className = "attention-empty";
            vazio.textContent = "Sem médias demonstrativas disponíveis para esta seleção.";
            listaAtencao.appendChild(vazio);
            return;
        }

        municipios.forEach(function (municipio, indice) {
            const linha = document.createElement("li");
            const botao = document.createElement("button");
            const posicao = document.createElement("span");
            const nome = document.createElement("span");
            const uf = document.createElement("small");
            const media = document.createElement("strong");

            botao.type = "button";
            botao.className = "attention-place";
            botao.setAttribute("aria-label", "Focar no mapa: " + municipio.municipio + ", " + municipio.uf);
            posicao.className = "attention-rank";
            posicao.textContent = String(indice + 1);
            nome.className = "attention-city";
            nome.textContent = municipio.municipio;
            uf.className = "attention-uf";
            uf.textContent = municipio.uf;
            media.className = "attention-score";
            media.textContent = Number(municipio.mediaEnem).toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }) + " pts";

            nome.appendChild(uf);
            botao.append(posicao, nome, media);
            botao.addEventListener("click", function () {
                focarMunicipio(municipio);
            });
            linha.appendChild(botao);
            listaAtencao.appendChild(linha);
        });
    }

    function normalizarNome(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("pt-BR")
            .trim();
    }

    async function focarMunicipio(municipio) {
        if (ufSelecionada !== municipio.uf || !camadaMunicipios) {
            if (!camadaEstados) {
                status.textContent = "O mapa ainda está carregando. Tente novamente em instantes.";
                return;
            }

            let nomeDoEstado = municipio.uf;
            camadaEstados.eachLayer(function (camada) {
                if (siglaEstado(camada.feature) === municipio.uf) {
                    nomeDoEstado = nomeEstado(camada.feature);
                }
            });

            const abriuEstado = await abrirEstado(municipio.uf, nomeDoEstado);
            if (!abriuEstado) return;
        }

        let camadaAlvo;
        const codigoMunicipio = String(municipio.codigoIbge || "");
        camadaMunicipios.eachLayer(function (camada) {
            const propriedades = camada.feature.properties || {};
            const codigo = String(propriedades.cd_geocmu || propriedades.codigo_ibge || "");
            const nome = propriedades.nome || propriedades.name || "";

            if ((codigoMunicipio && codigo === codigoMunicipio) || normalizarNome(nome) === normalizarNome(municipio.municipio)) {
                camadaAlvo = camada;
            }
        });

        if (!camadaAlvo) {
            status.textContent = "Não encontramos o município no mapa deste estado.";
            return;
        }

        mapa.fitBounds(camadaAlvo.getBounds(), { padding: [32, 32], maxZoom: 9 });
        camadaAlvo.openPopup();
        status.textContent = municipio.municipio + " (" + municipio.uf + ") selecionado no mapa.";
    }

    async function carregarMediasDemonstrativas() {
        try {
            const resposta = await fetch("../dados/municipios-enem-demonstrativos.json");
            if (!resposta.ok) throw new Error("Falha ao carregar médias demonstrativas.");
            const dados = await resposta.json();
            municipiosDemonstrativos = Array.isArray(dados.municipios) ? dados.municipios : [];
            reconstruirIndiceNotas();
            atualizarRankingAtencao();
            if (camadaEstados) camadaEstados.setStyle(estiloEstado);
            if (camadaMunicipios) camadaMunicipios.setStyle(estiloMunicipio);
        } catch (erro) {
            console.error("Não foi possível carregar as médias demonstrativas:", erro);
            listaAtencao.replaceChildren();
            const vazio = document.createElement("li");
            vazio.className = "attention-empty";
            vazio.textContent = "Não foi possível carregar a lista de atenção.";
            listaAtencao.appendChild(vazio);
        }
    }

    function nomeEstado(feature) {
        const propriedades = feature.properties || {};
        return propriedades.nome || propriedades.name || "Estado";
    }

    function siglaEstado(feature) {
        const propriedades = feature.properties || {};
        return propriedades.sigla || propriedades.uf || propriedades.abbrev || "";
    }

    function configurarEstado(feature, camada) {
        const nome = nomeEstado(feature);
        const sigla = siglaEstado(feature);

        camada.on("mouseover", function (evento) {
            if (estadoEmDestaque && estadoEmDestaque !== camada) {
                estadoEmDestaque.setStyle(estiloEstado(estadoEmDestaque.feature));
            }
            estadoEmDestaque = camada;
            camada.bringToFront();
            camada.setStyle(Object.assign({}, estiloEstado(camada.feature), { weight: 2.5, color: "#7a1f3d" }));
            tooltipMapa
                .setContent((sigla ? nome + " (" + sigla + ")" : nome) + " · " + descricaoEstado(sigla))
                .setLatLng(evento.latlng);
            mapa.openTooltip(tooltipMapa);
        });
        camada.on("mousemove", function (evento) {
            tooltipMapa.setLatLng(evento.latlng);
        });
        camada.on("mouseout", function () {
            if (estadoEmDestaque !== camada) return;
            camada.setStyle(estiloEstado(camada.feature));
            estadoEmDestaque = null;
            mapa.closeTooltip(tooltipMapa);
        });
        camada.on("click", function () {
            abrirEstado(sigla, nome);
        });
    }

    async function abrirEstado(uf, nome) {
        if (!uf) {
            status.textContent = "Não foi possível identificar a UF deste estado.";
            return false;
        }

        const solicitacao = ++solicitacaoAtual;
        status.textContent = "Carregando municípios de " + nome + "...";

        try {
            const resposta = await fetch(URL_MUNICIPIOS + encodeURIComponent(uf) + ".geojson");
            if (!resposta.ok) throw new Error("Falha ao carregar municípios.");
            const dados = await resposta.json();
            if (solicitacao !== solicitacaoAtual) return false;

            if (camadaMunicipios) {
                municipioEmDestaque = null;
                estadoEmDestaque = null;
                mapa.closeTooltip(tooltipMapa);
                mapa.removeLayer(camadaMunicipios);
            }
            estadoEmDestaque = null;
            mapa.closeTooltip(tooltipMapa);
            mapa.removeLayer(camadaEstados);
            ufSelecionada = uf;
            nomeEstadoSelecionado = nome;

            camadaMunicipios = L.geoJSON(dados, {
                style: estiloMunicipio,
                onEachFeature: function (feature, camada) {
                    const propriedades = feature.properties || {};
                    const nomeMunicipio = propriedades.nome || propriedades.name || "Município";
                    const nota = obterNotaMunicipio(feature);
                    const textoPopup = nota === undefined
                        ? nomeMunicipio + "<br>Sem média demonstrativa"
                        : nomeMunicipio + "<br>Média ENEM: " + nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " pontos";
                    camada.bindPopup(textoPopup);
                    camada.on("mouseover", function (evento) {
                        if (municipioEmDestaque && municipioEmDestaque !== camada) {
                            municipioEmDestaque.setStyle(estiloMunicipio(municipioEmDestaque.feature));
                        }
                        municipioEmDestaque = camada;
                        camada.bringToFront();
                        camada.setStyle(Object.assign({}, estiloMunicipio(camada.feature), { weight: 2, color: "#7a1f3d" }));
                        tooltipMapa
                            .setContent(textoPopup)
                            .setLatLng(evento.latlng);
                        mapa.openTooltip(tooltipMapa);
                    });
                    camada.on("mousemove", function (evento) {
                        tooltipMapa.setLatLng(evento.latlng);
                    });
                    camada.on("mouseout", function () {
                        if (municipioEmDestaque !== camada) return;
                        camada.setStyle(estiloMunicipio(camada.feature));
                        municipioEmDestaque = null;
                        mapa.closeTooltip(tooltipMapa);
                    });
                }
            }).addTo(mapa);

            mapa.fitBounds(camadaMunicipios.getBounds(), { padding: [12, 12] });
            visualizacaoAtual.textContent = nome + (uf ? " (" + uf + ")" : "");
            botaoVoltar.hidden = false;
            legendaEstados.hidden = true;
            legendaMunicipios.hidden = false;
            status.textContent = "Municípios de " + nome + ". Passe o cursor ou selecione uma área para ver o nome.";
            atualizarRankingAtencao();
            return true;
        } catch (erro) {
            if (solicitacao !== solicitacaoAtual) return false;
            console.error("Não foi possível carregar os municípios:", erro);
            status.textContent = "Não foi possível carregar os municípios. Verifique sua conexão e tente outro estado.";
            return false;
        }
    }

    function voltarAoBrasil() {
        solicitacaoAtual++;
        municipioEmDestaque = null;
        mapa.closeTooltip(tooltipMapa);
        if (camadaMunicipios) mapa.removeLayer(camadaMunicipios);
        camadaEstados.addTo(mapa);
        mapa.fitBounds(camadaEstados.getBounds(), { padding: [12, 12] });
        ufSelecionada = "";
        nomeEstadoSelecionado = "";
        legendaEstados.hidden = false;
        legendaMunicipios.hidden = true;
        visualizacaoAtual.textContent = "Brasil";
        botaoVoltar.hidden = true;
        status.textContent = "Selecione um estado para visualizar seus municípios.";
        atualizarRankingAtencao();
    }

    async function iniciar() {
        try {
            const resposta = await fetch(URL_ESTADOS);
            if (!resposta.ok) throw new Error("Falha ao carregar estados.");
            const dados = await resposta.json();

            camadaEstados = L.geoJSON(dados, {
                style: estiloEstado,
                onEachFeature: configurarEstado
            }).addTo(mapa);

            mapa.fitBounds(camadaEstados.getBounds(), { padding: [12, 12] });
            status.textContent = "Selecione um estado para visualizar seus municípios.";
        } catch (erro) {
            console.error("Não foi possível carregar o mapa do Brasil:", erro);
            status.textContent = "Não foi possível carregar os estados brasileiros. Verifique sua conexão.";
        }
    }

    botaoVoltar.addEventListener("click", voltarAoBrasil);
    carregarMediasDemonstrativas();
    iniciar();
})();
