async function getData() {
    try {
        const response = await fetch("/api/data");

        const data = await response.json();

        cpuChart.data.datasets[0].data = data.cpuHistory;
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
        labels: ['', '', '', '', ''],
        datasets: [{
            data: [],
            borderColor: 'rgb(240, 240, 230)',
            borderWidth: 1,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(240, 240, 230, 0.1)'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false }, 
            y: { display: false, min: 0, max: 100 }
        }
    }
})