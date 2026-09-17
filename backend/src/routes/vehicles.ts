import { Router } from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';

export const vehiclesRouter = Router();

// GET /api/vehicles - List with search and filtering
vehiclesRouter.get('/', async (req, res) => {
  try {
    const { search, status, sort } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params: any[] = [];

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
    } else if (sort === 'risk_asc') {
      query += ' ORDER BY risk_score ASC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const vehicles = await getAll(query, params);
    res.json(vehicles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/:id - Details with ECUs and recent events
vehiclesRouter.get('/:id', async (req, res) => {
  try {
    const vehicle = await getOne('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const ecus = await getAll('SELECT * FROM ecus WHERE vehicle_id = ?', [req.params.id]);
    const recentEvents = await getAll(
      'SELECT * FROM security_events WHERE vehicle_id = ? ORDER BY timestamp DESC LIMIT 10',
      [req.params.id]
    );
    const recentCan = await getAll(
      'SELECT * FROM can_events WHERE vehicle_id = ? ORDER BY id DESC LIMIT 20',
      [req.params.id]
    );

    res.json({
      vehicle,
      ecus,
      recentEvents,
      recentCan
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
