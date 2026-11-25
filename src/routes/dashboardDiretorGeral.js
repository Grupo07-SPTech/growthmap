var express = require("express");
var router = express.Router();

var dashboardDiretorGeralController = require("../controllers/dashboardDiretorGeralController");

router.get("/anos/:idEmpresa", function (req, res) {
    dashboardDiretorGeralController.listarAnos(req, res);
});

router.get("/dados/:idEmpresa", function (req, res) {
    dashboardDiretorGeralController.obterDadosRede(req, res);
});

router.get("/mapa/:ano", function (req, res) {
    dashboardDiretorGeralController.obterDadosMapa(req, res);
});

module.exports = router;
