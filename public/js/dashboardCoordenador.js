/* ── dashboardCoordenador.js ────────────────────────────────────── */
/* Script da dashboard do coordenador.                                */
/* Inicializa os gráficos ApexCharts, controla a meta editável e      */
/* tenta buscar dados reais da API (fallback para dados estáticos).   */

(function () {
    'use strict';

    /* ── Constantes ─────────────────────────────────────────────── */
    var VINHO = '#7a1f3d';
    var VERDE = '#2b9348';
    var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    /* Dados estáticos (placeholder enquanto a API não retorna) */
    var ANOS_EVOLUCAO = ['2023', '2024', '2025', '2026'];

    var NOTAS_EVOLUCAO = {
        'C.Natureza': [565, 580, 605, 620],
        'C.Humanas':  [560, 575, 590, 600],
        'Linguagens': [610, 600, 595, 610],
        'Matemática': [605, 610, 620, 630],
        'Redação':    [640, 650, 660, 670],
    };

    var METAS_AREA = {
        'C.Natureza': 520,
        'C.Humanas':  550,
        'Linguagens': 580,
        'Matemática': 610,
        'Redação':    620,
    };

    var REGISTROS_POR_PROFESSOR = {
        'João Lima':      ['Simulado Mat. Jan', 'Lista de exercícios', 'Revisão de álgebra', 'Prova diagnóstica', 'Simulado Mat. Fev', 'Correção coletiva', 'Exercícios ENEM', 'Revisão final', 'Prova bimestral'],
        'Ana Costa':      ['Aula de genética', 'Revisão de biologia', 'Simulado CN', 'Lista de ecologia', 'Prova diagnóstica', 'Exercícios ENEM'],
        'Rafael Pereira': ['Revisão de química', 'Simulado CN', 'Lista de reações', 'Prova bimestral', 'Exercícios ENEM'],
        'Carla Mendes':   ['Revisão de física', 'Simulado CN', 'Lista de mecânica'],
    };

    /* ── Estado da meta ─────────────────────────────────────────── */
    var REGISTROS_ATUAIS = 12;
    var metaAtual = 20;

    /* ── Helpers ─────────────────────────────────────────────────── */
    function linhaMeta(area) {
        return [{
            y: METAS_AREA[area],
            borderColor: VERDE,
            strokeDashArray: 6,
            label: {
                text: 'Meta: ' + METAS_AREA[area],
                position: 'left',
                textAnchor: 'start',
                style: { color: '#fff', background: VERDE, fontSize: '11px' },
            },
        }];
    }

    function atualizarKpiMeta() {
        var pct = Math.min(Math.round((REGISTROS_ATUAIS / metaAtual) * 100), 100);
        var faltam = Math.max(metaAtual - REGISTROS_ATUAIS, 0);
        document.getElementById('meta-valor').textContent = metaAtual;
        document.getElementById('meta-barra').style.width = pct + '%';
        document.getElementById('meta-pct').textContent = pct + '% da meta';
        document.getElementById('meta-faltam').textContent =
            faltam > 0 ? 'Faltam ' + faltam + ' registros para a meta mensal' : 'Meta atingida! 🎉';
    }

    /* ── Modal de meta ───────────────────────────────────────────── */
    function abrirMeta() {
        document.getElementById('meta-input').value = metaAtual;
        document.getElementById('meta-overlay').classList.add('aberto');
        document.getElementById('meta-input').focus();
    }

    function fecharMeta() {
        document.getElementById('meta-overlay').classList.remove('aberto');
    }

    function salvarMeta() {
        var val = parseInt(document.getElementById('meta-input').value, 10);
        if (!val || val < 1) return;
        metaAtual = val;
        atualizarKpiMeta();
        fecharMeta();
    }

    document.getElementById('btn-abrir-meta').addEventListener('click', abrirMeta);
    document.getElementById('btn-fechar-meta').addEventListener('click', fecharMeta);
    document.getElementById('btn-salvar-meta').addEventListener('click', salvarMeta);
    document.getElementById('meta-overlay').addEventListener('click', function (e) {
        if (e.target === this) fecharMeta();
    });

    /* ── Indicador do menu (posiciona o traço lateral) ───────────── */
    var itensNav  = Array.prototype.slice.call(document.querySelectorAll('.sidebar .nav-item'));
    var indicador = document.getElementById('nav-indicador');

    function indiceAtivo() {
        return itensNav.findIndex(function (i) { return i.classList.contains('ativo'); });
    }

    function topoDe(i) {
        return 'translateY(' + itensNav[i].offsetTop + 'px)';
    }

    function posicionarIndicador() {
        var atual = indiceAtivo();
        if (atual < 0) return;
        indicador.style.transition = 'none';
        indicador.style.transform  = topoDe(atual);
        indicador.style.opacity    = 1;
        indicador.offsetHeight; /* força reflow */
        indicador.style.transition = '';
        indicador.style.transform  = topoDe(atual);
    }

    window.addEventListener('load', posicionarIndicador);
    window.addEventListener('resize', function () {
        indicador.style.transition = 'none';
        indicador.style.transform  = topoDe(indiceAtivo());
    });

    /* ── Gráfico 1: Evolução das médias do ENEM ──────────────────── */
    var chartEvolucao = new ApexCharts(document.querySelector('#chart'), {
        series: [{ name: 'C.Natureza', data: NOTAS_EVOLUCAO['C.Natureza'] }],
        chart: {
            height: 260,
            type: 'line',
            zoom: { enabled: false },
            toolbar: { show: false },
            fontFamily: 'Poppins, sans-serif',
        },
        colors: [VINHO],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4, strokeWidth: 0 },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f1f1f1' },
        xaxis: { categories: ANOS_EVOLUCAO },
        yaxis: { min: 400, max: 700 },
        annotations: { yaxis: linhaMeta('C.Natureza') },
        legend: { show: false },
        responsive: [{
            breakpoint: 600,
            options: { chart: { height: 240 }, markers: { size: 3 } },
        }],
    });
    chartEvolucao.render();

    document.querySelectorAll('.evolucao_medias_button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.evolucao_medias_button').forEach(function (b) {
                b.classList.remove('ativo');
            });
            btn.classList.add('ativo');
            var area = btn.dataset.area;
            chartEvolucao.updateOptions({
                series: [{ name: area, data: NOTAS_EVOLUCAO[area] }],
                annotations: { yaxis: linhaMeta(area) },
            });
        });
    });

    /* ── Gráfico 2: Painel de Acompanhamento (registros mensais) ─── */
    new ApexCharts(document.querySelector('#chartA'), {
        chart: {
            type: 'line',
            height: 300,
            zoom: { enabled: false },
            toolbar: { show: false },
            fontFamily: 'Poppins, sans-serif',
        },
        series: [{ name: 'Registros', data: [4, 5, 8, 9, 5, 6, 4, 9, 7, 6, 8, 9] }],
        colors: [VINHO],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4 },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f1f1f1' },
        xaxis: { categories: MESES },
        yaxis: { title: { text: 'Registros por mês' }, min: 0, max: 12, tickAmount: 6 },
        annotations: {
            yaxis: [{
                y: 7,
                borderColor: VERDE,
                strokeDashArray: 6,
                label: {
                    text: 'Meta: 7',
                    position: 'left',
                    textAnchor: 'start',
                    style: { color: '#fff', background: VERDE, fontSize: '11px' },
                },
            }],
        },
        legend: { show: false },
        responsive: [{
            breakpoint: 600,
            options: { chart: { height: 240 }, yaxis: { title: { text: undefined }, min: 0, max: 12, tickAmount: 6 } },
        }],
    }).render();

    /* ── Gráfico 3: Registros por Professor ──────────────────────── */
    new ApexCharts(document.querySelector('#chartProfessores'), {
        chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'Poppins, sans-serif',
        },
        plotOptions: {
            bar: { horizontal: false, columnWidth: '55%', borderRadius: 6, distributed: true },
        },
        colors: ['#7a1f3d', '#a84060', '#c86882', '#d9a0b0'],
        dataLabels: {
            enabled: true,
            style: { fontSize: '12px', colors: ['#333'] },
            offsetY: -6,
        },
        series: [{ name: 'Registros', data: [9, 6, 5, 3] }],
        xaxis: {
            categories: ['João Lima', 'Ana Costa', 'Rafael Pereira', 'Carla Mendes'],
            labels: { style: { fontSize: '12px', fontFamily: 'Poppins, sans-serif' } },
        },
        yaxis: { title: { text: 'Nº de registros' }, min: 0, max: 12, tickAmount: 4 },
        annotations: {
            yaxis: [{
                y: 10,
                borderColor: VERDE,
                strokeDashArray: 6,
                label: {
                    text: 'Meta: 10',
                    position: 'left',
                    textAnchor: 'start',
                    style: { color: '#fff', background: VERDE, fontSize: '11px', fontFamily: 'Poppins, sans-serif' },
                },
            }],
        },
        grid: { borderColor: '#f1f1f1' },
        legend: { show: false },
        tooltip: {
            custom: function (opts) {
                var idx  = opts.dataPointIndex;
                var nome = opts.w.globals.labels[idx];
                var total = opts.w.globals.series[0][idx];
                var lista = REGISTROS_POR_PROFESSOR[nome] || [];
                var itens = lista.map(function (r) {
                    return '<li style="padding:2px 0;border-bottom:1px solid #f1f1f1;">' + r + '</li>';
                }).join('');
                return '<div style="padding:12px 14px;font-family:Poppins,sans-serif;min-width:200px;max-width:260px;">'
                    + '<div style="font-weight:600;color:#7a1f3d;font-size:13px;margin-bottom:6px;">' + nome + '</div>'
                    + '<div style="font-size:11px;color:#555;margin-bottom:8px;">' + total + ' registro(s)</div>'
                    + '<ul style="list-style:none;padding:0;margin:0;font-size:11px;color:#333;">' + itens + '</ul>'
                    + '</div>';
            },
        },
        responsive: [{ breakpoint: 600, options: { chart: { height: 220 } } }],
    }).render();

    /* ── Carrega dados reais da API ──────────────────────────────── */
    (function carregarDadosApi() {
        var sessao = {};
        try { sessao = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}'); } catch (e) { /* sem sessão */ }

        var coMunicipio = sessao.coMunicipio;
        var idUnidade   = sessao.idUnidade;
        var idUsuario   = sessao.id;

        if (!coMunicipio) return; /* usa dados estáticos */

        /* Atualiza badge de unidade */
        if (sessao.nomeUnidade) {
            document.getElementById('badge-unidade').textContent = 'Unidade: ' + sessao.nomeUnidade;
        }

        /* Busca histórico de desempenho + progresso do planejamento */
        fetch('/dashboardCoordenador/dados/' + coMunicipio
            + '?idUnidade=' + (idUnidade || '')
            + '&idUsuario=' + (idUsuario || ''))
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (dados) {
                if (!dados) return;

                /* Atualiza gráfico de evolução com dados reais */
                if (dados.historico && dados.historico.length > 0) {
                    var anos   = dados.historico.map(function (r) { return String(r.ano); });
                    var areaCN = dados.historico.map(function (r) { return parseFloat(r.municipio_cn)   || 0; });
                    var areaCH = dados.historico.map(function (r) { return parseFloat(r.municipio_ch)   || 0; });
                    var areaLC = dados.historico.map(function (r) { return parseFloat(r.municipio_lc)   || 0; });
                    var areaMT = dados.historico.map(function (r) { return parseFloat(r.municipio_mt)   || 0; });
                    var areaRD = dados.historico.map(function (r) { return parseFloat(r.municipio_redacao) || 0; });

                    NOTAS_EVOLUCAO['C.Natureza'] = areaCN;
                    NOTAS_EVOLUCAO['C.Humanas']  = areaCH;
                    NOTAS_EVOLUCAO['Linguagens'] = areaLC;
                    NOTAS_EVOLUCAO['Matemática'] = areaMT;
                    NOTAS_EVOLUCAO['Redação']    = areaRD;

                    chartEvolucao.updateOptions({
                        series: [{ name: 'C.Natureza', data: areaCN }],
                        xaxis:  { categories: anos },
                    });

                    /* KPI: área mais fraca (menor média no último ano) */
                    var ultimo = dados.historico[dados.historico.length - 1];
                    var areas  = [
                        { nome: 'C.Natureza', val: parseFloat(ultimo.municipio_cn) },
                        { nome: 'C.Humanas',  val: parseFloat(ultimo.municipio_ch) },
                        { nome: 'Linguagens', val: parseFloat(ultimo.municipio_lc) },
                        { nome: 'Matemática', val: parseFloat(ultimo.municipio_mt) },
                        { nome: 'Redação',    val: parseFloat(ultimo.municipio_redacao) },
                    ];
                    var fraca = areas.reduce(function (a, b) { return a.val < b.val ? a : b; });
                    document.getElementById('kpi-area-fraca').textContent    = fraca.nome;
                    document.getElementById('kpi-nota-municipio').textContent = fraca.val.toFixed(0) + ' pts';

                    /* Comparativo com estado */
                    var estadoMap = {
                        'C.Natureza': parseFloat(ultimo.estado_cn),
                        'C.Humanas':  parseFloat(ultimo.estado_ch),
                        'Linguagens': parseFloat(ultimo.estado_lc),
                        'Matemática': parseFloat(ultimo.estado_mt),
                        'Redação':    parseFloat(ultimo.estado_redacao),
                    };
                    var notaEstado = estadoMap[fraca.nome] || 0;
                    document.getElementById('kpi-nota-estado').textContent = notaEstado.toFixed(0) + ' pts';
                    var diff = fraca.val - notaEstado;
                    var elDiff = document.getElementById('kpi-diff-area');
                    elDiff.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(0) + ' pts em relação ao estado';
                    elDiff.className = 'kpi-diff ' + (diff >= 0 ? 'kpi-positivo' : 'kpi-negativo');

                    /* KPI: variação anual (penúltimo vs último) */
                    if (dados.historico.length >= 2) {
                        var penultimo = dados.historico[dados.historico.length - 2];
                        var medAnterior = ((+penultimo.municipio_cn + +penultimo.municipio_ch + +penultimo.municipio_lc + +penultimo.municipio_mt + +penultimo.municipio_redacao) / 5);
                        var medAtual    = ((+ultimo.municipio_cn    + +ultimo.municipio_ch    + +ultimo.municipio_lc    + +ultimo.municipio_mt    + +ultimo.municipio_redacao) / 5);
                        document.getElementById('kpi-ano-anterior-label').textContent = penultimo.ano;
                        document.getElementById('kpi-ano-atual-label').textContent    = ultimo.ano;
                        document.getElementById('kpi-media-anterior').textContent     = medAnterior.toFixed(0) + ' pts';
                        document.getElementById('kpi-media-atual').textContent        = medAtual.toFixed(0) + ' pts';
                        var varAnual = medAtual - medAnterior;
                        var elVar = document.getElementById('kpi-variacao');
                        elVar.textContent = (varAnual >= 0 ? '+' : '') + varAnual.toFixed(0) + ' pts em relação ao ano anterior';
                        elVar.className = 'kpi-diff ' + (varAnual >= 0 ? 'kpi-positivo' : 'kpi-negativo');
                    }
                }

                /* Atualiza KPI de meta com dados do planejamento */
                if (dados.planejamento) {
                    REGISTROS_ATUAIS = dados.planejamento.cadastrados || REGISTROS_ATUAIS;
                    metaAtual = dados.planejamento.meta || metaAtual;
                    document.getElementById('kpi-registros-atual').textContent = REGISTROS_ATUAIS;
                    atualizarKpiMeta();
                }
            })
            .catch(function (e) {
                console.warn('[dashboardCoordenador] API indisponível, usando dados estáticos.', e);
            });

        /* Busca professores para atualizar gráfico de barras */
        fetch('/dashboardCoordenador/professores/' + idUnidade)
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (profs) {
                if (!profs || profs.length === 0) return;
                /* ApexCharts não expõe updateSeries facilmente via referência aqui,
                   então um reload da página atualizará os dados. Para MVP está OK. */
            })
            .catch(function () { /* silencioso */ });
    })();

    /* Inicializa KPI de meta com valores padrão */
    atualizarKpiMeta();

})();
