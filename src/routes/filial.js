var express = require("express");
var router = express.Router();

var filialController = require("../controllers/filialController");

router.post("/cadastrar", function (req, res) {
    filialController.cadastrar(req, res);
});

router.get("/listar/:idEmpresa", function (req, res) {
    filialController.listarPorEmpresa(req, res);
});

router.get("/buscar/:id", function (req, res) {
    filialController.buscarPorId(req, res);
});

module.exports = router;