var database = require("../database/config");

function cadastrarMunicipioSeNaoExistir(coMunicipio, nomeMunicipio, uf) {
    var instrucaoSql = `
        INSERT IGNORE INTO municipio (co_municipio, nome_municipio, uf) 
        VALUES (${coMunicipio}, '${nomeMunicipio}', '${uf}');
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, endereco, coMunicipio, idEmpresa, cnpj) {
    console.log("ACESSEI O FILIAL MODEL - function cadastrar():", nome, endereco, coMunicipio, idEmpresa, cnpj);

    var instrucaoSql = `
        INSERT INTO unidade (nome, endereco, co_municipio, id_empresa, cnpj) 
        VALUES ('${nome}', '${endereco}', ${coMunicipio}, '${idEmpresa}', '${cnpj}')
    `;

    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT u.*, m.nome_municipio, m.uf 
        FROM unidade u 
        JOIN municipio m ON u.co_municipio = m.co_municipio 
        WHERE u.id_empresa = ${idEmpresa};
    `;

    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT u.*, m.nome_municipio, m.uf 
        FROM unidade u 
        JOIN municipio m ON u.co_municipio = m.co_municipio 
        WHERE u.id = ${id};
    `;

    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarMunicipioSeNaoExistir,
    cadastrar,
    listarPorEmpresa,
    buscarPorId
};