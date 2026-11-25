var dashboardCoordenadorModel = require("../models/dashboardCoordenadorModel");

/* Retorna a lista de municípios de uma UF. */
function listarMunicipios(req, res) {
    var uf = req.params.uf;

    if (!uf) {
        return res.status(400).json({ mensagem: "A UF não foi informada." });
    }

    dashboardCoordenadorModel.listarMunicipiosPorUf(uf.toUpperCase())
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error("Erro ao listar municípios:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

/*
 * Retorna histórico de desempenho do município + progresso do
 * planejamento da unidade (para popular os gráficos e KPIs).
 */
function obterDadosDashboard(req, res) {
    var coMunicipio = req.params.coMunicipio;
    var idUnidade   = req.query.idUnidade   || null;
    var idUsuario   = req.query.idUsuario   || null;

    var dataAtual     = new Date();
    var anoAtual      = Number(req.query.ano)      || dataAtual.getFullYear();
    var semestreAtual = Number(req.query.semestre) || (dataAtual.getMonth() < 6 ? 1 : 2);

    if (!coMunicipio) {
        return res.status(400).json({ mensagem: "O código do município (coMunicipio) é obrigatório." });
    }

    Promise.all([
        dashboardCoordenadorModel.buscarHistoricoDesempenho(coMunicipio),
        dashboardCoordenadorModel.buscarProgressoPlanejamento(idUnidade, idUsuario, anoAtual, semestreAtual),
    ])
        .then(function (resultados) {
            var historico       = resultados[0];
            var planejamentoRow = resultados[1][0] || {};

            res.status(200).json({
                historico: historico,
                planejamento: {
                    cadastrados: Number(planejamentoRow.total_eventos)      || 0,
                    concluidos:  Number(planejamentoRow.eventos_concluidos) || 0,
                    meta:        Number(planejamentoRow.meta_eventos)       || 10,
                },
            });
        })
        .catch(function (erro) {
            console.error("Erro ao obter dados da dashboard do coordenador:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

/* Retorna os professores da unidade com contagem de registros. */
function listarProfessores(req, res) {
    var idUnidade = Number(req.params.idUnidade);

    if (!Number.isInteger(idUnidade) || idUnidade <= 0) {
        return res.status(400).json({ mensagem: "ID de unidade inválido." });
    }

    dashboardCoordenadorModel.listarProfessoresDaUnidade(idUnidade)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error("Erro ao listar professores:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

module.exports = {
    listarMunicipios,
    obterDadosDashboard,
    listarProfessores,
};
