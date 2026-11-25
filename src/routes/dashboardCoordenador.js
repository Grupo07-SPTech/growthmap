var express = require("express");
var router = express.Router();

var dashboardCoordenadorController = require("../controllers/dashboardCoordenadorController");

/* Lista municípios por UF — usado no filtro da dashboard */
router.get("/municipios/:uf", function (req, res) {
    dashboardCoordenadorController.listarMunicipios(req, res);
});

/*
 * Retorna histórico de desempenho do município + progresso
 * do planejamento (gráficos e KPIs da dashboard).
 * Query params opcionais: idUnidade, idUsuario, ano, semestre
 */
router.get("/dados/:coMunicipio", function (req, res) {
    dashboardCoordenadorController.obterDadosDashboard(req, res);
});

/* Professores da unidade com contagem de registros */
router.get("/professores/:idUnidade", function (req, res) {
    dashboardCoordenadorController.listarProfessores(req, res);
});

module.exports = router;
