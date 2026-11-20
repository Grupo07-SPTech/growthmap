var database = require("../database/config");

function listarMunicipiosPorUf(uf) {
    var instrucaoSql = `
        SELECT 
            co_municipio,
            nome_municipio,
            uf
        FROM municipio
        WHERE uf = '${uf}'
        ORDER BY nome_municipio ASC;
    `;
    return database.executar(instrucaoSql);
}

function buscarHistoricoDesempenho(coMunicipio) {
    var instrucaoSql = `
        SELECT 
            m.co_municipio,
            m.nome_municipio,
            m.uf,
            dr.ano,
            dr.media_mt AS municipio_mt,
            dr.media_lc AS municipio_lc,
            dr.media_ch AS municipio_ch,
            dr.media_cn AS municipio_cn,
            dr.media_redacao AS municipio_redacao,
            dr.media_comp1,
            dr.media_comp2,
            dr.media_comp3,
            dr.media_comp4,
            dr.media_comp5,
            dr.taxa_abstencao_dia1,
            dr.taxa_abstencao_dia2,
            dr.qtd_inscritos,
            dr.qtd_participantes,
            de.media_mt AS estado_mt,
            de.media_lc AS estado_lc,
            de.media_ch AS estado_ch,
            de.media_cn AS estado_cn,
            de.media_redacao AS estado_redacao,
            de.taxa_abstencao_dia1 AS estado_abstencao_dia1,
            de.taxa_abstencao_dia2 AS estado_abstencao_dia2
        FROM desempenho_regional dr
        JOIN municipio m ON dr.co_municipio = m.co_municipio
        LEFT JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        WHERE dr.co_municipio = ${coMunicipio}
        ORDER BY dr.ano ASC;
    `;
    return database.executar(instrucaoSql);
}

function buscarProgressoPlanejamento(idUnidade, idUsuario, ano, semestre) {
    var filtroEventoUsuario = idUsuario ? `WHERE fk_usuario = ${idUsuario}` : "";
    var filtroMetaUnidade = idUnidade ? `WHERE id_unidade = ${idUnidade} AND ano = ${ano} AND semestre = ${semestre}` : `WHERE ano = ${ano} AND semestre = ${semestre}`;

    var instrucaoSql = `
        SELECT 
            (SELECT COUNT(*) FROM evento ${filtroEventoUsuario}) AS total_eventos,
            (SELECT COUNT(*) FROM evento ${filtroEventoUsuario ? filtroEventoUsuario + " AND feita = 1" : "WHERE feita = 1"}) AS eventos_concluidos,
            COALESCE((SELECT meta_eventos FROM meta_planejamento ${filtroMetaUnidade} ORDER BY id DESC LIMIT 1), 10) AS meta_eventos;
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    listarMunicipiosPorUf,
    buscarHistoricoDesempenho,
    buscarProgressoPlanejamento
};