var express = require("express");
var router = express.Router();
var professorController = require("../controllers/professorController");

router.post("/cadastrar", function (req, res) {
    professorController.cadastrar(req, res);
});

router.get("/listar/:idEmpresa", function (req, res) {
    professorController.listarPorEmpresa(req, res);
});

router.get("/buscar/:id", function (req, res) {
    professorController.buscarPorId(req, res);
});

router.put("/atualizar/:id", function (req, res) {
    professorController.atualizar(req, res);
});

router.delete("/deletar/:id", function (req, res) {
    professorController.deletar(req, res);
});

module.exports = router;