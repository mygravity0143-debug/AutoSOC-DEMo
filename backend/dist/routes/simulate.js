"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateRouter = void 0;
const express_1 = require("express");
const ecuSimulator_js_1 = require("../simulator/ecuSimulator.js");
exports.simulateRouter = (0, express_1.Router)();
// Control CAN simulator
exports.simulateRouter.post('/start', (req, res) => {
    ecuSimulator_js_1.EcuSimulator.start();
    res.json({ status: 'started', ...ecuSimulator_js_1.EcuSimulator.getStatus() });
});
exports.simulateRouter.post('/stop', (req, res) => {
    ecuSimulator_js_1.EcuSimulator.stop();
    res.json({ status: 'stopped', ...ecuSimulator_js_1.EcuSimulator.getStatus() });
});
exports.simulateRouter.get('/status', (req, res) => {
    res.json(ecuSimulator_js_1.EcuSimulator.getStatus());
});
exports.simulateRouter.post('/rate', (req, res) => {
    const { rate } = req.body;
    ecuSimulator_js_1.EcuSimulator.setRate(Number(rate) || 5);
    res.json({ status: 'rate_updated', ...ecuSimulator_js_1.EcuSimulator.getStatus() });
});
// Attack simulations
exports.simulateRouter.post('/unknown-can-id', async (req, res) => {
    const { vehicle_id } = req.body;
    const result = await ecuSimulator_js_1.EcuSimulator.injectUnknownCanId(vehicle_id || 'VEH-001');
    res.json({ message: 'Simulated Unknown CAN ID injection (0x777)', frame: result });
});
exports.simulateRouter.post('/can-flood', async (req, res) => {
    const { vehicle_id } = req.body;
    const result = await ecuSimulator_js_1.EcuSimulator.injectCanFlood(vehicle_id || 'VEH-002');
    res.json({ message: 'Simulated CAN message flooding (DoS)', framesCount: result.length });
});
exports.simulateRouter.post('/abnormal-rate', async (req, res) => {
    const { vehicle_id } = req.body;
    await ecuSimulator_js_1.EcuSimulator.injectAbnormalRate(vehicle_id || 'VEH-003');
    res.json({ message: 'Simulated abnormal message rate anomaly' });
});
exports.simulateRouter.post('/auth-failure', async (req, res) => {
    const { vehicle_id } = req.body;
    const result = await ecuSimulator_js_1.EcuSimulator.injectAuthFailure(vehicle_id || 'VEH-004');
    res.json({ message: 'Simulated SecOC Authentication Failure', frame: result });
});
exports.simulateRouter.post('/diagnostic-abuse', async (req, res) => {
    const { vehicle_id } = req.body;
    await ecuSimulator_js_1.EcuSimulator.injectDiagnosticAbuse(vehicle_id || 'VEH-006');
    res.json({ message: 'Simulated UDS Diagnostic Abuse / Scanning' });
});
exports.simulateRouter.post('/ecu-anomaly', async (req, res) => {
    const { vehicle_id } = req.body;
    const result = await ecuSimulator_js_1.EcuSimulator.injectEcuAnomaly(vehicle_id || 'VEH-001');
    res.json({ message: 'Simulated ECU Cross-domain Spoofing Anomaly', frame: result });
});
exports.simulateRouter.post('/firmware-integrity', async (req, res) => {
    const { vehicle_id } = req.body;
    const result = await ecuSimulator_js_1.EcuSimulator.injectFirmwareAnomaly(vehicle_id || 'VEH-005');
    res.json({ message: 'Simulated Firmware Checksum & Bootloader Tampering', frame: result });
});
