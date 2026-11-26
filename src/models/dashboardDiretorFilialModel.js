var database = require("../database/config");

function listarUnidades(idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.id AS id_unidade,
            u.nome AS nome_unidade,
            u.id_empresa,
            m.co_municipio,
            m.nome_municipio,
            m.uf
        FROM unidade u
        JOIN municipio m ON m.co_municipio = u.co_municipio
        WHERE u.id_empresa = ?
        ORDER BY u.nome ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa]);
}

function listarAnos(idEmpresa, idUnidade) {
    var instrucaoSql = `
        SELECT DISTINCT dr.ano
        FROM unidade u
        JOIN municipio m ON m.co_municipio = u.co_municipio
        JOIN desempenho_regional dr ON dr.co_municipio = m.co_municipio
        JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        WHERE u.id_empresa = ? AND u.id = ?
        ORDER BY dr.ano DESC;
    `;
    return database.executar(instrucaoSql, [idEmpresa, idUnidade]);
}

function listarDesempenho(idEmpresa, idUnidade) {
    var instrucaoSql = `
        SELECT
            u.id AS id_unidade,
            u.nome AS nome_unidade,
            u.id_empresa,
            m.co_municipio,
            m.nome_municipio,
            m.uf,
            dr.ano,
            dr.media_cn AS municipio_cn,
            dr.media_ch AS municipio_ch,
            dr.media_lc AS municipio_lc,
            dr.media_mt AS municipio_mt,
            dr.media_redacao AS municipio_redacao,
            dr.qtd_inscritos,
            dr.qtd_participantes,
            de.media_cn AS estado_cn,
            de.media_ch AS estado_ch,
            de.media_lc AS estado_lc,
            de.media_mt AS estado_mt,
            de.media_redacao AS estado_redacao
        FROM unidade u
        JOIN municipio m ON m.co_municipio = u.co_municipio
        JOIN desempenho_regional dr ON dr.co_municipio = m.co_municipio
        JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        WHERE u.id_empresa = ? AND u.id = ?
        ORDER BY dr.ano ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa, idUnidade]);
}

function listarDesempenhoRede(idEmpresa, ano) {
    var instrucaoSql = `
        SELECT
            dr.co_municipio,
            dr.media_cn,
            dr.media_ch,
            dr.media_lc,
            dr.media_mt,
            dr.media_redacao,
            dr.qtd_participantes
        FROM (
            SELECT DISTINCT co_municipio
            FROM unidade
            WHERE id_empresa = ?
        ) rede
        JOIN desempenho_regional dr ON dr.co_municipio = rede.co_municipio
        WHERE dr.ano = ?;
    `;
    return database.executar(instrucaoSql, [idEmpresa, ano]);
}

function listarProfessores(idEmpresa, idUnidade) {
    var instrucaoSql = `
        SELECT u.area_atuacao, COUNT(DISTINCT u.id) AS quantidade
        FROM usuario u
        JOIN unidade un ON un.id = u.id_unidade
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        WHERE un.id_empresa = ? AND un.id = ?
          AND LOWER(c.nome) LIKE 'professor%'
        GROUP BY u.area_atuacao
        ORDER BY u.area_atuacao ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa, idUnidade]);
}

function listarEventos(idEmpresa, idUnidade, inicio, fim) {
    var instrucaoSql = `
        SELECT
            e.id AS id_evento,
            u.id AS id_usuario,
            e.area,
            e.data
        FROM evento e
        JOIN usuario u ON u.id = e.fk_usuario
        JOIN unidade un ON un.id = u.id_unidade
        WHERE un.id_empresa = ? AND un.id = ?
          AND e.data >= ?
          AND e.data < ?
        ORDER BY e.data ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa, idUnidade, inicio, fim]);
}

module.exports = {
    listarUnidades,
    listarAnos,
    listarDesempenho,
    listarDesempenhoRede,
    listarProfessores,
    listarEventos
};
