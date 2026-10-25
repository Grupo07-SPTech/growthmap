
function plotarGraficoMunicipios() {
    const municipios = ['Itu', 'Sorocaba', 'Piracicaba', 'Jundiaí', 'Campinas'];
    const diferencas = [-23, -20, -7, 6, 11];

    new Chart(document.getElementById('graficoMunicipios'), {
        type: 'bar',
        data: {
            labels: municipios,
            datasets: [{
                label: 'Diferença em relação ao estado (pontos)',
                data: diferencas,
                backgroundColor: diferencas.map(valor => valor < 0 ? '#bd4a08' : '#2c6aa0'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    min: -35,
                    max: 35,
                    ticks: { callback: valor => valor > 0 ? '+' + valor : valor }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

function plotarGraficoAreas() {
    const areas = ['Linguagens', 'Humanas', 'Natureza', 'Matemática', 'Redação'];

    new Chart(document.getElementById('graficoAreasEnem'), {
        type: 'bar',
        data: {
            labels: areas,
            datasets: [
                {
                    label: 'Sorocaba',
                    data: [531, 550, 484, 487, 592],
                    backgroundColor: '#8d2146'
                },
                {
                    label: 'Estado',
                    data: [540, 556, 506, 528, 610],
                    backgroundColor: '#a9a9a9'
                },
                {
                    label: 'Média da rede',
                    data: [541, 560, 500, 516, 608],
                    backgroundColor: '#2f71aa'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 700 },
                x: { grid: { display: false } }
            }
        }
    });
}

if (typeof Chart !== 'undefined') {
    if (document.getElementById('graficoMunicipios')) {
        plotarGraficoMunicipios();
    }

    if (document.getElementById('graficoAreasEnem')) {
        plotarGraficoAreas();
    }
}
