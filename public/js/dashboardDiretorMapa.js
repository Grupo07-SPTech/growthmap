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

    const botaoVoltar = document.getElementById("map-back-to-brazil");
    const visualizacaoAtual = document.getElementById("map-current-view");

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

        camada.bindTooltip(sigla ? nome + " (" + sigla + ")" : nome);
        camada.on("mouseover", function () {
            camada.bringToFront();
            camada.setStyle({ fillColor: "#b9c9d5", weight: 2.5, color: "#7a1f3d" });
        });
        camada.on("mouseout", function () {
            camada.setStyle(estiloEstado);
        });
        camada.on("click", function () {
            abrirEstado(sigla, nome);
        });
    }

    async function abrirEstado(uf, nome) {
        if (!uf) {
            status.textContent = "Não foi possível identificar a UF deste estado.";
            return;
        }

        const solicitacao = ++solicitacaoAtual;
        status.textContent = "Carregando municípios de " + nome + "...";

        try {
            const resposta = await fetch(URL_MUNICIPIOS + encodeURIComponent(uf) + ".geojson");
            if (!resposta.ok) throw new Error("Falha ao carregar municípios.");
            const dados = await resposta.json();
            if (solicitacao !== solicitacaoAtual) return;

            if (camadaMunicipios) mapa.removeLayer(camadaMunicipios);
            mapa.removeLayer(camadaEstados);

            camadaMunicipios = L.geoJSON(dados, {
                style: estiloMunicipio,
                onEachFeature: function (feature, camada) {
                    const propriedades = feature.properties || {};
                    const nomeMunicipio = propriedades.nome || propriedades.name || "Município";
                    camada.bindTooltip(nomeMunicipio);
                    camada.bindPopup(nomeMunicipio);
                    camada.on("mouseover", function () {
                        camada.bringToFront();
                        camada.setStyle({ fillColor: "#b9c9d5", weight: 2, color: "#7a1f3d" });
                    });
                    camada.on("mouseout", function () {
                        camada.setStyle(estiloMunicipio);
                    });
                }
            }).addTo(mapa);

            mapa.fitBounds(camadaMunicipios.getBounds(), { padding: [12, 12] });
            visualizacaoAtual.textContent = nome + (uf ? " (" + uf + ")" : "");
            botaoVoltar.hidden = false;
            status.textContent = "Municípios de " + nome + ". Passe o cursor ou selecione uma área para ver o nome.";
        } catch (erro) {
            if (solicitacao !== solicitacaoAtual) return;
            console.error("Não foi possível carregar os municípios:", erro);
            status.textContent = "Não foi possível carregar os municípios. Verifique sua conexão e tente outro estado.";
        }
    }

    function voltarAoBrasil() {
        solicitacaoAtual++;
        if (camadaMunicipios) mapa.removeLayer(camadaMunicipios);
        camadaEstados.addTo(mapa);
        mapa.fitBounds(camadaEstados.getBounds(), { padding: [12, 12] });
        visualizacaoAtual.textContent = "Brasil";
        botaoVoltar.hidden = true;
        status.textContent = "Selecione um estado para visualizar seus municípios.";
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
    iniciar();
})();
