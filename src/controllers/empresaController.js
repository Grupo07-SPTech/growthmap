var empresaModel = require("../models/empresaModel");

function autenticar(req, res) {
    var email = req.body.email;
    var senha = req.body.senha;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else {
        empresaModel.autenticar(email, senha)
            .then(function (resultadoAutenticar) {
                console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);
                console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`);

                if (resultadoAutenticar.length == 1) {
                    res.status(200).json({
                        id: resultadoAutenticar[0].id,
                        nome: resultadoAutenticar[0].nome,
                        email: resultadoAutenticar[0].email,
                        cnpj: resultadoAutenticar[0].cnpj
                    });
                } else if (resultadoAutenticar.length == 0) {
                    res.status(403).send("Email e/ou senha inválido(s)");
                } else {
                    res.status(403).send("Mais de uma empresa com o mesmo login e senha!");
                }
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cadastrar(req, res) {
    var nome = req.body.nome;
    var email = req.body.email;
    var cnpj = req.body.cnpj;
    var senha = req.body.senha;

    if (nome == undefined) {
        res.status(400).send("O nome da empresa está undefined!");
    } else if (email == undefined) {
        res.status(400).send("O email da empresa está undefined!");
    } else if (cnpj == undefined) {
        res.status(400).send("O CNPJ da empresa está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("A senha da empresa está undefined!");
    } else {
        empresaModel.buscarPorCnpj(cnpj)
            .then(function (resultadoCnpj) {
                if (resultadoCnpj.length > 0) {
                    res.status(409).send("Já existe uma empresa cadastrada com esse CNPJ!");
                } else {
                    empresaModel.buscarPorEmail(email)
                        .then(function (resultadoEmail) {
                            if (resultadoEmail.length > 0) {
                                res.status(409).send("Já existe uma empresa cadastrada com esse email!");
                            } else {
                                empresaModel.cadastrar(nome, email, cnpj, senha)
                                    .then(function (resultado) {
                                        res.status(201).json(resultado);
                                    })
                                    .catch(function (erro) {
                                        console.log(erro);
                                        console.log("\nHouve um erro ao realizar o cadastro! Erro: ", erro.sqlMessage);
                                        res.status(500).json(erro.sqlMessage);
                                    });
                            }
                        })
                        .catch(function (erro) {
                            console.log(erro);
                            console.log("\nHouve um erro ao verificar o email! Erro: ", erro.sqlMessage);
                            res.status(500).json(erro.sqlMessage);
                        });
                }
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao verificar o CNPJ! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function buscarPorCnpj(req, res) {
    var cnpj = req.query.cnpj;

    empresaModel.buscarPorCnpj(cnpj)
        .then((resultado) => {
            res.status(200).json(resultado);
        })
        .catch(function (erro){
            res.status(500).json(erro.sqlMessage);
        });
}

function listar(req, res) {
    empresaModel.listar()
        .then((resultado) => {
            res.status(200).json(resultado);
        })
        .catch(function (erro){
            res.status(500).json(erro.sqlMessage);
        });
}

function buscarPorId(req, res) {
    var id = req.params.id;

    empresaModel.buscarPorId(id)
        .then((resultado) => {
            res.status(200).json(resultado);
        })
        .catch(function (erro){
            res.status(500).json(resultado);
        });
}

module.exports = {
    autenticar,
    cadastrar,
    buscarPorCnpj,
    buscarPorId,
    listar
};
