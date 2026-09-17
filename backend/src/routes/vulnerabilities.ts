import { Router } from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';

export const vulnerabilitiesRouter = Router();

// GET /api/vulnerabilities
vulnerabilitiesRouter.get('/', async (req, res) => {
  try {
    const { status, severity, ecu_name } = req.query;
    let query = 'SELECT * FROM vulnerabilities WHERE 1=1';
    const params: any[] = [];

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
    const vulns = await getAll(query, params);
    res.json(vulns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vulnerabilities/:id
vulnerabilitiesRouter.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await runQuery('UPDATE vulnerabilities SET status = ? WHERE id = ?', [status, req.params.id]);
    const updated = await getOne('SELECT * FROM vulnerabilities WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
