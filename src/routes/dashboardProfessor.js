var express = require("express");
var router = express.Router();

var dashboardProfessorController = require("../controllers/dashboardProfessorController");

router.get("/obter/:coMunicipio/:uf", function (req, res) {
    dashboardProfessorController.obterDadosDashboard(req, res);
});

module.exports = router;