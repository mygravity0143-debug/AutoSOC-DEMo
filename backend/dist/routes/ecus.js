"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ecusRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.ecusRouter = (0, express_1.Router)();
// GET /api/ecus - List all fleet ECUs
exports.ecusRouter.get('/', async (req, res) => {
    try {
        const { vehicle_id, type, status } = req.query;
        let query = 'SELECT * FROM ecus WHERE 1=1';
        const params = [];
        if (vehicle_id) {
            query += ' AND vehicle_id = ?';
            params.push(vehicle_id);
        }
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (status) {
            query += ' AND security_status = ?';
            params.push(status);
        }
        query += ' ORDER BY vehicle_id ASC, id ASC';
        const ecus = await (0, database_js_1.getAll)(query, params);
        res.json(ecus);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
