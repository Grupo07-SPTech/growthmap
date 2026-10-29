var database = require("../database/config")

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT
            u.id,
            u.nome,
            u.email,
            u.id_unidade AS unidadeId,
            un.id_empresa AS empresaId,
            c.id_cargo AS cargoId,
            c.nome AS cargo,
            c.nivel_acesso AS nivelAcesso
        FROM usuario u
        JOIN unidade un ON u.id_unidade = un.id
        JOIN cargo c ON u.fk_cargo = c.id_cargo
        WHERE u.email = '${email}'
        AND u.senha = '${senha}';
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, fkEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, fkEmpresa);

    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, fk_empresa) VALUES ('${nome}', '${email}', '${senha}', '${fkEmpresa}');
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarPorId(idUsuario) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.email, u.cpf,
               c.nome AS cargo, u.area_atuacao
        FROM usuario u
        JOIN cargo c ON u.fk_cargo = c.id_cargo
        WHERE u.id = ${idUsuario};
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function editarPerfil(idUsuario, nome, email, cpf, area) {
    var instrucaoSql = `UPDATE usuario SET nome = '${nome}', email = '${email}', cpf = '${cpf}', area_atuacao = '${area}' WHERE id = ${idUsuario};`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarConta(idUsuario) {
    var instrucaoSql = `DELETE FROM usuario WHERE id = ${idUsuario};`;
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    buscarPorId,
    editarPerfil,
    deletarConta
};