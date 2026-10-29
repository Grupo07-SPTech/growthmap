
var express = require("express");
var router = express.Router();
var permissaoController = require("../controllers/permissaoController");

router.get("/modulos", function (req, res) {
    permissaoController.listarModulos(req, res);
});

router.get("/cargos", function (req, res) {
    permissaoController.listarCargos(req, res);
});

router.post("/cargos", function (req, res) {
    permissaoController.cadastrar(req, res);
});

router.put("/cargos/:id", function (req, res) {
    permissaoController.atualizar(req, res);
});

router.delete("/cargos/:id", function (req, res) {
    permissaoController.deletar(req, res);
});

module.exports = router;
