"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
const detectionEngine_js_1 = require("../engine/detectionEngine.js");
exports.eventsRouter = (0, express_1.Router)();
// GET /api/events - List security events with filtering & pagination
exports.eventsRouter.get('/', async (req, res) => {
    try {
        const { vehicle_id, severity, limit = 100, offset = 0, search } = req.query;
        let query = 'SELECT * FROM security_events WHERE 1=1';
        const params = [];
        if (vehicle_id) {
            query += ' AND vehicle_id = ?';
            params.push(vehicle_id);
        }
        if (severity && severity !== 'ALL') {
            query += ' AND severity = ?';
            params.push(severity);
        }
        if (search) {
            query += ' AND (threat_type LIKE ? OR description LIKE ? OR ecu_id LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));
        const events = await (0, database_js_1.getAll)(query, params);
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/events - Ingest external CAN frame from Python collector
exports.eventsRouter.post('/', async (req, res) => {
    try {
        const { vehicle_id, ecu_id, can_id, dlc, data, message_type } = req.body;
        if (!vehicle_id || !can_id) {
            return res.status(400).json({ error: 'vehicle_id and can_id are required' });
        }
        const frame = {
            timestamp: new Date().toISOString(),
            vehicle_id,
            ecu_id: ecu_id || `${vehicle_id}-ECU-01`,
            can_id,
            dlc: dlc || 8,
            data: data || '00 00 00 00 00 00 00 00',
            message_type: message_type || 'INGESTED'
        };
        const result = await detectionEngine_js_1.DetectionEngine.processMessage(frame);
        res.json({ success: true, result });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
