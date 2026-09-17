"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentsRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
const socketManager_js_1 = require("../ws/socketManager.js");
exports.incidentsRouter = (0, express_1.Router)();
// GET /api/incidents
exports.incidentsRouter.get('/', async (req, res) => {
    try {
        const { status, severity } = req.query;
        let query = 'SELECT * FROM incidents WHERE 1=1';
        const params = [];
        if (status && status !== 'ALL') {
            query += ' AND status = ?';
            params.push(status);
        }
        if (severity && severity !== 'ALL') {
            query += ' AND severity = ?';
            params.push(severity);
        }
        query += ' ORDER BY created_time DESC';
        const incidents = await (0, database_js_1.getAll)(query, params);
        res.json(incidents);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/incidents/:id - Update status, notes, analyst
exports.incidentsRouter.patch('/:id', async (req, res) => {
    try {
        const { status, notes, assigned_analyst, resolution } = req.body;
        const incident = await (0, database_js_1.getOne)('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        const newStatus = status || incident.status;
        const newNotes = notes !== undefined ? notes : incident.notes;
        const newAnalyst = assigned_analyst || incident.assigned_analyst;
        const newResolution = resolution !== undefined ? resolution : incident.resolution;
        // Append to timeline
        let timeline = [];
        try {
            timeline = JSON.parse(incident.timeline_json || '[]');
        }
        catch (e) {
            timeline = [];
        }
        if (status && status !== incident.status) {
            timeline.push({
                time: new Date().toISOString(),
                event: `Status changed from ${incident.status} to ${status}`
            });
        }
        await (0, database_js_1.runQuery)(`UPDATE incidents SET status = ?, notes = ?, assigned_analyst = ?, resolution = ?, timeline_json = ? WHERE id = ?`, [newStatus, newNotes, newAnalyst, newResolution, JSON.stringify(timeline), req.params.id]);
        const updated = {
            ...incident,
            status: newStatus,
            notes: newNotes,
            assigned_analyst: newAnalyst,
            resolution: newResolution,
            timeline_json: JSON.stringify(timeline)
        };
        socketManager_js_1.socketManager.broadcast('INCIDENT_UPDATED', updated);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
