var filialModel = require("../models/filialModel");

function cadastrar(req, res) {
    var nome = req.body.nome;
    var cnpj = req.body.cnpj;
    var cep = req.body.cep;
    var rua = req.body.rua;
    var numero = req.body.numero;
    var bairro = req.body.bairro;
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
    } else {
        var enderecoCompleto = `${rua}, ${numero} - ${bairro}, CEP: ${cep}`;

        // 1. Cadastra o município automaticamente se ele não existir
        filialModel.cadastrarMunicipioSeNaoExistir(coMunicipio, cidade, estado)
            .then(function () {
                // 2. Em seguida, cadastra a filial vinculada a ele
                return filialModel.cadastrar(nome, enderecoCompleto, coMunicipio, idEmpresa, cnpj);
            })
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao realizar o cadastro! Erro: ", erro.sqlMessage);
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

module.exports = {
    cadastrar,
    listarPorEmpresa,
    buscarPorId
};