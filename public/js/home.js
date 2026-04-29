async function getData() {
    try {
        const response = await fetch("/api/getData");

        const data = await response.json();

        console.log("Dati ricevuti dal server:", data);

        if (!data) return;

        // --- Aggiornamento CPU ---
        if (data.cpuHist && data.cpuHist.length > 0) {
            cpuChart.data.labels = data.cpuHist.map(() => '');
            cpuChart.data.datasets[0].data = data.cpuHist;
            cpuChart.update('none');
        }

        // --- Aggiornamento RAM ---
        if (data.ramHist && data.ramHist.length > 0) {
            ramChart.data.labels = data.ramHist.map(() => '');
            ramChart.data.datasets[0].data = data.ramHist;
            ramChart.update('none');
        }

        // --- Aggiornamento GPU ---
        if (data.gpuHist && data.gpuHist.length > 0) {
            gpuChart.data.labels = data.gpuHist.map(() => '');
            gpuChart.data.datasets[0].data = data.gpuHist; 
            gpuChart.update('none');
        }

    } catch (e) {
        console.error("Errore nel recupero dati API:", e.message);
    }
}

function start() {
    getData()
    setInterval(getData, refreshDelay)
}

// Charts
const cpuCtx = document.getElementById('cpuChart');
const cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
        labels: [], // Parti vuoto
        datasets: [{
            label: 'CPU Usage (%)',
            data: [], // Parti vuoto
            borderColor: 'rgb(240, 240, 230)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(240, 240, 230, 0.1)'
        }]
    },
    options: {
        animation: false, // Disabilita animazioni per un look da "monitor in tempo reale"
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false }, 
            y: { 
                display: false, 
                min: 0, 
                max: 100,
                beginAtZero: true 
            }
        }
    }
});

const ramCtx = document.getElementById('ramChart');
const ramChart = new Chart(ramCtx, {
    type: 'line',
    data: {
        labels: [], // Parti vuoto
        datasets: [{
            label: 'RAM Usage (%)',
            data: [], // Parti vuoto
            borderColor: 'rgb(240, 240, 230)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(240, 240, 230, 0.1)'
        }]
    },
    options: {
        animation: false, // Disabilita animazioni per un look da "monitor in tempo reale"
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false }, 
            y: { 
                display: false, 
                min: 0, 
                max: 100,
                beginAtZero: true 
            }
        }
    }
});

const gpuCtx = document.getElementById('gpuChart');
const gpuChart = new Chart(gpuCtx, {
    type: 'line',
    data: {
        labels: [], // Parti vuoto
        datasets: [{
            label: 'GPU Usage (%)',
            data: [], // Parti vuoto
            borderColor: 'rgb(240, 240, 230)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(240, 240, 230, 0.1)'
        }]
    },
    options: {
        animation: false, // Disabilita animazioni per un look da "monitor in tempo reale"
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false }, 
            y: { 
                display: false, 
                min: 0, 
                max: 100,
                beginAtZero: true 
            }
        }
    }
});