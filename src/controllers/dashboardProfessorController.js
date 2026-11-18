var dashboardProfessorModel = require("../models/dashboardProfessorModel");

function obterDadosDashboard(req, res) {
    var coMunicipio = req.params.coMunicipio;
    var uf = req.params.uf;

    if (!coMunicipio) {
        return res.status(400).send("O código do município (co_municipio) está indefinido!");
    }
    if (!uf) {
        return res.status(400).send("A UF está indefinida!");
    }

    dashboardProfessorModel.buscarHistoricoDesempenho(coMunicipio, uf)
        .then(function (resultado) {
            if (resultado.length > 0) {
                res.json(resultado);
            } else {
                res.status(404).json({ mensagem: "Nenhum dado encontrado para os parâmetros informados." });
            }
        })
        .catch(function (erro) {
            console.log("Houve um erro ao buscar os dados no banco: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    obterDadosDashboard
};