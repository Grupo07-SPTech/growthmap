var express = require("express");
var router = express.Router();
var eventoController = require("../controllers/eventoController");

router.get("/listar/:idUsuario", function (req, res) {
    eventoController.listar(req, res);
});

router.post("/cadastrar", function (req, res) {
    eventoController.cadastrar(req, res);
});

router.put("/atualizar/:idEvento", function (req, res) {
    eventoController.atualizar(req, res);
});

router.delete("/deletar/:idEvento", function (req, res) {
    eventoController.deletar(req, res);
});

module.exports = router;