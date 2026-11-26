var express = require("express");
var router  = express.Router();
var ctrl    = require("../controllers/dashboardCoordenadorController");

/* Dados básicos da unidade (resolve co_municipio e id_empresa) */
router.get("/unidade/:idUnidade", function (req, res) {
    ctrl.buscarUnidade(req, res);
});

/* Lista de unidades da empresa — popula o modal de seleção */
router.get("/unidades/:idEmpresa", function (req, res) {
    ctrl.listarUnidades(req, res);
});

/* Payload completo da dashboard — query param opcional: ?ano=<ano> */
router.get("/dados/:idUnidade", function (req, res) {
    ctrl.obterDadosDashboard(req, res);
});

module.exports = router;
