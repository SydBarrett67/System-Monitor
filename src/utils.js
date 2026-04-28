const fs = require("fs").promises;
const xml2js = require("xml2js");
const path = require("path");
const os = require("os-utils");

const configPath = path.join(__dirname, "data", "config.xml");
const logPath = path.join(__dirname, "data", "userLog.csv");

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

function updateLogs() {
    os.cpuUsage((v) => {
        const cpuUsage = (v * 100).toFixed(2);
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const ramUsage = (((totalRam - freeRam) / totalRam) * 100).toFixed(2);

        const timestamp = new Date().toISOString();
        const logLine = `${timestamp},${cpuUsage},${ramUsage}\n`;

        try {
            fs.appendFile(logPath, logLine);
            console.log("[Log] CPU: " + cpuUsage + "% | RAM: " + ramUsage + "%");
        } catch (e) {
            console.error("Errore scrittura file", e)
        }
    });
}

module.exports = { parseConfig, getLog, updateLogs };