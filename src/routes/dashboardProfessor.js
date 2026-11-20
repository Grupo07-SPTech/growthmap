var express = require("express");
var router = express.Router();

var dashboardProfessorController = require("../controllers/dashboardProfessorController");

router.get("/municipios/:uf", function (req, res) {
    dashboardProfessorController.listarMunicipios(req, res);
});

router.get("/dados/:coMunicipio", function (req, res) {
    dashboardProfessorController.obterDadosDashboard(req, res);
});

module.exports = router;