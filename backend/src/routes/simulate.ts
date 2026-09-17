import { Router } from 'express';
import { EcuSimulator } from '../simulator/ecuSimulator.js';

export const simulateRouter = Router();

// Control CAN simulator
simulateRouter.post('/start', (req, res) => {
  EcuSimulator.start();
  res.json({ status: 'started', ...EcuSimulator.getStatus() });
});

simulateRouter.post('/stop', (req, res) => {
  EcuSimulator.stop();
  res.json({ status: 'stopped', ...EcuSimulator.getStatus() });
});

simulateRouter.get('/status', (req, res) => {
  res.json(EcuSimulator.getStatus());
});

simulateRouter.post('/rate', (req, res) => {
  const { rate } = req.body;
  EcuSimulator.setRate(Number(rate) || 5);
  res.json({ status: 'rate_updated', ...EcuSimulator.getStatus() });
});

// Attack simulations
simulateRouter.post('/unknown-can-id', async (req, res) => {
  const { vehicle_id } = req.body;
  const result = await EcuSimulator.injectUnknownCanId(vehicle_id || 'VEH-001');
  res.json({ message: 'Simulated Unknown CAN ID injection (0x777)', frame: result });
});

simulateRouter.post('/can-flood', async (req, res) => {
  const { vehicle_id } = req.body;
  const result = await EcuSimulator.injectCanFlood(vehicle_id || 'VEH-002');
  res.json({ message: 'Simulated CAN message flooding (DoS)', framesCount: result.length });
});

simulateRouter.post('/abnormal-rate', async (req, res) => {
  const { vehicle_id } = req.body;
  await EcuSimulator.injectAbnormalRate(vehicle_id || 'VEH-003');
  res.json({ message: 'Simulated abnormal message rate anomaly' });
});

simulateRouter.post('/auth-failure', async (req, res) => {
  const { vehicle_id } = req.body;
  const result = await EcuSimulator.injectAuthFailure(vehicle_id || 'VEH-004');
  res.json({ message: 'Simulated SecOC Authentication Failure', frame: result });
});

simulateRouter.post('/diagnostic-abuse', async (req, res) => {
  const { vehicle_id } = req.body;
  await EcuSimulator.injectDiagnosticAbuse(vehicle_id || 'VEH-006');
  res.json({ message: 'Simulated UDS Diagnostic Abuse / Scanning' });
});

simulateRouter.post('/ecu-anomaly', async (req, res) => {
  const { vehicle_id } = req.body;
  const result = await EcuSimulator.injectEcuAnomaly(vehicle_id || 'VEH-001');
  res.json({ message: 'Simulated ECU Cross-domain Spoofing Anomaly', frame: result });
});

simulateRouter.post('/firmware-integrity', async (req, res) => {
  const { vehicle_id } = req.body;
  const result = await EcuSimulator.injectFirmwareAnomaly(vehicle_id || 'VEH-005');
  res.json({ message: 'Simulated Firmware Checksum & Bootloader Tampering', frame: result });
});
