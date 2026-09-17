import { Router } from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';
import { socketManager } from '../ws/socketManager.js';

export const incidentsRouter = Router();

// GET /api/incidents
incidentsRouter.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (severity && severity !== 'ALL') {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY created_time DESC';
    const incidents = await getAll(query, params);
    res.json(incidents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/incidents/:id - Update status, notes, analyst
incidentsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, notes, assigned_analyst, resolution } = req.body;
    const incident: any = await getOne('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
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
    } catch (e) {
      timeline = [];
    }

    if (status && status !== incident.status) {
      timeline.push({
        time: new Date().toISOString(),
        event: `Status changed from ${incident.status} to ${status}`
      });
    }

    await runQuery(
      `UPDATE incidents SET status = ?, notes = ?, assigned_analyst = ?, resolution = ?, timeline_json = ? WHERE id = ?`,
      [newStatus, newNotes, newAnalyst, newResolution, JSON.stringify(timeline), req.params.id]
    );

    const updated = {
      ...incident,
      status: newStatus,
      notes: newNotes,
      assigned_analyst: newAnalyst,
      resolution: newResolution,
      timeline_json: JSON.stringify(timeline)
    };

    socketManager.broadcast('INCIDENT_UPDATED', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
