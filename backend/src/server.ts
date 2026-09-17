import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { socketManager } from './ws/socketManager.js';
import { startRiskDecayService } from './engine/riskScoring.js';
import { EcuSimulator } from './simulator/ecuSimulator.js';

import { vehiclesRouter } from './routes/vehicles.js';
import { ecusRouter } from './routes/ecus.js';
import { eventsRouter } from './routes/events.js';
import { alertsRouter } from './routes/alerts.js';
import { incidentsRouter } from './routes/incidents.js';
import { vulnerabilitiesRouter } from './routes/vulnerabilities.js';
import { analyticsRouter } from './routes/analytics.js';
import { simulateRouter } from './routes/simulate.js';
import { getAll } from './db/database.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');

app.use(cors());
app.use(express.json());

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^\/(?!api|ws).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Routes
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/ecus', ecusRouter);
app.use('/api/events', eventsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/vulnerabilities', vulnerabilitiesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/simulate', simulateRouter);

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
    ws_clients: socketManager.getActiveClientsCount(),
    simulation_running: EcuSimulator.getStatus().isRunning,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Notifications endpoint
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await getAll('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 30');
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);

async function startServer() {
  await initDatabase();
  await seedDatabase();
  socketManager.init(server);
  startRiskDecayService();

  // Start initial normal CAN simulator stream
  EcuSimulator.start();

  server.listen(port, () => {
    console.log(`[AutoSOC Backend] Server running on http://localhost:${port}`);
    console.log(`[AutoSOC Backend] WebSocket endpoint listening on ws://localhost:${port}/ws`);
  });
}

startServer().catch(err => {
  console.error('[AutoSOC Backend] Startup failed:', err);
});
