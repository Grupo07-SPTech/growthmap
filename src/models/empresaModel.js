var database = require("../database/config");

function autenticar(email, senha) {
    console.log("ACESSEI O EMPRESA MODEL - function autenticar():", email, senha);

    var instrucaoSql = `
        SELECT id, nome, email, cnpj
        FROM empresa
        WHERE email = '${email}' AND senha = '${senha}';
    `;

    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarPorEmail(email) {
    var instrucaoSql = `
        SELECT * FROM empresa WHERE email = '${email}';
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT * FROM empresa WHERE id = '${id}'
    `;

    return database.executar(instrucaoSql);
}

function listar() {
    var instrucaoSql = `
        SELECT id, nome, email, cnpj FROM empresa
    `;

    return database.executar(instrucaoSql);
}

function buscarPorCnpj(cnpj) {
    var instrucaoSql = `
        SELECT * FROM empresa WHERE cnpj = '${cnpj}'
    `;

    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, cnpj, senha) {
    console.log("ACESSEI O EMPRESA MODEL - function cadastrar():", nome, email, cnpj);

    var instrucaoSql = `
        INSERT INTO empresa (nome, email, cnpj, senha) 
        VALUES ('${nome}', '${email}', '${cnpj}', '${senha}')
    `;

    console.log("Executando: " + instrucaoSql)
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    buscarPorEmail,
    buscarPorCnpj,
    buscarPorId,
    cadastrar,
    listar
};
