/* Dashboard do Coordenador — dados filtrados pela unidade selecionada. */
(function () {
    'use strict';

    var VINHO = '#7a1f3d';
    var VERDE = '#2b9348';
    var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    var AREAS = {
        'C.Natureza': 'municipio_cn',
        'C.Humanas': 'municipio_ch',
        'Linguagens': 'municipio_lc',
        'Matemática': 'municipio_mt',
        'Redação': 'municipio_redacao'
    };

    var METAS_AREA = {
        'C.Natureza': 520,
        'C.Humanas': 550,
        'Linguagens': 580,
        'Matemática': 610,
        'Redação': 620
    };

    var REGISTROS_ATUAIS = 0;
    var metaAtual = 10;
    var dadosHistorico = [];
    var unidadeAtual = null;

    function elemento(id) {
        return document.getElementById(id);
    }

    function texto(id, valor) {
        var el = elemento(id);
        if (el) el.textContent = valor;
    }

    function linhaMeta(area) {
        return [{
            y: METAS_AREA[area],
            borderColor: VERDE,
            strokeDashArray: 6,
            label: {
                text: 'Meta: ' + METAS_AREA[area],
                position: 'left',
                textAnchor: 'start',
                style: { color: '#fff', background: VERDE, fontSize: '11px' }
            }
        }];
    }

    function atualizarKpiMeta() {
        var pct = metaAtual > 0 ? Math.min(Math.round((REGISTROS_ATUAIS / metaAtual) * 100), 100) : 0;
        var faltam = Math.max(metaAtual - REGISTROS_ATUAIS, 0);

        texto('meta-valor', metaAtual);
        var barra = elemento('meta-barra');
        if (barra) barra.style.width = pct + '%';
        texto('meta-pct', pct + '% da meta');
        texto('meta-faltam', faltam > 0
            ? 'Faltam ' + faltam + ' registros para a meta'
            : 'Meta atingida!');
    }

    function criarFiltroUnidade() {
        var chart = document.querySelector('#chart');
        if (!chart) return null;

        var filtroExistente = elemento('filtro-unidade-dashboard');
        if (filtroExistente) return filtroExistente;

        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;align-items:center;gap:10px;margin:0 0 16px 0;flex-wrap:wrap;';

        var label = document.createElement('label');
        label.htmlFor = 'filtro-unidade-dashboard';
        label.textContent = 'Unidade:';
        label.style.cssText = 'font-weight:600;font-size:13px;color:#555;';

        var select = document.createElement('select');
        select.id = 'filtro-unidade-dashboard';
        select.style.cssText = 'min-width:220px;max-width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;font:inherit;color:#333;';

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        chart.parentNode.insertBefore(wrapper, chart);

        return select;
    }

    function preencherFiltroUnidade(unidades, idSelecionado) {
        var select = criarFiltroUnidade();
        if (!select) return;

        var valorAnterior = String(idSelecionado || select.value || '');
        select.innerHTML = '';

        (unidades || []).forEach(function (unidade) {
            var option = document.createElement('option');
            option.value = unidade.id;
            option.textContent = unidade.nome + ' — ' + unidade.nome_municipio + '/' + unidade.uf;
            select.appendChild(option);
        });

        if (valorAnterior && Array.prototype.some.call(select.options, function (op) {
            return op.value === valorAnterior;
        })) {
            select.value = valorAnterior;
        }

        select.onchange = function () {
            carregarDadosApi(Number(select.value));
        };
    }

    function atualizarGraficoHistorico(historico) {
        dadosHistorico = historico || [];
        var anos = dadosHistorico.map(function (r) { return String(r.ano); });
        var areaInicial = document.querySelector('.evolucao_medias_button.ativo');
        var area = areaInicial ? areaInicial.dataset.area : 'C.Natureza';
        var campo = AREAS[area] || AREAS['C.Natureza'];
        var valores = dadosHistorico.map(function (r) {
            return r[campo] == null ? null : Number(r[campo]);
        });

        chartEvolucao.updateOptions({
            xaxis: { categories: anos },
            series: [{ name: area, data: valores }],
            annotations: { yaxis: linhaMeta(area) }
        });

        if (!dadosHistorico.length) {
            texto('kpi-area-fraca', 'Sem dados');
            texto('kpi-nota-municipio', '—');
            texto('kpi-nota-estado', '—');
            texto('kpi-diff-area', 'Não há dados do ENEM para este município nos anos selecionados.');
            texto('kpi-ano-anterior-label', '—');
            texto('kpi-ano-atual-label', '—');
            texto('kpi-media-anterior', '—');
            texto('kpi-media-atual', '—');
            texto('kpi-variacao', 'Sem dados para comparação');
            return;
        }

        var ultimo = dadosHistorico[dadosHistorico.length - 1];
        var areas = Object.keys(AREAS).map(function (nome) {
            return { nome: nome, val: Number(ultimo[AREAS[nome]]) };
        }).filter(function (item) { return Number.isFinite(item.val); });

        if (areas.length) {
            var fraca = areas.reduce(function (a, b) { return a.val < b.val ? a : b; });
            var camposEstado = {
                'C.Natureza': 'estado_cn',
                'C.Humanas': 'estado_ch',
                'Linguagens': 'estado_lc',
                'Matemática': 'estado_mt',
                'Redação': 'estado_redacao'
            };
            var notaEstado = Number(ultimo[camposEstado[fraca.nome]]);
            texto('kpi-area-fraca', fraca.nome);
            texto('kpi-nota-municipio', fraca.val.toFixed(0) + ' pts');
            texto('kpi-nota-estado', Number.isFinite(notaEstado) ? notaEstado.toFixed(0) + ' pts' : '—');

            var diff = Number.isFinite(notaEstado) ? fraca.val - notaEstado : null;
            var elDiff = elemento('kpi-diff-area');
            if (elDiff && diff !== null) {
                elDiff.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(0) + ' pts em relação ao estado';
                elDiff.className = 'kpi-diff ' + (diff >= 0 ? 'kpi-positivo' : 'kpi-negativo');
            }
        }

        if (dadosHistorico.length >= 2) {
            var penultimo = dadosHistorico[dadosHistorico.length - 2];
            var campos = Object.keys(AREAS);
            var medAnterior = campos.reduce(function (soma, nome) {
                return soma + (Number(penultimo[AREAS[nome]]) || 0);
            }, 0) / campos.length;
            var medAtual = campos.reduce(function (soma, nome) {
                return soma + (Number(ultimo[AREAS[nome]]) || 0);
            }, 0) / campos.length;

            texto('kpi-ano-anterior-label', penultimo.ano);
            texto('kpi-ano-atual-label', ultimo.ano);
            texto('kpi-media-anterior', medAnterior.toFixed(0) + ' pts');
            texto('kpi-media-atual', medAtual.toFixed(0) + ' pts');

            var variacao = medAtual - medAnterior;
            var elVariacao = elemento('kpi-variacao');
            if (elVariacao) {
                elVariacao.textContent = (variacao >= 0 ? '+' : '') + variacao.toFixed(0) + ' pts em relação ao ano anterior';
                elVariacao.className = 'kpi-diff ' + (variacao >= 0 ? 'kpi-positivo' : 'kpi-negativo');
            }
        }
    }

    function atualizarGraficosDaUnidade(dados) {
        var eventos = new Array(12).fill(0);
        (dados.eventosPorMes || []).forEach(function (item) {
            var indice = Number(item.mes) - 1;
            if (indice >= 0 && indice < 12) eventos[indice] = Number(item.registros) || 0;
        });
        chartEventos.updateOptions({
            xaxis: { categories: MESES },
            series: [{ name: 'Registros', data: eventos }]
        });

        var professores = dados.professores || [];
        chartProfessores.updateOptions({
            series: [{ name: 'Registros', data: professores.map(function (p) { return Number(p.registros) || 0; }) }],
            xaxis: {
                categories: professores.map(function (p) { return p.nome; }),
                labels: { style: { fontSize: '12px', fontFamily: 'Poppins, sans-serif' } }
            },
            yaxis: {
                title: { text: 'Nº de registros' },
                min: 0,
                forceNiceScale: true
            }
        });

        REGISTROS_ATUAIS = Number(dados.planejamento && dados.planejamento.cadastrados) || 0;
        metaAtual = Number(dados.planejamento && dados.planejamento.meta) || 10;
        texto('kpi-registros-atual', REGISTROS_ATUAIS);
        atualizarKpiMeta();

        unidadeAtual = dados.unidadeSelecionada;
        if (unidadeAtual) {
            texto('badge-unidade', 'Unidade: ' + unidadeAtual.nome);
        }
    }

    var chartEvolucao = new ApexCharts(document.querySelector('#chart'), {
        series: [{ name: 'C.Natureza', data: [] }],
        chart: { height: 260, type: 'line', zoom: { enabled: false }, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
        colors: [VINHO],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4, strokeWidth: 0 },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f1f1f1' },
        xaxis: { categories: ['2023', '2024', '2025'] },
        yaxis: { min: 400, max: 700 },
        annotations: { yaxis: linhaMeta('C.Natureza') },
        legend: { show: false },
        noData: { text: 'Carregando dados...' }
    });
    chartEvolucao.render();

    document.querySelectorAll('.evolucao_medias_button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.evolucao_medias_button').forEach(function (b) {
                b.classList.remove('ativo');
            });
            btn.classList.add('ativo');

            var area = btn.dataset.area;
            var campo = AREAS[area];
            var valores = dadosHistorico.map(function (r) {
                return r[campo] == null ? null : Number(r[campo]);
            });
            chartEvolucao.updateOptions({
                series: [{ name: area, data: valores }],
                annotations: { yaxis: linhaMeta(area) }
            });
        });
    });

    var chartEventos = new ApexCharts(document.querySelector('#chartA'), {
        chart: { type: 'line', height: 300, zoom: { enabled: false }, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
        series: [{ name: 'Registros', data: [] }],
        colors: [VINHO],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4 },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f1f1f1' },
        xaxis: { categories: MESES },
        yaxis: { title: { text: 'Registros por mês' }, min: 0, forceNiceScale: true },
        legend: { show: false },
        noData: { text: 'Carregando dados...' }
    });
    chartEventos.render();

    var chartProfessores = new ApexCharts(document.querySelector('#chartProfessores'), {
        chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 6, distributed: true } },
        colors: ['#7a1f3d', '#a84060', '#c86882', '#d9a0b0'],
        dataLabels: { enabled: true, style: { fontSize: '12px', colors: ['#333'] }, offsetY: -6 },
        series: [{ name: 'Registros', data: [] }],
        xaxis: { categories: [] },
        yaxis: { title: { text: 'Nº de registros' }, min: 0, forceNiceScale: true },
        grid: { borderColor: '#f1f1f1' },
        legend: { show: false },
        noData: { text: 'Nenhum professor encontrado para esta unidade.' }
    });
    chartProfessores.render();

    function carregarDadosApi(idUnidadeSelecionada) {
        var idUnidadeUsuario = Number(sessionStorage.getItem('ID_UNIDADE'));
        var idUsuario = Number(sessionStorage.getItem('ID_USUARIO'));

        if (!idUnidadeUsuario || !idUsuario || !idUnidadeSelecionada) {
            console.warn('[dashboardCoordenador] Dados da sessão não encontrados.');
            return;
        }

        var url = '/dashboardCoordenador/dados/' + idUnidadeSelecionada
            + '?idUnidadeUsuario=' + encodeURIComponent(idUnidadeUsuario)
            + '&idUsuario=' + encodeURIComponent(idUsuario);

        fetch(url)
            .then(function (res) {
                if (!res.ok) {
                    return res.json().then(function (erro) {
                        throw new Error(erro.mensagem || 'Não foi possível carregar a dashboard.');
                    });
                }
                return res.json();
            })
            .then(function (dados) {
                preencherFiltroUnidade(dados.unidades, idUnidadeSelecionada);
                atualizarGraficoHistorico(dados.historico);
                atualizarGraficosDaUnidade(dados);
            })
            .catch(function (erro) {
                console.error('[dashboardCoordenador] Erro ao carregar dados:', erro);
            });
    }

    /* Modal de edição da meta, mantido conforme a estrutura atual da página. */
    function abrirMeta() {
        var overlay = elemento('meta-overlay');
        var input = elemento('meta-input');
        if (!overlay || !input) return;
        input.value = metaAtual;
        overlay.classList.add('aberto');
        input.focus();
    }

    function fecharMeta() {
        var overlay = elemento('meta-overlay');
        if (overlay) overlay.classList.remove('aberto');
    }

    function salvarMeta() {
        var input = elemento('meta-input');
        var val = input ? parseInt(input.value, 10) : 0;
        if (!val || val < 1) return;
        metaAtual = val;
        atualizarKpiMeta();
        fecharMeta();
    }

    if (elemento('btn-abrir-meta')) elemento('btn-abrir-meta').addEventListener('click', abrirMeta);
    if (elemento('btn-fechar-meta')) elemento('btn-fechar-meta').addEventListener('click', fecharMeta);
    if (elemento('btn-salvar-meta')) elemento('btn-salvar-meta').addEventListener('click', salvarMeta);
    if (elemento('meta-overlay')) {
        elemento('meta-overlay').addEventListener('click', function (e) {
            if (e.target === this) fecharMeta();
        });
    }

    /* Indicador visual do menu lateral. */
    var itensNav = Array.prototype.slice.call(document.querySelectorAll('.sidebar .nav-item'));
    var indicador = elemento('nav-indicador');

    function posicionarIndicador() {
        if (!indicador) return;
        var atual = itensNav.findIndex(function (item) { return item.classList.contains('ativo'); });
        if (atual < 0) return;
        indicador.style.transform = 'translateY(' + itensNav[atual].offsetTop + 'px)';
        indicador.style.opacity = 1;
    }

    window.addEventListener('load', posicionarIndicador);
    window.addEventListener('resize', posicionarIndicador);

    atualizarKpiMeta();

    var idUnidadeInicial = Number(sessionStorage.getItem('ID_UNIDADE'));
    if (idUnidadeInicial) carregarDadosApi(idUnidadeInicial);
})();
