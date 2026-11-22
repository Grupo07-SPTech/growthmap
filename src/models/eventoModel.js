var database = require("../database/config");

function buscarAcesso(idUsuario) {
    return database.executar(
        `SELECT c.nivel_acesso
         FROM usuario u
         JOIN cargo c ON c.id_cargo = u.fk_cargo
         JOIN cargo_modulo cm ON cm.fk_cargo = c.id_cargo
         JOIN modulo m ON m.id_modulo = cm.fk_modulo
         WHERE u.id = ? AND m.nome = 'Painel de Eventos';`,
        [idUsuario]
    );
}

function listar(idUsuario) {
    return database.executar(
        `SELECT id, tipo, nome, area, DATE_FORMAT(data, '%Y-%m-%d') AS data, rotulo, feita
         FROM evento WHERE fk_usuario = ? ORDER BY data ASC;`,
        [idUsuario]
    );
}

function cadastrar(tipo, nome, area, data, rotulo, idUsuario) {
    return database.executar(
        `INSERT INTO evento (tipo, nome, area, data, rotulo, feita, fk_usuario)
         VALUES (?, ?, ?, ?, ?, 0, ?);`,
        [tipo, nome, area, data, rotulo, idUsuario]
    );
}

function atualizar(idEvento, idUsuario, nome, area, feita) {
    return database.executar(
        `UPDATE evento
         SET nome = COALESCE(?, nome), area = COALESCE(?, area), feita = COALESCE(?, feita)
         WHERE id = ? AND fk_usuario = ?;`,
        [nome, area, feita, idEvento, idUsuario]
    );
}

function deletar(idEvento, idUsuario) {
    return database.executar("DELETE FROM evento WHERE id = ? AND fk_usuario = ?;", [idEvento, idUsuario]);
}

module.exports = { buscarAcesso, listar, cadastrar, atualizar, deletar };
