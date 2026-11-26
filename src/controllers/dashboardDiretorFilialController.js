var dashboardDiretorFilialModel = require("../models/dashboardDiretorFilialModel");

function listarUnidades(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) return res.status(400).json({ mensagem: "Empresa inválida." });

    dashboardDiretorFilialModel.listarUnidades(idEmpresa)
        .then(function (registros) { res.status(200).json(registros); })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Não foi possível carregar as unidades." });
        });
}

function listarAnos(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var idUnidade = Number(req.params.idUnidade);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(idUnidade) || idUnidade <= 0) {
        return res.status(400).json({ mensagem: "Empresa ou unidade inválida." });
    }

    dashboardDiretorFilialModel.listarAnos(idEmpresa, idUnidade)
        .then(function (registros) { res.status(200).json(registros); })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Não foi possível carregar os anos." });
        });
}

function listarDesempenho(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var idUnidade = Number(req.params.idUnidade);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(idUnidade) || idUnidade <= 0) {
        return res.status(400).json({ mensagem: "Empresa ou unidade inválida." });
    }

    dashboardDiretorFilialModel.listarDesempenho(idEmpresa, idUnidade)
        .then(function (registros) { res.status(200).json(registros); })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Não foi possível carregar o desempenho." });
        });
}

function listarDesempenhoRede(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var ano = Number(req.query.ano);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        return res.status(400).json({ mensagem: "Empresa ou ano inválido." });
    }

    dashboardDiretorFilialModel.listarDesempenhoRede(idEmpresa, ano)
        .then(function (registros) { res.status(200).json(registros); })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Não foi possível carregar o desempenho da rede." });
        });
}

function listarProfessores(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var idUnidade = Number(req.params.idUnidade);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(idUnidade) || idUnidade <= 0) {
        return res.status(400).json({ mensagem: "Empresa ou unidade inválida." });
    }

    dashboardDiretorFilialModel.listarProfessores(idEmpresa, idUnidade)
        .then(function (registros) { res.status(200).json(registros); })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Não foi possível carregar os professores." });
        });
}

function listarEventos(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var idUnidade = Number(req.params.idUnidade);
    var ano = Number(req.query.ano);
    var semestre = Number(req.query.semestre);
    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(idUnidade) || idUnidade <= 0 ||
        !Number.isInteger(ano) || ano < 2000 || ano > 2100 || (semestre !== 1 && semestre !== 2)) {
        return res.status(400).json({ mensagem: "Empresa, unidade, ano ou semestre inválido." });
    }

    var inicio = ano + (semestre === 1 ? "-01-01" : "-07-01");
    var fim = semestre === 1 ? ano + "-07-01" : (ano + 1) + "-01-01";
    dashboardDiretorFilialModel.listarEventos(idEmpresa, idUnidade, inicio, fim)
        .then(function (registros) { res.status(200).json(registros); })
        .catch(function (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Não foi possível carregar os eventos." });
        });
}

module.exports = {
    listarUnidades,
    listarAnos,
    listarDesempenho,
    listarDesempenhoRede,
    listarProfessores,
    listarEventos
};
