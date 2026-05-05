const fs = require("fs").promises;
const xml2js = require("xml2js");
const path = require("path");
const os = require("os-utils");
const si = require("systeminformation");

const configPath = path.join(__dirname, "data", "config.xml");
const logPath = path.join(__dirname, "data", "userLog.csv");

let maxLogLines = 60; // Limite righe CSV

// Valori precedenti per calcolo delta
let lastRead = 0;
let lastWrite = 0;
let lastNetRecv = 0;
let lastNetSent = 0;
let lastTime = Date.now();

/** Legge e parsa il config XML, restituisce l'oggetto configuration */
async function parseConfig() {
    try {
        const xmlData = (await fs.readFile(configPath, "utf-8")).trim();
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        maxLogLines = parseInt(result.configuration.maxLogLines) || maxLogLines;
        return result.configuration;
    } catch (error) {
        console.error("Errore XML:", error);
        return null;
    }
}

/** Legge il CSV e restituisce le serie storiche di ogni metrica */
async function getLog() {
    try {
        const data = await fs.readFile(logPath, "utf-8");
        const lines = data.trim().split("\n");

        const timestamps = [];
        const cpuHist = [];
        const cpuTempHist = [];
        const ramHist = [];
        const gpuHist = [];
        const gpuTempHist = [];
        const diskHist = [];
        const netHist = [];

        lines.forEach(line => {
            const parts = line.split(",");
            if (parts.length >= 8) {
                const [time, cpu, cpuTemp, ram, gpuLoad, gpuTemp, disk, net] = parts;
                timestamps.push(time);
                cpuHist.push(parseFloat(cpu) || 0);
                cpuTempHist.push(parseFloat(cpuTemp) || 0);
                ramHist.push(parseFloat(ram) || 0);
                gpuHist.push(parseFloat(gpuLoad) || 0);
                gpuTempHist.push(parseFloat(gpuTemp) || 0);
                diskHist.push(parseFloat(disk) || 0);
                netHist.push(parseFloat(net) || 0);
            }
        });

        return { timestamps, cpuHist, cpuTempHist, ramHist, gpuHist, gpuTempHist, diskHist, netHist };
    } catch (error) {
        return null;
    }   
}

/** Campiona le metriche di sistema e aggiunge una riga al CSV */
async function updateLogs() {
    let stats = null; // Inizializziamo l'oggetto stats

    try {
        // Raccolta parallela di tutte le metriche
        const [load, tempData, gpu, diskIO, netData] = await Promise.all([
            si.currentLoad(),
            si.cpuTemperature(),
            si.graphics(),
            si.disksIO(),
            si.networkStats()
        ]);

        const cpu = parseFloat(load.currentLoad.toFixed(2));
        const cpuTemp = tempData.main || 0;

        // RAM: percentuale usata
        const ram = parseFloat((((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2));

        // GPU: utilization o fallback su memoria usata/totale
        const mainGpu = gpu.controllers[0];
        let gpuLoadVal = 0;
        if (mainGpu) {
            gpuLoadVal = mainGpu.utilizationGpu || 
                       (mainGpu.memoryTotal ? (mainGpu.memoryUsed / mainGpu.memoryTotal) * 100 : 0);
        }
        const gpuLoad = parseFloat(isNaN(gpuLoadVal) ? 0 : gpuLoadVal.toFixed(2));
        const gpuTemp = mainGpu?.temperatureGpu || 0;

        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000; 

        // Disco: bytes/s
        let diskMBpsVal = 0;
        try {
            const fsStats = await si.fsStats();
            if (fsStats && fsStats.rx_sec !== null) {
                diskMBpsVal = (fsStats.rx_sec + fsStats.wx_sec) / 1024 / 1024;
            } else if (diskIO && lastRead > 0) {
                const diff = (diskIO.rIO - lastRead) + (diskIO.wIO - lastWrite);
                diskMBpsVal = Math.max(0, diff) / deltaTime / 1024 / 1024;
            }
        } catch (e) {
            diskMBpsVal = 0;
        }
        const diskMBps = parseFloat(diskMBpsVal.toFixed(2));

        // Rete
        let netMBpsVal = 0;
        if (netData?.[0] && lastNetRecv > 0) {
            const diff = (netData[0].rx_bytes - lastNetRecv) + (netData[0].tx_bytes - lastNetSent);
            netMBpsVal = Math.max(0, diff) / deltaTime / 1024 / 1024;
        }
        const netMBps = parseFloat(netMBpsVal.toFixed(2));

        // Aggiorna valori per il prossimo ciclo
        lastNetRecv = netData?.[0]?.rx_bytes || 0;
        lastNetSent = netData?.[0]?.tx_bytes || 0;
        lastTime = currentTime;

        // Prepariamo l'oggetto stats da restituire (per gli alert nel server)
        stats = {
            cpu: cpu,
            ram: ram,
            gpu: gpuLoad,
            disk: diskMBps // Nota: qui passi il valore MB/s, se vuoi la % dovresti calcolarla diversamente
        };

        const logLine = `${new Date().toISOString()},${cpu},${cpuTemp},${ram},${gpuLoad},${gpuTemp},${diskMBps},${netMBps}`;

        let lines = [];
        try {
            const data = await fs.readFile(logPath, "utf-8");
            lines = data.trim().split("\n").filter(l => l.length > 0);
        } catch (e) {}

        lines.push(logLine);
        if (lines.length > maxLogLines) lines = lines.slice(-maxLogLines);

        await fs.writeFile(logPath, lines.join("\n") + "\n");
        console.log(`[Log] CPU: ${cpu}% | GPU: ${gpuLoad}% | RAM: ${ram}% | DISK: ${diskMBps} MB/s`);

    } catch (err) {
        console.error("Errore critico log:", err.message);
    }

    return stats; // Restituisce l'oggetto popolato o null in caso di errore
}

/** Aggiunge un alert XML quando una risorsa supera il 90% */
async function logAlert(resource, value) {
    const alertPath = path.join(__dirname, "data", "alertLog.xml");
    const timestamp = new Date().toLocaleString();
    
    const entry = `  <ALERT>
    <TIMESTAMP>${timestamp}</TIMESTAMP>
    <RESOURCE>${resource}</RESOURCE>
    <VALUE>${value}%</VALUE>
    <MESSAGE>Utilizzo critico rilevato (>90%)</MESSAGE>
    </ALERT>\n`;

    try {
        let content;
        try {
            content = await fs.readFile(alertPath, 'utf8');
        } catch (err) {
            // File non esistente: inizializza struttura XML
            content = `<?xml version="1.0" encoding="UTF-8"?>\n<ALERTS>\n</ALERTS>`;
        }

        // Inserisce l'entry prima del tag di chiusura
        if (content.includes('</ALERTS>')) {
            content = content.replace('</ALERTS>', entry + '</ALERTS>');
        } else {
            // File corrotto: ricostruisce da zero
            content = `<?xml version="1.0" encoding="UTF-8"?>\n<ALERTS>\n${entry}</ALERTS>`;
        }

        await fs.writeFile(alertPath, content, 'utf8');
    } catch (err) {
        console.error("Errore critico durante il salvataggio dell'alert XML:", err);
    }
}

module.exports = { parseConfig, getLog, updateLogs, logAlert };