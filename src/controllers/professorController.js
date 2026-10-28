var professorModel = require("../models/professorModel");

function cadastrar(req, res) {
    var nome = req.body.nome;
    var email = req.body.email;
    var cpf = req.body.cpf;
    var cargo = req.body.cargo || "Professor";
    var area = req.body.area;
    var idUnidade = req.body.idUnidade;
    var senha = req.body.senha || "123456";

    if (!nome || !email || !cpf || !area || !idUnidade) {
        return res.status(400).send("Preencha todos os campos obrigatórios!");
    }

    professorModel.cadastrar(nome, email, senha, cargo, area, idUnidade, cpf)
        .then(resultado => res.json(resultado))
        .catch(erro => {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function listarPorEmpresa(req, res) {
    var idEmpresa = req.params.idEmpresa;
    professorModel.listarPorEmpresa(idEmpresa)
        .then(resultado => res.status(200).json(resultado))
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

function buscarPorId(req, res) {
    var id = req.params.id;
    professorModel.buscarPorId(id)
        .then(resultado => res.status(200).json(resultado))
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

function atualizar(req, res) {
    var id = req.params.id;
    var nome = req.body.nome;
    var email = req.body.email;
    var cpf = req.body.cpf;
    var cargo = req.body.cargo;
    var area = req.body.area;
    var idUnidade = req.body.idUnidade;
    
    var cargoUsuarioLogado = req.body.cargoUsuarioLogado; 

    if (cargoUsuarioLogado === "Diretor" && (cargo === "Administrador" || cargo === "Diretor Geral")) {
        return res.status(403).send("Acesso negado: Diretores de filial não podem atribuir cargos de Administrador ou Diretor Geral.");
    }

    if (cargoUsuarioLogado !== "Diretor" && cargoUsuarioLogado !== "Diretor Geral" && cargoUsuarioLogado !== "Administrador") {
        return res.status(403).send("Acesso negado: Permissão insuficiente para realizar alterações.");
    }

    if (!id || !nome || !email || !cpf || !cargo || !area || !idUnidade) {
        return res.status(400).send("Campos obrigatórios ausentes para atualização.");
    }

    professorModel.atualizar(id, nome, email, cpf, cargo, area, idUnidade)
        .then(resultado => res.json(resultado))
        .catch(erro => {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function deletar(req, res) {
    var id = req.params.id;
    professorModel.deletar(id)
        .then(resultado => res.json(resultado))
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

module.exports = {
    cadastrar,
    listarPorEmpresa,
    buscarPorId,
    atualizar,
    deletar
};