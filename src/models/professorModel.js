var database = require("../database/config");

function cadastrar(nome, email, senha, cargo, area, idUnidade, cpf) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, cargo, id_unidade, cpf, area_atuacao) 
        VALUES ('${nome}', '${email}', '${senha}', '${cargo}', ${idUnidade}, '${cpf}', '${area}')
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.email, u.cpf, u.cargo, u.area_atuacao, un.nome AS nome_unidade, un.id AS id_unidade, m.nome_municipio 
        FROM usuario u 
        JOIN unidade un ON u.id_unidade = un.id 
        JOIN municipio m ON un.co_municipio = m.co_municipio 
        WHERE un.id_empresa = ${idEmpresa};
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT * FROM usuario WHERE id = ${id};
    `;
    return database.executar(instrucaoSql);
}

function atualizar(id, nome, email, cpf, cargo, area, idUnidade) {
    var instrucaoSql = `
        UPDATE usuario 
        SET nome = '${nome}', 
            email = '${email}', 
            cpf = '${cpf}', 
            cargo = '${cargo}', 
            area_atuacao = '${area}', 
            id_unidade = ${idUnidade} 
        WHERE id = ${id};
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletar(id) {
    var instrucaoSql = `
        DELETE FROM usuario WHERE id = ${id};
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar,
    listarPorEmpresa,
    buscarPorId,
    atualizar,
    deletar
};