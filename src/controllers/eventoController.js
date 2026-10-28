var eventoModel = require("../models/eventoModel");

function listar(req, res) {
    var idUsuario = req.params.idUsuario;

    eventoModel.listar(idUsuario)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function cadastrar(req, res) {
    var tipo = req.body.tipoServer;
    var nome = req.body.nomeServer;
    var area = req.body.areaServer;
    var data = req.body.dataServer;
    var rotulo = req.body.rotuloServer;
    var fkUsuario = req.body.idUsuarioServer;

    if (!nome || !data || !fkUsuario) {
        res.status(400).send("Dados obrigatórios não preenchidos!");
    } else {
        eventoModel.cadastrar(tipo || 'tarefa', nome, area || 'Geral', data, rotulo || 'Tarefa', fkUsuario)
            .then(function (resultado) {
                res.status(201).json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function atualizar(req, res) {
    var idEvento = req.params.idEvento;
    var feita = req.body.feitaServer;
    var nome = req.body.nomeServer;

    if (feita !== undefined) {
        eventoModel.atualizarStatus(idEvento, feita)
            .then(resultado => res.status(200).json(resultado))
            .catch(erro => res.status(500).json(erro.sqlMessage));
    } else if (nome !== undefined) {
        eventoModel.atualizarNome(idEvento, nome)
            .then(resultado => res.status(200).json(resultado))
            .catch(erro => res.status(500).json(erro.sqlMessage));
    } else {
        res.status(400).send("Nenhum campo para atualizar foi enviado!");
    }
}

function deletar(req, res) {
    var idEvento = req.params.idEvento;

    eventoModel.deletar(idEvento)
        .then(resultado => res.status(200).json(resultado))
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

module.exports = {
    listar,
    cadastrar,
    atualizar,
    deletar
};