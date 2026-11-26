var database = require("../database/config");

function cadastrarMunicipioSeNaoExistir(coMunicipio, nomeMunicipio, uf) {
    var instrucaoSql = `
        INSERT IGNORE INTO municipio (co_municipio, nome_municipio, uf) 
        VALUES (?, ?, ?);
    `;
    return database.executar(instrucaoSql, [coMunicipio, nomeMunicipio, uf]);
}

function cadastrar(nome, { logradouro, numero, bairro, cep }, coMunicipio, idEmpresa, cnpj) {
    var instrucaoSql = `
        INSERT INTO unidade (nome, logradouro, numero, bairro, cep, co_municipio, id_empresa, cnpj)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [nome, logradouro, numero, bairro, cep, coMunicipio, idEmpresa, cnpj]);
}

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.cnpj, u.logradouro, u.numero, u.bairro, u.cep,
               m.nome_municipio, m.uf, m.co_municipio
        FROM unidade u 
        JOIN municipio m ON u.co_municipio = m.co_municipio 
        WHERE u.id_empresa = ?;
    `;
    return database.executar(instrucaoSql, [idEmpresa]);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.cnpj, u.logradouro, u.numero, u.bairro, u.cep,
               m.nome_municipio, m.uf, m.co_municipio
        FROM unidade u 
        JOIN municipio m ON u.co_municipio = m.co_municipio 
        WHERE u.id = ?;
    `;
    return database.executar(instrucaoSql, [id]);
}

function atualizar(id, nome, { logradouro, numero, bairro, cep }, coMunicipio, cnpj) {
    var instrucaoSql = `
        UPDATE unidade 
        SET nome = ?, logradouro = ?, numero = ?, bairro = ?, cep = ?,
            co_municipio = ?, cnpj = ?
        WHERE id = ?;
    `;
    return database.executar(instrucaoSql, [nome, logradouro, numero, bairro, cep, coMunicipio, cnpj, id]);
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
