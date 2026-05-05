let zoomChart = null;

// --- 1. INIZIALIZZAZIONE CHART PICCOLE ---

const cpuChart = new Chart(document.getElementById('cpuChart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'CPU', data: [], borderColor: 'rgb(240, 240, 230)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(240, 240, 230, 0.1)' }] },
    options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } } }
});

const ramChart = new Chart(document.getElementById('ramChart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'RAM', data: [], borderColor: 'rgb(240, 240, 230)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(240, 240, 230, 0.1)' }] },
    options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } } }
});

const gpuChart = new Chart(document.getElementById('gpuChart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'GPU', data: [], borderColor: 'rgb(240, 240, 230)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(240, 240, 230, 0.1)' }] },
    options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } } }
});

const diskChart = new Chart(document.getElementById('diskChart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Disk', data: [], borderColor: 'rgb(240, 240, 230)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(240, 240, 230, 0.1)' }] },
    options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 10 } } }
});

const netChart = new Chart(document.getElementById('netChart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Net', data: [], borderColor: 'rgb(240, 240, 230)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(240, 240, 230, 0.1)' }] },
    options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } } }
});

// --- 2. FUNZIONE ZOOM ---

function activateZoom(chart, title) {
    const zoomTitle = document.getElementById('zoom-title');
    if (zoomTitle) zoomTitle.innerText = "Dettaglio: " + title;
    
    if (zoomChart) zoomChart.destroy();

    const zoomCtx = document.getElementById('zoomChart').getContext('2d');
    zoomChart = new Chart(zoomCtx, {
        type: 'line',
        data: chart.data, // Condivide l'oggetto data
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#fff' } } },
            scales: {
                x: { display: true, ticks: { color: '#888' } },
                y: { 
                    display: true, 
                    min: chart.options.scales.y.min, 
                    max: chart.options.scales.y.max,
                    ticks: { color: '#888' }
                }
            }
        }
    });
}

// Eventi click (assicurati che gli ID esistano nell'HTML)
document.getElementById('cpuChart').onclick = () => activateZoom(cpuChart, "CPU Usage");
document.getElementById('ramChart').onclick = () => activateZoom(ramChart, "RAM Usage");
document.getElementById('gpuChart').onclick = () => activateZoom(gpuChart, "GPU Usage");
document.getElementById('diskChart').onclick = () => activateZoom(diskChart, "Disk Activity");
document.getElementById('netChart').onclick = () => activateZoom(netChart, "Network Traffic");

// --- 3. RECUPERO DATI ---

async function getData() {
    try {
        const response = await fetch("/api/getData");
        const data = await response.json();
        if (!data || !data.timestamps) return;

        const labels = data.timestamps.map(() => '');

        // Aggiornamento dati (questo aggiorna automaticamente anche lo zoom)
        cpuChart.data.labels = labels;
        cpuChart.data.datasets[0].data = data.cpuHist;
        cpuChart.update('none');

        ramChart.data.labels = labels;
        ramChart.data.datasets[0].data = data.ramHist;
        ramChart.update('none');

        gpuChart.data.labels = labels;
        gpuChart.data.datasets[0].data = data.gpuHist;
        gpuChart.update('none');

        diskChart.data.labels = labels;
        diskChart.data.datasets[0].data = data.diskHist;
        diskChart.update('none');

        netChart.data.labels = labels;
        netChart.data.datasets[0].data = data.netHist;
        netChart.update('none');

        // Se lo zoom è attivo, ridisegnalo
        if (zoomChart) {
            zoomChart.update('none');
        }

    } catch (e) { console.error("Errore fetch:", e); }
}

function start() {
    getData();
    setInterval(getData, 1000);
}

start();