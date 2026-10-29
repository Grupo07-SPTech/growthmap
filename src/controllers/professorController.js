var professorModel = require("../models/professorModel");

function cadastrar(req, res) {
    var nome = req.body.nome;
    var email = req.body.email;
    var cpf = req.body.cpf;
    var cargo = campoValido(req.body.cargo) ? req.body.cargo : "Professor";
    var area = req.body.area;
    var idUnidade = req.body.idUnidade;
    var senha = req.body.senha;

    if (!campoValido(nome) || !campoValido(email) || !campoValido(cpf) || !campoValido(area) || !campoValido(idUnidade) || !campoValido(senha)) {
        return res.status(400).send("Preencha todos os campos obrigatórios!");
    } else { 
        professorModel.cadastrar(nome, email, senha, cargo, area, idUnidade, cpf)
            .then(resultado => res.json(resultado))
            .catch(erro => {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function listarPorEmpresa(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).send("Empresa inválida.");
    }

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
    var nivelAcessoUsuarioLogado = req.body.nivelAcessoUsuarioLogado;
    var ehCoordenadorAtual = cargoEhCoordenacao(cargoUsuarioLogado);

    if (!nivelEhAdministrativo(nivelAcessoUsuarioLogado)) {
        return res.status(403).send("Apenas usuários com nível Administrativo podem editar usuários.");
    }

    if (cargoUsuarioLogado === "Diretor" && (cargo === "Administrador" || cargo === "Diretor Geral")) {
        return res.status(403).send("Acesso negado: Diretores de filial não podem atribuir cargos de Administrador ou Diretor Geral.");
    }

    if (!ehCoordenadorAtual && cargoUsuarioLogado !== "Diretor" && cargoUsuarioLogado !== "Diretor Geral" && cargoUsuarioLogado !== "Administrador") {
        return res.status(403).send("Acesso negado: Permissão insuficiente para realizar alterações.");
    }

    if (!id || !campoValido(nome) || !campoValido(email) || !campoValido(cpf) || !campoValido(cargo) || !campoValido(area) || !campoValido(idUnidade)) {
        return res.status(400).send("Campos obrigatórios ausentes para atualização.");
    }

    if (ehCoordenadorAtual && !ehProfessor(cargo)) {
        return res.status(403).send("Coordenadores só podem atribuir cargos de professor.");
    }

    professorModel.buscarCargoPorUsuario(id)
        .then(cargosUsuario => {
            if (cargosUsuario.length === 0) {
                return res.status(404).send("Usuário não encontrado.");
            }
            if (ehCoordenadorAtual && !ehProfessor(cargosUsuario[0].cargo)) {
                return res.status(403).send("Coordenadores só podem editar usuários com cargo de professor.");
            }
            return professorModel.atualizar(id, nome, email, cpf, cargo, area, idUnidade)
                .then(resultado => res.json(resultado));
        })
        .catch(erro => {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function campoValido(valor) {
    if (valor === undefined || valor === null) return false;
    var texto = String(valor).trim();
    return texto !== "" && texto.toLocaleLowerCase("pt-BR") !== "undefined" && texto.toLocaleLowerCase("pt-BR") !== "null";
}

function deletar(req, res) {
    var id = req.params.id;
    var cargoUsuarioLogado = req.body && req.body.cargoUsuarioLogado;
    var nivelAcessoUsuarioLogado = req.body && req.body.nivelAcessoUsuarioLogado;
    var ehCoordenadorAtual = cargoEhCoordenacao(cargoUsuarioLogado);

    if (!nivelEhAdministrativo(nivelAcessoUsuarioLogado)) {
        return res.status(403).send("Apenas usuários com nível Administrativo podem excluir usuários.");
    }

    if (!ehCoordenadorAtual && cargoUsuarioLogado !== "Diretor" && cargoUsuarioLogado !== "Diretor Geral" && cargoUsuarioLogado !== "Administrador") {
        return res.status(403).send("Acesso negado: Permissão insuficiente para excluir usuários.");
    }

    professorModel.buscarCargoPorUsuario(id)
        .then(cargosUsuario => {
            if (cargosUsuario.length === 0) {
                return res.status(404).send("Usuário não encontrado.");
            }
            if (ehCoordenadorAtual && !ehProfessor(cargosUsuario[0].cargo)) {
                return res.status(403).send("Coordenadores só podem excluir usuários com cargo de professor.");
            }
            return professorModel.deletar(id)
                .then(resultado => res.json(resultado));
        })
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

function ehProfessor(cargo) {
    var cargoNormalizado = String(cargo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
    return cargoNormalizado.indexOf("professor") === 0 || cargoNormalizado.indexOf("professora") === 0;
}

function cargoEhCoordenacao(cargo) {
    var cargoNormalizado = String(cargo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
    return cargoNormalizado.indexOf("coordenador") === 0 || cargoNormalizado.indexOf("coordenadora") === 0;
}

function nivelEhAdministrativo(nivel) {
    var nivelNormalizado = String(nivel || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
    return nivelNormalizado === "administrativo";
}

module.exports = {
    cadastrar,
    listarPorEmpresa,
    buscarPorId,
    atualizar,
    deletar
};
