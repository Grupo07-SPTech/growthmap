var database = require("../database/config");

/* Retorna todos os municípios de uma UF, ordenados por nome. */
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
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Retorna o histórico anual de desempenho de um município
 * junto com os dados estaduais correspondentes (para comparativo).
 */
function buscarHistoricoDesempenho(coMunicipio) {
    var instrucaoSql = `
        SELECT
            m.co_municipio,
            m.nome_municipio,
            m.uf,
            dr.ano,
            dr.media_cn    AS municipio_cn,
            dr.media_ch    AS municipio_ch,
            dr.media_lc    AS municipio_lc,
            dr.media_mt    AS municipio_mt,
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
            de.media_cn    AS estado_cn,
            de.media_ch    AS estado_ch,
            de.media_lc    AS estado_lc,
            de.media_mt    AS estado_mt,
            de.media_redacao AS estado_redacao
        FROM desempenho_regional dr
        JOIN municipio m ON dr.co_municipio = m.co_municipio
        LEFT JOIN desempenho_estadual de
            ON de.uf = m.uf
            AND de.ano = dr.ano
        WHERE dr.co_municipio = ${coMunicipio}
        ORDER BY dr.ano ASC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Retorna o progresso do planejamento da unidade:
 * total de eventos, eventos concluídos e meta configurada.
 */
function buscarProgressoPlanejamento(idUnidade, idUsuario, ano, semestre) {
    var filtroEvento = idUsuario ? `WHERE fk_usuario = ${idUsuario}` : "";
    var filtroConcluido = filtroEvento
        ? filtroEvento + " AND feita = 1"
        : "WHERE feita = 1";

    var filtroMeta = idUnidade
        ? `WHERE id_unidade = ${idUnidade} AND ano = ${ano} AND semestre = ${semestre}`
        : `WHERE ano = ${ano} AND semestre = ${semestre}`;

    var instrucaoSql = `
        SELECT
            (SELECT COUNT(*) FROM evento ${filtroEvento})              AS total_eventos,
            (SELECT COUNT(*) FROM evento ${filtroConcluido})           AS eventos_concluidos,
            COALESCE(
                (SELECT meta_eventos FROM meta_planejamento ${filtroMeta}
                 ORDER BY id DESC LIMIT 1),
                10
            )                                                          AS meta_eventos;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Lista os professores de uma unidade com a contagem de
 * eventos registrados (para o gráfico de barras).
 */
function listarProfessoresDaUnidade(idUnidade) {
    var instrucaoSql = `
        SELECT
            u.id,
            u.nome,
            u.area_atuacao,
            COUNT(e.id) AS registros
        FROM usuario u
        JOIN cargo c ON u.fk_cargo = c.id_cargo
        LEFT JOIN evento e ON e.fk_usuario = u.id
        WHERE u.id_unidade = ${idUnidade}
          AND c.nome LIKE 'Professor%'
        GROUP BY u.id, u.nome, u.area_atuacao
        ORDER BY registros DESC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listarMunicipiosPorUf,
    buscarHistoricoDesempenho,
    buscarProgressoPlanejamento,
    listarProfessoresDaUnidade,
};
