"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vulnerabilitiesRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.vulnerabilitiesRouter = (0, express_1.Router)();
// GET /api/vulnerabilities
exports.vulnerabilitiesRouter.get('/', async (req, res) => {
    try {
        const { status, severity, ecu_name } = req.query;
        let query = 'SELECT * FROM vulnerabilities WHERE 1=1';
        const params = [];
        if (status && status !== 'ALL') {
            query += ' AND status = ?';
            params.push(status);
        }
        if (severity && severity !== 'ALL') {
            query += ' AND severity = ?';
            params.push(severity);
        }
        if (ecu_name) {
            query += ' AND ecu_name LIKE ?';
            params.push(`%${ecu_name}%`);
        }
        query += ' ORDER BY cvss_score DESC';
        const vulns = await (0, database_js_1.getAll)(query, params);
        res.json(vulns);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/vulnerabilities/:id
exports.vulnerabilitiesRouter.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await (0, database_js_1.runQuery)('UPDATE vulnerabilities SET status = ? WHERE id = ?', [status, req.params.id]);
        const updated = await (0, database_js_1.getOne)('SELECT * FROM vulnerabilities WHERE id = ?', [req.params.id]);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
