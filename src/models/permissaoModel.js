
var database = require("../database/config");

function listarModulos() {
    var instrucaoSql = `
        SELECT * FROM modulo;
    `;

    return database.executar(instrucaoSql);
}

function listarCargos() {
    var instrucaoSql = `
        SELECT
            c.id_cargo,
            c.nome,
            c.nivel_acesso,
            m.id_modulo,
            m.nome AS nome_modulo
        FROM cargo c
        LEFT JOIN cargo_modulo cm ON c.id_cargo = cm.fk_cargo
        LEFT JOIN modulo m ON cm.fk_modulo = m.id_modulo
        ORDER BY c.id_cargo;
    `;

    return database.executar(instrucaoSql);
}

function cadastrar(nome, nivelAcesso) {
    var instrucaoSql = `
        INSERT INTO cargo (nome, nivel_acesso)
        VALUES ('${nome}', '${nivelAcesso}');
    `;

    return database.executar(instrucaoSql);
}

function cadastrarModulos(valores) {
    var instrucaoSql = `
        INSERT INTO cargo_modulo (fk_cargo, fk_modulo)
        VALUES ${valores};
    `;

    return database.executar(instrucaoSql);
}

function atualizar(id, nome, nivelAcesso) {
    var instrucaoSql = `
        UPDATE cargo
        SET nome = '${nome}',
            nivel_acesso = '${nivelAcesso}'
        WHERE id_cargo = ${id};
    `;

    return database.executar(instrucaoSql);
}

function removerModulos(idCargo) {
    var instrucaoSql = `
        DELETE FROM cargo_modulo
        WHERE fk_cargo = ${idCargo};
    `;

    return database.executar(instrucaoSql);
}

function deletar(id) {
    var instrucaoSql = `
        DELETE FROM cargo
        WHERE id_cargo = ${id};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    listarModulos,
    listarCargos,
    cadastrar,
    cadastrarModulos,
    atualizar,
    removerModulos,
    deletar
};
