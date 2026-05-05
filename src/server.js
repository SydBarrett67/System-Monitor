const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { parseConfig, getLog, updateLogs, logAlert } = require("./utils.js");

const PORT = 3000;
const app = express();
let delay = 3000;
let logInterval;

// Imposta il motore di template EJS e la cartella delle viste
app.set('view engine', 'ejs');
// Definisce il percorso della cartella contenente i file EJS
app.set('views', path.join(__dirname, 'views'));
// Serve i file statici dalla cartella public
app.use(express.static(path.join(__dirname, "../public")));

async function monitorCycle() {
    try {
        const stats = await updateLogs();
        console.log("Dati ricevuti per alert:", stats);

        if (stats) {
            if (stats.cpu > 90) await logAlert("CPU", stats.cpu);
            if (stats.ram > 90) await logAlert("RAM", stats.ram);
            if (stats.gpu > 90) await logAlert("GPU", stats.gpu);
            if (stats.disk > 90) await logAlert("DISK", stats.disk);
        }
    } catch (e) {
        console.error("Errore monitoraggio:", e.message);
    }
}

async function startMonitoring() {
    const config = await parseConfig();
    if (config) {
        delay = parseInt(config.systemSettings.delay) || 3000;
    }
    if (logInterval) clearInterval(logInterval);
    logInterval = setInterval(monitorCycle, delay);
}
startMonitoring();

// Gestisce la rotta principale caricando la configurazione dinamica e renderizzando la home
app.get('/', async (req, res) => {
    try {
        const config = await parseConfig();
        if (!config) return res.status(500).send("Errore configurazione.");

        const newDelay = parseInt(config.systemSettings.delay) || 3000;
        if (newDelay !== delay) {
            delay = newDelay;
            clearInterval(logInterval);
            logInterval = setInterval(monitorCycle, delay);
        }

        res.render("home", {
            title: config.homePage.title,
            greeting: config.homePage.msg,
            delay: delay
        });
    } catch (e) { console.log(e.message); }
});

// Renderizza la pagina del terminale per la visualizzazione dei log grezzi
app.get('/log', (req, res) => {
    res.render("terminal", { title: "Raw System Log", delay: delay });
});

// Renderizza la pagina di selezione per l'esportazione dei dati
app.get('/exportPage', (req, res) => {
    res.render("export", { title: "Esportazione Dati" });
});

// Endpoint API per fornire i dati storici delle risorse in formato JSON
app.get('/api/getData', async (req, res) => {
    try {
        const data = await getLog();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }    
});

// Endpoint API per generare e scaricare i log in formato CSV, JSON o XML
app.get('/api/export/:format', async (req, res) => {
    const format = req.params.format.toLowerCase();
    const csvPath = path.join(__dirname, "data", "userLog.csv");

    try {
        const data = await fs.readFile(csvPath, "utf-8");
        const lines = data.trim().split("\n");
        const headers = ["timestamp", "cpu", "cpuTemp", "ram", "gpu", "gpuTemp", "disk", "net"];
        
        const jsonData = lines.map(line => {
            const values = line.split(",");
            let obj = {};
            headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : "");
            return obj;
        });

        if (format === "csv") {
            res.attachment("logs.csv").send(data);
        } else if (format === "json") {
            res.attachment("logs.json").json(jsonData);
        } else if (format === "xml") {
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<logs>\n';
            jsonData.forEach(obj => {
                xml += '  <entry>\n';
                headers.forEach(h => xml += `    <${h}>${obj[h]}</${h}>\n`);
                xml += '  </entry>\n';
            });
            xml += '</logs>';
            res.attachment("logs.xml").type('application/xml').send(xml);
        } else {
            res.status(400).send("Formato non supportato");
        }
    } catch (e) {
        res.status(500).send("Errore durante l'esportazione");
    }
});

// Endpoint API per il download del file XML contenente i log degli alert critici
app.get('/api/export-alerts', async (req, res) => {
    const alertPath = path.join(__dirname, "data", "alertLog.xml");
    try {
        await fs.access(alertPath);
        res.attachment("alertLog.xml").sendFile(alertPath);
    } catch (e) {
        res.status(404).send("Nessun alert log trovato.");
    }
});

// Middleware per la gestione degli errori 404 per rotte non definite
app.use((req, res) => {
    res.status(404).send("<h1>Pagina non trovata</h1>");
});

// Avvia il server mettendolo in ascolto sulla porta specificata
app.listen(PORT, () => {
    console.log("Server avviato sulla porta " + PORT);
});