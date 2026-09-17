import { Router } from 'express';
import { getAll, runQuery } from '../db/database.js';
import { DetectionEngine } from '../engine/detectionEngine.js';

export const eventsRouter = Router();

// GET /api/events - List security events with filtering & pagination
eventsRouter.get('/', async (req, res) => {
  try {
    const { vehicle_id, severity, limit = 100, offset = 0, search } = req.query;
    let query = 'SELECT * FROM security_events WHERE 1=1';
    const params: any[] = [];

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

    const events = await getAll(query, params);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events - Ingest external CAN frame from Python collector
eventsRouter.post('/', async (req, res) => {
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

    const result = await DetectionEngine.processMessage(frame);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
