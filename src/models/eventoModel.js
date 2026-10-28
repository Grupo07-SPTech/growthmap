var database = require("../database/config");

function listar(idUsuario) {
    var instrucaoSql = `
        SELECT id, tipo, nome, area, data, rotulo, feita FROM evento WHERE fk_usuario = ${idUsuario} ORDER BY data ASC;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(tipo, nome, area, data, rotulo, fkUsuario) {
    var instrucaoSql = `
        INSERT INTO evento (tipo, nome, area, data, rotulo, feita, fk_usuario) 
        VALUES ('${tipo}', '${nome}', '${area}', '${data}', '${rotulo}', 0, ${fkUsuario});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarStatus(idEvento, feita) {
    var instrucaoSql = `
        UPDATE evento SET feita = ${feita ? 1 : 0} WHERE id = ${idEvento};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarNome(idEvento, nome) {
    var instrucaoSql = `
        UPDATE evento SET nome = '${nome}' WHERE id = ${idEvento};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletar(idEvento) {
    var instrucaoSql = `
        DELETE FROM evento WHERE id = ${idEvento};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listar,
    cadastrar,
    atualizarStatus,
    atualizarNome,
    deletar
};