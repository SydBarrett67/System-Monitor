async function getData() {
    try {
        const response = await fetch("/api/data");

        const data = await response.json();

        cpuChart.data.datasets[0].data = data.cpuHistory;
        cpuChart.data.labels = data.cpuHistory.map(() => '');
        cpuChart.update();

//        myRamChart.data.datasets[0].data = data.ramHistory;
//        myRamChart.update();

    } catch (e) {
        console.error("Errore nel recupero dati API:", e.message);
    }
}

function start() {
    getData()
    setInterval(getData, refreshDelay)
}

// Charts
const ctx = document.getElementById('cpuChart').getContext('2d');
const cpuChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Parti vuoto
        datasets: [{
            label: 'CPU Usage (%)',
            data: [], // Parti vuoto
            borderColor: 'rgb(240, 240, 230)',
            borderWidth: 2, // Aumenta un po' per vederla meglio
            pointRadius: 0,
            tension: 0.4,   // Rende la linea curva e più "moderna"
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