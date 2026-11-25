var database = require("../database/config");

function listarAnos(idEmpresa) {
    var instrucaoSql = `
        SELECT DISTINCT dr.ano
        FROM unidade u
        JOIN municipio m ON m.co_municipio = u.co_municipio
        JOIN desempenho_regional dr ON dr.co_municipio = m.co_municipio
        JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        WHERE u.id_empresa = ?
        ORDER BY dr.ano DESC;
    `;
    return database.executar(instrucaoSql, [idEmpresa]);
}

function buscarDesempenhoMunicipios(idEmpresa, ano) {
    var instrucaoSql = `
        SELECT
            m.co_municipio,
            m.nome_municipio,
            m.uf,
            dr.ano,
            dr.media_cn AS municipio_cn,
            dr.media_ch AS municipio_ch,
            dr.media_lc AS municipio_lc,
            dr.media_mt AS municipio_mt,
            dr.media_redacao AS municipio_redacao,
            dr.qtd_participantes,
            de.media_cn AS estado_cn,
            de.media_ch AS estado_ch,
            de.media_lc AS estado_lc,
            de.media_mt AS estado_mt,
            de.media_redacao AS estado_redacao
        FROM (
            SELECT DISTINCT co_municipio
            FROM unidade
            WHERE id_empresa = ?
        ) rede
        JOIN municipio m ON m.co_municipio = rede.co_municipio
        JOIN desempenho_regional dr ON dr.co_municipio = m.co_municipio AND dr.ano = ?
        LEFT JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        ORDER BY m.nome_municipio ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa, ano]);
}

function listarUsuariosUnidades(idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.id AS id_unidade,
            u.nome AS nome_unidade,
            m.co_municipio,
            m.nome_municipio,
            us.id AS id_usuario,
            us.area_atuacao
        FROM unidade u
        JOIN municipio m ON m.co_municipio = u.co_municipio
        LEFT JOIN usuario us ON us.id_unidade = u.id
        WHERE u.id_empresa = ?
        ORDER BY u.nome ASC, us.nome ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa]);
}

function listarEventosUnidades(idEmpresa, inicio, fim) {
    var instrucaoSql = `
        SELECT
            u.id AS id_unidade,
            e.id AS id_evento,
            e.area,
            e.data,
            e.feita
        FROM unidade u
        JOIN usuario us ON us.id_unidade = u.id
        JOIN evento e ON e.fk_usuario = us.id
        WHERE u.id_empresa = ?
          AND e.data >= ?
          AND e.data < ?
        ORDER BY e.data ASC;
    `;
    return database.executar(instrucaoSql, [idEmpresa, inicio, fim]);
}

function buscarDadosMapa(ano) {
    var instrucaoSql = `
        SELECT
            m.co_municipio,
            m.nome_municipio,
            m.uf,
            dr.ano,
            dr.media_cn AS municipio_cn,
            dr.media_ch AS municipio_ch,
            dr.media_lc AS municipio_lc,
            dr.media_mt AS municipio_mt,
            dr.media_redacao AS municipio_redacao,
            (dr.media_cn + dr.media_ch + dr.media_lc + dr.media_mt + dr.media_redacao) / 5 AS media_municipal,
            de.media_cn AS estado_cn,
            de.media_ch AS estado_ch,
            de.media_lc AS estado_lc,
            de.media_mt AS estado_mt,
            de.media_redacao AS estado_redacao,
            (de.media_cn + de.media_ch + de.media_lc + de.media_mt + de.media_redacao) / 5 AS media_estadual
        FROM desempenho_regional dr
        JOIN municipio m ON m.co_municipio = dr.co_municipio
        LEFT JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        WHERE dr.ano = ?
        ORDER BY m.nome_municipio ASC;
    `;
    return database.executar(instrucaoSql, [ano]);
}

module.exports = {
    listarAnos,
    buscarDesempenhoMunicipios,
    listarUsuariosUnidades,
    listarEventosUnidades,
    buscarDadosMapa
};
