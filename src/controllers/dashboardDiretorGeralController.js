var dashboardDiretorGeralModel = require("../models/dashboardDiretorGeralModel");

function listarAnos(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({ mensagem: "ID da empresa inválido." });
    }

    dashboardDiretorGeralModel.listarAnos(idEmpresa)
        .then(function (registros) {
            res.status(200).json(registros.map(function (registro) { return Number(registro.ano); }));
        })
        .catch(function (erro) {
            console.error("Erro ao listar anos:", erro);
            res.status(500).json({ mensagem: "Não foi possível carregar os anos." });
        });
}

function obterDadosRede(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var anoSolicitado = req.query.ano === undefined ? null : Number(req.query.ano);
    var anoPlanejamento = req.query.anoPlanejamento === undefined
        ? new Date().getFullYear()
        : Number(req.query.anoPlanejamento);
    var semestre = req.query.semestre === undefined
        ? (new Date().getMonth() < 6 ? 1 : 2)
        : Number(req.query.semestre);

    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({ mensagem: "ID da empresa inválido." });
    }
    if (anoSolicitado !== null && !validarAno(anoSolicitado)) {
        return res.status(400).json({ mensagem: "Ano do ENEM inválido." });
    }
    if (!validarAno(anoPlanejamento) || (semestre !== 1 && semestre !== 2)) {
        return res.status(400).json({ mensagem: "Ano ou semestre do planejamento inválido." });
    }

    dashboardDiretorGeralModel.listarAnos(idEmpresa)
        .then(function (registrosAnos) {
            var anos = registrosAnos.map(function (registro) { return Number(registro.ano); });
            var ano = anoSolicitado || anos[0];
            if (!ano) return res.status(404).json({ mensagem: "Não há anos com dados regionais e estaduais para a empresa." });
            if (anos.indexOf(ano) < 0) return res.status(404).json({ mensagem: "Não há dados comparáveis para o ano selecionado." });

            var inicio = anoPlanejamento + (semestre === 1 ? "-01-01" : "-07-01");
            var fim = semestre === 1 ? anoPlanejamento + "-07-01" : (anoPlanejamento + 1) + "-01-01";
            return Promise.all([
                dashboardDiretorGeralModel.buscarDesempenhoMunicipios(idEmpresa, ano),
                dashboardDiretorGeralModel.listarUsuariosUnidades(idEmpresa),
                dashboardDiretorGeralModel.listarEventosUnidades(idEmpresa, inicio, fim)
            ]).then(function (resultados) {
                res.status(200).json({
                    ano: ano,
                    anoPlanejamento: anoPlanejamento,
                    semestre: semestre,
                    municipios: resultados[0],
                    unidades: resultados[1],
                    eventos: resultados[2]
                });
            });
        })
        .catch(function (erro) {
            console.error("Erro ao buscar dados da dashboard:", erro);
            res.status(500).json({ mensagem: "Não foi possível carregar os dados da dashboard." });
        });
}

function obterDadosMapa(req, res) {
    var ano = Number(req.params.ano);
    if (!validarAno(ano)) return res.status(400).json({ mensagem: "Ano inválido." });

    dashboardDiretorGeralModel.buscarDadosMapa(ano)
        .then(function (registros) {
            res.status(200).json({
                ano: ano,
                municipios: registros.map(function (registro) {
                    return {
                        codigoIbge: String(registro.co_municipio),
                        municipio: registro.nome_municipio,
                        uf: registro.uf,
                        mediaEnem: registro.media_municipal,
                        mediaEstadualEnem: registro.media_estadual
                    };
                })
            });
        })
        .catch(function (erro) {
            console.error("Erro ao buscar dados do mapa:", erro);
            res.status(500).json({ mensagem: "Não foi possível carregar os dados do mapa." });
        });
}

function validarAno(ano) {
    return Number.isInteger(ano) && ano >= 2000 && ano <= 2100;
}

module.exports = {
    listarAnos,
    obterDadosRede,
    obterDadosMapa
};
