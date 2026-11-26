var filialModel = require("../models/filialModel");

function obterEndereco(dados) {
    var rua = dados.rua;
    var numero = dados.numero;
    var bairro = dados.bairro;
    var cep = dados.cep;

    if (numero === undefined) {
        numero = "";
    }

    if (typeof rua !== "string" || typeof numero !== "string" ||
        typeof bairro !== "string" || typeof cep !== "string") {
        return null;
    }

    var logradouro = rua.trim();
    var cepSemMascara = cep.trim().replace("-", "");
    var bairroLimpo = bairro.trim();
    var numeroLimpo = numero.trim();

    if (!logradouro || logradouro.length > 150 || !bairroLimpo || bairroLimpo.length > 100 ||
        cepSemMascara.length !== 8 || numeroLimpo.length > 20) {
        return null;
    }

    for (var i = 0; i < cepSemMascara.length; i++) {
        var digito = cepSemMascara[i];
        if (digito < "0" || digito > "9") {
            return null;
        }
    }

    return { logradouro, numero: numeroLimpo || null, bairro: bairroLimpo, cep: cepSemMascara };
}

function cadastrar(req, res) {
    var nome = req.body.nome;
    var cnpj = req.body.cnpj;
    var endereco = obterEndereco(req.body);
    var cidade = req.body.cidade;
    var estado = req.body.estado;
    var coMunicipio = req.body.coMunicipio;
    var idEmpresa = req.body.idEmpresa;

    if (!nome) {
        res.status(400).send("O nome da filial está indefinido!");
    } else if (!cnpj) {
        res.status(400).send("O CNPJ está indefinido!");
    } else if (!coMunicipio) {
        res.status(400).send("O código do município (IBGE) não foi obtido através do CEP!");
    } else if (!idEmpresa) {
        res.status(403).send("ID da empresa não encontrado. Faça login novamente.");
    } else if (!endereco) {
        res.status(400).send("Informe logradouro, bairro e CEP válidos.");
    } else {
        filialModel.cadastrarMunicipioSeNaoExistir(coMunicipio, cidade, estado)
            .then(function () {
                return filialModel.cadastrar(nome, endereco, coMunicipio, idEmpresa, cnpj);
            })
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function listarPorEmpresa(req, res) {
    var idEmpresa = req.params.idEmpresa;

    filialModel.listarPorEmpresa(idEmpresa)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function buscarPorId(req, res) {
    var id = req.params.id;

    filialModel.buscarPorId(id)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function atualizar(req, res) {
    var id = req.params.id;
    var nome = req.body.nome;
    var cnpj = req.body.cnpj;
    var endereco = obterEndereco(req.body);
    var cidade = req.body.cidade;
    var estado = req.body.estado;
    var coMunicipio = req.body.coMunicipio;

    if (!id || !nome || !cnpj || !coMunicipio) {
        return res.status(400).send("Campos obrigatórios ausentes para atualização.");
    }

    if (!endereco) {
        return res.status(400).send("Informe logradouro, bairro e CEP válidos.");
    }

    filialModel.cadastrarMunicipioSeNaoExistir(coMunicipio, cidade, estado)
        .then(function () {
            return filialModel.atualizar(id, nome, endereco, coMunicipio, cnpj);
        })
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function deletar(req, res) {
    var id = req.params.id;

    filialModel.deletar(id)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    cadastrar,
    listarPorEmpresa,
    buscarPorId,
    atualizar,
    deletar
};
