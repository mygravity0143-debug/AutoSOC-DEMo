"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_js_1 = require("./db/database.js");
const seed_js_1 = require("./db/seed.js");
const socketManager_js_1 = require("./ws/socketManager.js");
const riskScoring_js_1 = require("./engine/riskScoring.js");
const ecuSimulator_js_1 = require("./simulator/ecuSimulator.js");
const vehicles_js_1 = require("./routes/vehicles.js");
const ecus_js_1 = require("./routes/ecus.js");
const events_js_1 = require("./routes/events.js");
const alerts_js_1 = require("./routes/alerts.js");
const incidents_js_1 = require("./routes/incidents.js");
const vulnerabilities_js_1 = require("./routes/vulnerabilities.js");
const analytics_js_1 = require("./routes/analytics.js");
const simulate_js_1 = require("./routes/simulate.js");
const database_js_2 = require("./db/database.js");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
const frontendDistPath = path_1.default.resolve(process.cwd(), '../frontend/dist');
app.use((0, cors_1.default)());
app.use(express_1.default.json());
if (fs_1.default.existsSync(frontendDistPath)) {
    app.use(express_1.default.static(frontendDistPath));
    app.get(/^\/(?!api|ws).*/, (req, res) => {
        res.sendFile(path_1.default.join(frontendDistPath, 'index.html'));
    });
}
// Routes
app.use('/api/vehicles', vehicles_js_1.vehiclesRouter);
app.use('/api/ecus', ecus_js_1.ecusRouter);
app.use('/api/events', events_js_1.eventsRouter);
app.use('/api/alerts', alerts_js_1.alertsRouter);
app.use('/api/incidents', incidents_js_1.incidentsRouter);
app.use('/api/vulnerabilities', vulnerabilities_js_1.vulnerabilitiesRouter);
app.use('/api/analytics', analytics_js_1.analyticsRouter);
app.use('/api/simulate', simulate_js_1.simulateRouter);
// System health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        can_interface: 'ONLINE (vcan0 / Virtual Simulated)',
        can_collector: 'ONLINE',
        detection_engine: 'ONLINE',
        backend_api: 'ONLINE',
        database: 'HEALTHY',
        websocket: 'CONNECTED',
        ws_clients: socketManager_js_1.socketManager.getActiveClientsCount(),
        simulation_running: ecuSimulator_js_1.EcuSimulator.getStatus().isRunning,
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});
// Notifications endpoint
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await (0, database_js_2.getAll)('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 30');
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
const server = http_1.default.createServer(app);
async function startServer() {
    await (0, database_js_1.initDatabase)();
    await (0, seed_js_1.seedDatabase)();
    socketManager_js_1.socketManager.init(server);
    (0, riskScoring_js_1.startRiskDecayService)();
    // Start initial normal CAN simulator stream
    ecuSimulator_js_1.EcuSimulator.start();
    server.listen(port, () => {
        console.log(`[AutoSOC Backend] Server running on http://localhost:${port}`);
        console.log(`[AutoSOC Backend] WebSocket endpoint listening on ws://localhost:${port}/ws`);
    });
}
startServer().catch(err => {
    console.error('[AutoSOC Backend] Startup failed:', err);
});
