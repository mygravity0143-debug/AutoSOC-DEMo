import { Router } from 'express';
import { getAll } from '../db/database.js';

export const ecusRouter = Router();

// GET /api/ecus - List all fleet ECUs
ecusRouter.get('/', async (req, res) => {
  try {
    const { vehicle_id, type, status } = req.query;
    let query = 'SELECT * FROM ecus WHERE 1=1';
    const params: any[] = [];

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
    const ecus = await getAll(query, params);
    res.json(ecus);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
