
var permissaoModel = require("../models/permissaoModel");

function listarModulos(req, res) {
    permissaoModel.listarModulos()
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function listarCargos(req, res) {
    permissaoModel.listarCargos()
        .then(function (resultado) {
            var cargos = [];

            for (var i = 0; i < resultado.length; i++) {
                var item = resultado[i];
                var cargo = null;

                for (var j = 0; j < cargos.length; j++) {
                    if (cargos[j].id_cargo == item.id_cargo) {
                        cargo = cargos[j];
                    }
                }

                if (cargo == null) {
                    cargo = {
                        id_cargo: item.id_cargo,
                        nome: item.nome,
                        nivel_acesso: item.nivel_acesso,
                        modulos: []
                    };

                    cargos.push(cargo);
                }

                if (item.id_modulo != null) {
                    cargo.modulos.push({
                        id_modulo: item.id_modulo,
                        nome: item.nome_modulo
                    });
                }
            }

            res.status(200).json(cargos);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function cadastrar(req, res) {
    var nome = req.body.nome;
    var nivelAcesso = req.body.nivel_acesso;
    var modulos = req.body.modulos;

    if (!nome || !nivelAcesso || !Array.isArray(modulos)) {
        res.status(400).send("Preencha os campos obrigatórios!");
    } else {
        for (var i = 0; i < modulos.length; i++) {
            if (!Number.isInteger(modulos[i]) || modulos[i] <= 0) {
                return res.status(400).send("Módulo inválido!");
            }
        }

        permissaoModel.cadastrar(nome, nivelAcesso)
            .then(function (resultado) {
                var idCargo = resultado.insertId;
                var valores = "";

                for (var i = 0; i < modulos.length; i++) {
                    if (i > 0) {
                        valores += ", ";
                    }

                    valores += `(${idCargo}, ${modulos[i]})`;
                }

                if (modulos.length > 0) {
                    return permissaoModel.cadastrarModulos(valores);
                }
            })
            .then(function () {
                res.status(201).send("Cargo cadastrado com sucesso!");
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage || erro.message);
            });
    }
}

function atualizar(req, res) {
    var id = req.params.id;
    var nome = req.body.nome;
    var nivelAcesso = req.body.nivel_acesso;
    var modulos = req.body.modulos;

    if (!id || isNaN(id) || !nome || !nivelAcesso || !Array.isArray(modulos)) {
        res.status(400).send("Campos inválidos!");
    } else {
        var valores = "";

        for (var i = 0; i < modulos.length; i++) {
            if (!Number.isInteger(modulos[i]) || modulos[i] <= 0) {
                return res.status(400).send("Módulo inválido!");
            }

            if (i > 0) {
                valores += ", ";
            }

            valores += `(${Number(id)}, ${modulos[i]})`;
        }

        permissaoModel.atualizar(id, nome, nivelAcesso)
            .then(function (resultado) {
                if (resultado.affectedRows == 0) {
                    return res.status(404).send("Cargo não encontrado!");
                }

                return permissaoModel.removerModulos(id)
                    .then(function () {
                        if (modulos.length > 0) {
                            return permissaoModel.cadastrarModulos(valores);
                        }
                    })
                    .then(function () {
                        res.status(200).send("Cargo atualizado com sucesso!");
                    });
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage || erro.message);
            });
    }
}

function deletar(req, res) {
    var id = req.params.id;

    permissaoModel.deletar(id)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);

            if (erro.code == "ER_ROW_IS_REFERENCED_2") {
                res.status(409).send("Cargo possui usuários vinculados!");
            } else {
                res.status(500).json(erro.sqlMessage);
            }
        });
}

module.exports = {
    listarModulos,
    listarCargos,
    cadastrar,
    atualizar,
    deletar
};
