var express = require("express");
var router = express.Router();
var dashboardDiretorFilialController = require("../controllers/dashboardDiretorFilialController");

router.get("/unidades/:idEmpresa", function (req, res) {
    dashboardDiretorFilialController.listarUnidades(req, res);
});

router.get("/anos/:idEmpresa/:idUnidade", function (req, res) {
    dashboardDiretorFilialController.listarAnos(req, res);
});

router.get("/desempenho/:idEmpresa/:idUnidade", function (req, res) {
    dashboardDiretorFilialController.listarDesempenho(req, res);
});

router.get("/rede/:idEmpresa", function (req, res) {
    dashboardDiretorFilialController.listarDesempenhoRede(req, res);
});

router.get("/professores/:idEmpresa/:idUnidade", function (req, res) {
    dashboardDiretorFilialController.listarProfessores(req, res);
});

router.get("/eventos/:idEmpresa/:idUnidade", function (req, res) {
    dashboardDiretorFilialController.listarEventos(req, res);
});

module.exports = router;
