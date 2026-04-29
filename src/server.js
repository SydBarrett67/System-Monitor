const express = require("express");
const path = require("path");
const { parseConfig, getLog, updateLogs } = require("./utils.js");

const PORT = 3000;
const app = express();
let delay = 1000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, "../public")));

// Home route
app.get('/', async (req, res) => {
    try {
        // Parsing xml di configurazione
        const config = await parseConfig();
        if (!config) {
            return res.status(500).send("Errore: Configurazione XML non caricata.");
        }

        delay = parseInt(config.systemSettings.delay) || 3000

        // Rendering EJS
        res.render("home", {
            title: config.homePage.title,
            greeting: config.homePage.msg,
            delay: delay
        });

    } catch (e) {
        console.log("Errors occured: " + e.message);
    }
})

// APIs
app.get('/api/getData', async (req, res) => {
    console.log("Received request")
    try {
        const data = await getLog();
        res.json(data);
    } catch (e) {
        console.log("Errore API " + e.message)
    }    
})




// Loop per ottenere i dati dal sistema
setInterval(updateLogs, delay)

// Fallback 404
app.use((req, res) => {
    res.status(404).send("<h1>Pagina non trovata</h1>");
});

// Ascoltatore sulla porta 
app.listen(PORT, () => {
    console.log("Server avviato sulla porta " + PORT);
})