const fs = require("fs").promises;
const xml2js = require("xml2js");
const path = require("path");
const os = require("os-utils");

const configPath = path.join(__dirname, "data", "config.xml");
const logPath = path.join(__dirname, "data", "userLog.csv");

const maxLogLines = 60;

async function parseConfig() {
    try {
        const xmlData = (await fs.readFile(configPath, "utf-8")).trim();

        const parser = new xml2js.Parser({ explicitArray: false });

        const result = await parser.parseStringPromise(xmlData);

        return result.configuration;
        
    } catch (error) {
        console.error("Errore durante il parsing del file XML:", error);
        return null;
    }
}

async function getLog() {
    try {

        const data = await fs.readFile(logPath, "utf-8");
        const last = data.trim().split("\n");

        timestamps = []
        cpuHist = []
        ramHist = []

        last.forEach(line => {
            const [time, cpu, ram] = line.split(",");
            timestamps.push(time);
            cpuHist.push(parseFloat(cpu));
            ramHist.push(parseFloat(ram));
        });

        return { timestamps, cpuHist, ramHist };

    } catch (error) {
        console.error("Errore durante il parsing del file XML:", error);
        return null;
    }   
}

async function updateLogs() {
    os.cpuUsage(async (v) => {
        const cpu = (v * 100).toFixed(2);
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const ram = (((totalRam - freeRam) / totalRam) * 100).toFixed(2);
        const logLine = `${new Date().toISOString()},${cpu},${ram}`;

        try {
            let lines = [];
            try {
                const data = await fs.readFile(logPath, "utf-8");
                lines = data.trim().split("\n");
            } catch (e) {
            }

            lines.push(logLine);

            if (lines.length > maxLogLines) {
                lines = lines.slice(-maxLogLines);
            }

            await fs.writeFile(logPath, lines.join("\n") + "\n");
            
            console.log(`[Log] Saved (CPU: ${cpu} | RAM: ${ram})`);
        } catch (err) {
            console.error("Errore gestione log:", err.message);
        }
    });
}

module.exports = { parseConfig, getLog, updateLogs };