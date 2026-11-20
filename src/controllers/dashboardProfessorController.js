var dashboardProfessorModel = require("../models/dashboardProfessorModel");

function listarMunicipios(req, res) {
    var uf = req.params.uf;

    if (!uf) {
        return res.status(400).json({ mensagem: "A UF não foi informada." });
    }

    dashboardProfessorModel.listarMunicipiosPorUf(uf.toUpperCase())
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error("Erro ao listar municípios:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

function obterDadosDashboard(req, res) {
    var coMunicipio = req.params.coMunicipio;
    var idUnidade = req.query.idUnidade || null;
    var idUsuario = req.query.idUsuario || null;

    var dataAtual = new Date();
    var anoAtual = Number(req.query.ano) || dataAtual.getFullYear();
    var semestreAtual = Number(req.query.semestre) || (dataAtual.getMonth() < 6 ? 1 : 2);

    if (!coMunicipio) {
        return res.status(400).json({ mensagem: "O código do município (coMunicipio) é obrigatório." });
    }

    Promise.all([
        dashboardProfessorModel.buscarHistoricoDesempenho(coMunicipio),
        dashboardProfessorModel.buscarProgressoPlanejamento(idUnidade, idUsuario, anoAtual, semestreAtual)
    ])
        .then(function ([historico, planejamentoRows]) {
            var plan = planejamentoRows[0] || { total_eventos: 0, eventos_concluidos: 0, meta_eventos: 10 };
            var cadastrados = Number(plan.total_eventos) || 0;
            var concluidos = Number(plan.eventos_concluidos) || 0;
            var meta = Number(plan.meta_eventos) || 10;

            res.status(200).json({
                historico: historico,
                planejamento: {
                    cadastrados: cadastrados,
                    concluidos: concluidos,
                    meta: meta
                }
            });
        })
        .catch(function (erro) {
            console.error("Erro ao obter dados da dashboard:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

module.exports = {
    listarMunicipios,
    obterDadosDashboard
};