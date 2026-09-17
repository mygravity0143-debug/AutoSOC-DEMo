"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
const socketManager_js_1 = require("../ws/socketManager.js");
exports.alertsRouter = (0, express_1.Router)();
// GET /api/alerts
exports.alertsRouter.get('/', async (req, res) => {
    try {
        const { status, severity } = req.query;
        let query = 'SELECT * FROM alerts WHERE 1=1';
        const params = [];
        if (status && status !== 'ALL') {
            query += ' AND status = ?';
            params.push(status);
        }
        if (severity && severity !== 'ALL') {
            query += ' AND severity = ?';
            params.push(severity);
        }
        query += ' ORDER BY timestamp DESC';
        const alerts = await (0, database_js_1.getAll)(query, params);
        res.json(alerts);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/alerts/:id/acknowledge
exports.alertsRouter.patch('/:id/acknowledge', async (req, res) => {
    try {
        const alert = await (0, database_js_1.getOne)('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        await (0, database_js_1.runQuery)('UPDATE alerts SET status = ? WHERE id = ?', ['ACKNOWLEDGED', req.params.id]);
        const updated = { ...alert, status: 'ACKNOWLEDGED' };
        socketManager_js_1.socketManager.broadcast('ALERT_UPDATED', updated);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/alerts/:id/resolve
exports.alertsRouter.patch('/:id/resolve', async (req, res) => {
    try {
        const alert = await (0, database_js_1.getOne)('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        await (0, database_js_1.runQuery)('UPDATE alerts SET status = ? WHERE id = ?', ['RESOLVED', req.params.id]);
        const updated = { ...alert, status: 'RESOLVED' };
        socketManager_js_1.socketManager.broadcast('ALERT_UPDATED', updated);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
