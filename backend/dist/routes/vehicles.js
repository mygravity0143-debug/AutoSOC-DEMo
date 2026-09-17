"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehiclesRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.vehiclesRouter = (0, express_1.Router)();
// GET /api/vehicles - List with search and filtering
exports.vehiclesRouter.get('/', async (req, res) => {
    try {
        const { search, status, sort } = req.query;
        let query = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];
        if (search) {
            query += ' AND (id LIKE ? OR vin LIKE ? OR model LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        if (status && status !== 'ALL') {
            query += ' AND security_status = ?';
            params.push(status);
        }
        if (sort === 'risk_desc') {
            query += ' ORDER BY risk_score DESC';
        }
        else if (sort === 'risk_asc') {
            query += ' ORDER BY risk_score ASC';
        }
        else {
            query += ' ORDER BY id ASC';
        }
        const vehicles = await (0, database_js_1.getAll)(query, params);
        res.json(vehicles);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/vehicles/:id - Details with ECUs and recent events
exports.vehiclesRouter.get('/:id', async (req, res) => {
    try {
        const vehicle = await (0, database_js_1.getOne)('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        const ecus = await (0, database_js_1.getAll)('SELECT * FROM ecus WHERE vehicle_id = ?', [req.params.id]);
        const recentEvents = await (0, database_js_1.getAll)('SELECT * FROM security_events WHERE vehicle_id = ? ORDER BY timestamp DESC LIMIT 10', [req.params.id]);
        const recentCan = await (0, database_js_1.getAll)('SELECT * FROM can_events WHERE vehicle_id = ? ORDER BY id DESC LIMIT 20', [req.params.id]);
        res.json({
            vehicle,
            ecus,
            recentEvents,
            recentCan
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
