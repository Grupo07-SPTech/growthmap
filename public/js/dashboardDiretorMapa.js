(function () {
    const URL_ESTADOS = "https://cdn.jsdelivr.net/gh/henriquemalvar/br-geojson@main/dist/estados.geojson";
    const URL_MUNICIPIOS = "https://cdn.jsdelivr.net/gh/henriquemalvar/br-geojson@main/dist/municipios/";

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
    const tooltipMapa = L.tooltip({ sticky: true, direction: "top", opacity: 0.95 });

    const botaoVoltar = document.getElementById("map-back-to-brazil");
    const visualizacaoAtual = document.getElementById("map-current-view");
    const listaAtencao = document.getElementById("attention-ranking");
    const escopoAtencao = document.getElementById("attention-scope");

    const estiloEstado = {
        color: "#ffffff",
        weight: 1.8,
        lineCap: "round",
        lineJoin: "round",
        fillColor: "#d8e1e8",
        fillOpacity: 0.9
    };

    const estiloMunicipio = {
        color: "#ffffff",
        weight: 0.45,
        fillColor: "#d8e1e8",
        fillOpacity: 0.9
    };

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
            atualizarRankingAtencao();
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
                estadoEmDestaque.setStyle(estiloEstado);
            }
            estadoEmDestaque = camada;
            camada.bringToFront();
            camada.setStyle({ fillColor: "#b9c9d5", weight: 2.5, color: "#7a1f3d" });
            tooltipMapa
                .setContent(sigla ? nome + " (" + sigla + ")" : nome)
                .setLatLng(evento.latlng);
            mapa.openTooltip(tooltipMapa);
        });
        camada.on("mousemove", function (evento) {
            tooltipMapa.setLatLng(evento.latlng);
        });
        camada.on("mouseout", function () {
            if (estadoEmDestaque !== camada) return;
            camada.setStyle(estiloEstado);
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

            camadaMunicipios = L.geoJSON(dados, {
                style: estiloMunicipio,
                onEachFeature: function (feature, camada) {
                    const propriedades = feature.properties || {};
                    const nomeMunicipio = propriedades.nome || propriedades.name || "Município";
                    camada.bindPopup(nomeMunicipio);
                    camada.on("mouseover", function (evento) {
                        if (municipioEmDestaque && municipioEmDestaque !== camada) {
                            municipioEmDestaque.setStyle(estiloMunicipio);
                        }
                        municipioEmDestaque = camada;
                        camada.bringToFront();
                        camada.setStyle({ fillColor: "#b9c9d5", weight: 2, color: "#7a1f3d" });
                        tooltipMapa
                            .setContent(nomeMunicipio)
                            .setLatLng(evento.latlng);
                        mapa.openTooltip(tooltipMapa);
                    });
                    camada.on("mousemove", function (evento) {
                        tooltipMapa.setLatLng(evento.latlng);
                    });
                    camada.on("mouseout", function () {
                        if (municipioEmDestaque !== camada) return;
                        camada.setStyle(estiloMunicipio);
                        municipioEmDestaque = null;
                        mapa.closeTooltip(tooltipMapa);
                    });
                }
            }).addTo(mapa);

            mapa.fitBounds(camadaMunicipios.getBounds(), { padding: [12, 12] });
            ufSelecionada = uf;
            nomeEstadoSelecionado = nome;
            visualizacaoAtual.textContent = nome + (uf ? " (" + uf + ")" : "");
            botaoVoltar.hidden = false;
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
