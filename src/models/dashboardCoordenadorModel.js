var database = require("../database/config");

/*
 * Retorna todas as unidades de uma empresa com nome do município e UF.
 */
function listarUnidadesDaEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.id,
            u.nome,
            m.co_municipio,
            m.nome_municipio,
            m.uf
        FROM unidade u
        JOIN municipio m ON u.co_municipio = m.co_municipio
        WHERE u.id_empresa = ${idEmpresa}
        ORDER BY u.nome ASC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Retorna dados básicos de uma unidade (nome, município, UF, id_empresa).
 */
function buscarDadosUnidade(idUnidade) {
    var instrucaoSql = `
        SELECT
            u.id,
            u.nome,
            u.id_empresa,
            m.co_municipio,
            m.nome_municipio,
            m.uf
        FROM unidade u
        JOIN municipio m ON u.co_municipio = m.co_municipio
        WHERE u.id = ${idUnidade}
        LIMIT 1;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * KPI 1 — Dados do último ano disponível (2024 ou 2025) para o município,
 * com médias estaduais para comparação.
 */
function buscarAreaMaisFraca(coMunicipio) {
    var instrucaoSql = `
        SELECT
            dr.ano,
            dr.media_cn,
            dr.media_ch,
            dr.media_lc,
            dr.media_mt,
            dr.media_redacao,
            de.media_cn      AS estado_cn,
            de.media_ch      AS estado_ch,
            de.media_lc      AS estado_lc,
            de.media_mt      AS estado_mt,
            de.media_redacao AS estado_redacao
        FROM desempenho_regional dr
        JOIN municipio m ON dr.co_municipio = m.co_municipio
        LEFT JOIN desempenho_estadual de
            ON de.uf = m.uf AND de.ano = dr.ano
        WHERE dr.co_municipio = ${coMunicipio}
          AND dr.ano IN (2024, 2025)
        ORDER BY dr.ano DESC
        LIMIT 1;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * KPI 2 — Média geral (cn+ch+lc+mt+redacao)/5 por ano (2024 e 2025).
 */
function buscarVariacaoMediaGeral(coMunicipio) {
    var instrucaoSql = `
        SELECT
            ano,
            ROUND((COALESCE(media_cn, 0)
                 + COALESCE(media_ch, 0)
                 + COALESCE(media_lc, 0)
                 + COALESCE(media_mt, 0)
                 + COALESCE(media_redacao, 0)) / 5, 2) AS media_geral
        FROM desempenho_regional
        WHERE co_municipio = ${coMunicipio}
          AND ano IN (2024, 2025)
        ORDER BY ano ASC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * KPI 3 — Total de registros (eventos) dos professores desta unidade.
 * A meta é definida pelo coordenador na tela (localStorage).
 */
function buscarTotalRegistros(idUnidade) {
    var instrucaoSql = `
        SELECT COUNT(e.id) AS total_registros
        FROM evento e
        JOIN usuario u ON e.fk_usuario = u.id
        WHERE u.id_unidade = ${idUnidade};
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Gráfico 1 — Médias por competência em 2024 e 2025.
 */
function buscarHistoricoDesempenho(coMunicipio) {
    var instrucaoSql = `
        SELECT
            ano,
            media_cn,
            media_ch,
            media_lc,
            media_mt,
            media_redacao
        FROM desempenho_regional
        WHERE co_municipio = ${coMunicipio}
          AND ano IN (2024, 2025)
        ORDER BY ano ASC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Gráfico 2 — Eventos registrados por mês no ano atual.
 */
function buscarEventosPorMes(idUnidade, ano) {
    var instrucaoSql = `
        SELECT
            MONTH(e.data) AS mes,
            COUNT(e.id)   AS registros
        FROM evento e
        JOIN usuario u ON e.fk_usuario = u.id
        WHERE u.id_unidade = ${idUnidade}
          AND YEAR(e.data) = ${ano}
        GROUP BY MONTH(e.data)
        ORDER BY mes ASC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Gráfico 3 — Registros por professor da unidade com área de atuação.
 */
function buscarRegistrosPorProfessor(idUnidade) {
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
          AND c.nome = 'Professor'
        GROUP BY u.id, u.nome, u.area_atuacao
        ORDER BY registros DESC;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

/*
 * Painel de Atividade Recente — últimos 10 eventos dos professores da unidade.
 */
function buscarAtividadeRecente(idUnidade) {
    var instrucaoSql = `
        SELECT
            e.id,
            e.nome        AS nome_evento,
            e.tipo,
            e.area,
            e.data,
            e.feita,
            u.nome        AS nome_professor,
            u.area_atuacao
        FROM evento e
        JOIN usuario u ON e.fk_usuario = u.id
        JOIN cargo c   ON u.fk_cargo   = c.id_cargo
        WHERE u.id_unidade = ${idUnidade}
          AND c.nome = 'Professor'
        ORDER BY e.data DESC, e.id DESC
        LIMIT 10;
    `;
    console.log("Executando: " + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listarUnidadesDaEmpresa,
    buscarDadosUnidade,
    buscarAreaMaisFraca,
    buscarVariacaoMediaGeral,
    buscarTotalRegistros,
    buscarHistoricoDesempenho,
    buscarEventosPorMes,
    buscarRegistrosPorProfessor,
    buscarAtividadeRecente,
};
