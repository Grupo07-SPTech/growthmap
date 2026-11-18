var database = require("../database/config");

function buscarHistoricoDesempenho(coMunicipio, uf) {
    console.log("ACESSANDO MODEL - Município Co:", coMunicipio, "| UF:", uf);
    
    // query que une o desempenho regional do município com o desempenho estadual correspondente ao longo dos anos
    var instrucaoSql = `
        SELECT 
            dr.ano,
            dr.media_mt AS municipio_mt,
            dr.media_lc AS municipio_lc,
            dr.media_ch AS municipio_ch,
            dr.media_cn AS municipio_cn,
            dr.media_redacao AS municipio_redacao,
            dr.qtd_participantes,
            de.media_mt AS estado_mt,
            de.media_lc AS estado_lc,
            de.media_ch AS estado_ch,
            de.media_cn AS estado_cn,
            de.media_redacao AS estado_redacao
        FROM desempenho_regional dr
        JOIN municipio m ON dr.co_municipio = m.co_municipio
        JOIN desempenho_estadual de ON de.uf = m.uf AND de.ano = dr.ano
        WHERE dr.co_municipio = ${coMunicipio}
        ORDER BY dr.ano ASC;
    `;
    
    console.log("Executando SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarHistoricoDesempenho
};