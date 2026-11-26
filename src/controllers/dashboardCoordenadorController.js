var dashboardCoordenadorModel = require("../models/dashboardCoordenadorModel");

/*
 * GET /dashboardCoordenador/unidade/:idUnidade
 * Dados básicos da unidade — resolve co_municipio e id_empresa a partir da sessão.
 */
function buscarUnidade(req, res) {
    var idUnidade = Number(req.params.idUnidade);
    if (!Number.isInteger(idUnidade) || idUnidade <= 0) {
        return res.status(400).json({ mensagem: "ID de unidade inválido." });
    }
    dashboardCoordenadorModel.buscarDadosUnidade(idUnidade)
        .then(function (resultado) {
            if (!resultado.length) {
                return res.status(404).json({ mensagem: "Unidade não encontrada." });
            }
            res.status(200).json(resultado[0]);
        })
        .catch(function (erro) {
            console.error("Erro ao buscar unidade:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

/*
 * GET /dashboardCoordenador/unidades/:idEmpresa
 * Lista todas as unidades da empresa para o modal de seleção.
 */
function listarUnidades(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({ mensagem: "ID de empresa inválido." });
    }
    dashboardCoordenadorModel.listarUnidadesDaEmpresa(idEmpresa)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error("Erro ao listar unidades:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

/*
 * GET /dashboardCoordenador/dados/:idUnidade
 *
 * Payload completo da dashboard em um único fetch:
 *   unidade, areaFraca, variacaoMedia, totalRegistros,
 *   historico, eventosPorMes, professores, atividadeRecente
 *
 * Query param opcional: ?ano=<ano>  (padrão = ano atual)
 */
function obterDadosDashboard(req, res) {
    var idUnidade = Number(req.params.idUnidade);
    if (!Number.isInteger(idUnidade) || idUnidade <= 0) {
        return res.status(400).json({ mensagem: "ID de unidade inválido." });
    }

    var anoAtual = Number(req.query.ano) || new Date().getFullYear();

    /* Passo 1 — resolve co_municipio a partir do idUnidade */
    dashboardCoordenadorModel.buscarDadosUnidade(idUnidade)
        .then(function (unidadeRows) {
            if (!unidadeRows.length) {
                return res.status(404).json({ mensagem: "Unidade não encontrada." });
            }
            var unidade     = unidadeRows[0];
            var coMunicipio = unidade.co_municipio;

            /* Passo 2 — 7 queries em paralelo */
            return Promise.all([
                dashboardCoordenadorModel.buscarAreaMaisFraca(coMunicipio),
                dashboardCoordenadorModel.buscarVariacaoMediaGeral(coMunicipio),
                dashboardCoordenadorModel.buscarTotalRegistros(idUnidade),
                dashboardCoordenadorModel.buscarHistoricoDesempenho(coMunicipio),
                dashboardCoordenadorModel.buscarEventosPorMes(idUnidade, anoAtual),
                dashboardCoordenadorModel.buscarRegistrosPorProfessor(idUnidade),
                dashboardCoordenadorModel.buscarAtividadeRecente(idUnidade),
            ]).then(function (r) {
                res.status(200).json({
                    unidade:          unidade,
                    areaFraca:        r[0][0] || null,
                    variacaoMedia:    r[1],
                    totalRegistros:   Number((r[2][0] || {}).total_registros) || 0,
                    historico:        r[3],
                    eventosPorMes:    r[4],
                    professores:      r[5],
                    atividadeRecente: r[6],
                });
            });
        })
        .catch(function (erro) {
            console.error("Erro ao obter dados da dashboard do coordenador:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

module.exports = {
    buscarUnidade,
    listarUnidades,
    obterDadosDashboard,
};
