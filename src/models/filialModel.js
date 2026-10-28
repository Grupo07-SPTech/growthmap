var database = require("../database/config");

function cadastrarMunicipioSeNaoExistir(coMunicipio, nomeMunicipio, uf) {
    var instrucaoSql = `
        INSERT IGNORE INTO municipio (co_municipio, nome_municipio, uf) 
        VALUES (${coMunicipio}, '${nomeMunicipio}', '${uf}');
    `;
    return database.executar(instrucaoSql);
}

function cadastrar(nome, endereco, coMunicipio, idEmpresa, cnpj) {
    var instrucaoSql = `
        INSERT INTO unidade (nome, endereco, co_municipio, id_empresa, cnpj) 
        VALUES ('${nome}', '${endereco}', ${coMunicipio}, '${idEmpresa}', '${cnpj}')
    `;
    return database.executar(instrucaoSql);
}

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.cnpj, u.endereco, m.nome_municipio, m.uf, m.co_municipio 
        FROM unidade u 
        JOIN municipio m ON u.co_municipio = m.co_municipio 
        WHERE u.id_empresa = ${idEmpresa};
    `;
    return database.executar(instrucaoSql);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.cnpj, u.endereco, m.nome_municipio, m.uf, m.co_municipio 
        FROM unidade u 
        JOIN municipio m ON u.co_municipio = m.co_municipio 
        WHERE u.id = ${id};
    `;
    return database.executar(instrucaoSql);
}

function atualizar(id, nome, endereco, coMunicipio, cnpj) {
    var instrucaoSql = `
        UPDATE unidade 
        SET nome = '${nome}', 
            endereco = '${endereco}', 
            co_municipio = ${coMunicipio}, 
            cnpj = '${cnpj}' 
        WHERE id = ${id};
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletar(id) {
    var instrucaoSql = `
        DELETE FROM unidade WHERE id = ${id};
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarMunicipioSeNaoExistir,
    cadastrar,
    listarPorEmpresa,
    buscarPorId,
    atualizar,
    deletar
};