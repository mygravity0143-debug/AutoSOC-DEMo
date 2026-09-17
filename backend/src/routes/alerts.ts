import { Router } from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';
import { socketManager } from '../ws/socketManager.js';

export const alertsRouter = Router();

// GET /api/alerts
alertsRouter.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (severity && severity !== 'ALL') {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY timestamp DESC';
    const alerts = await getAll(query, params);
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/acknowledge
alertsRouter.patch('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await getOne('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await runQuery('UPDATE alerts SET status = ? WHERE id = ?', ['ACKNOWLEDGED', req.params.id]);
    const updated = { ...alert, status: 'ACKNOWLEDGED' };

    socketManager.broadcast('ALERT_UPDATED', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve
alertsRouter.patch('/:id/resolve', async (req, res) => {
  try {
    const alert = await getOne('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await runQuery('UPDATE alerts SET status = ? WHERE id = ?', ['RESOLVED', req.params.id]);
    const updated = { ...alert, status: 'RESOLVED' };

    socketManager.broadcast('ALERT_UPDATED', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
