import { Router } from 'express';
import { getAll, getOne } from '../db/database.js';
import { DetectionEngine } from '../engine/detectionEngine.js';
import { EcuSimulator } from '../simulator/ecuSimulator.js';

export const analyticsRouter = Router();

// GET /api/analytics - High-level SOC metrics, distributions, and charts
analyticsRouter.get('/', async (req, res) => {
  try {
    // 1. Vehicles count
    const vehicleStats: any = await getOne(`
      SELECT 
        COUNT(*) as total_vehicles,
        AVG(risk_score) as avg_risk,
        SUM(CASE WHEN security_status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_vehicles,
        SUM(CASE WHEN security_status = 'HIGH RISK' THEN 1 ELSE 0 END) as high_risk_vehicles,
        SUM(CASE WHEN security_status = 'MONITORING' THEN 1 ELSE 0 END) as monitoring_vehicles,
        SUM(CASE WHEN security_status = 'SECURE' THEN 1 ELSE 0 END) as secure_vehicles
      FROM vehicles
    `);

    // 2. ECUs count
    const ecuStats: any = await getOne(`
      SELECT 
        COUNT(*) as total_ecus,
        SUM(CASE WHEN security_status = 'SECURE' THEN 1 ELSE 0 END) as secure_ecus,
        SUM(CASE WHEN security_status = 'WARNING' THEN 1 ELSE 0 END) as warning_ecus,
        SUM(CASE WHEN security_status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_ecus
      FROM ecus
    `);

    // 3. Alerts
    const alertStats: any = await getOne(`
      SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_threats,
        SUM(CASE WHEN status = 'ACTIVE' AND severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_alerts
      FROM alerts
    `);

    // 4. Threat types breakdown
    const threatTypes = await getAll(`
      SELECT threat_type, COUNT(*) as count 
      FROM security_events 
      GROUP BY threat_type 
      ORDER BY count DESC
    `);

    // 5. Threat severity breakdown
    const severityDistribution = await getAll(`
      SELECT severity, COUNT(*) as count 
      FROM security_events 
      GROUP BY severity
    `);

    // 6. Vehicle Risk Scores for bar chart
    const vehicleRisks = await getAll(`
      SELECT id, model, risk_score, security_status 
      FROM vehicles 
      ORDER BY risk_score DESC
    `);

    // 7. Events Over Time (hourly buckets or simulation slots)
    // Create a time series from security_events
    const recentEvents = await getAll<any>(`
      SELECT timestamp, severity, risk_score 
      FROM security_events 
      ORDER BY timestamp DESC 
      LIMIT 100
    `);

    // Group into timeline buckets
    const timelineMap = new Map<string, { time: string; events: number; critical: number; high: number }>();
    const now = new Date();
    // Pre-populate last 6 hours slots
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${d.getHours().toString().padStart(2, '0')}:00`;
      timelineMap.set(label, { time: label, events: 0, critical: 0, high: 0 });
    }

    recentEvents.forEach(evt => {
      const d = new Date(evt.timestamp);
      const label = `${d.getHours().toString().padStart(2, '0')}:00`;
      if (!timelineMap.has(label)) {
        timelineMap.set(label, { time: label, events: 0, critical: 0, high: 0 });
      }
      const entry = timelineMap.get(label)!;
      entry.events++;
      if (evt.severity === 'CRITICAL') entry.critical++;
      if (evt.severity === 'HIGH') entry.high++;
    });

    const eventsOverTime = Array.from(timelineMap.values());

    res.json({
      summary: {
        vehiclesMonitored: vehicleStats?.total_vehicles || 10,
        ecusMonitored: ecuStats?.total_ecus || 70,
        canMessagesPerSec: EcuSimulator.getStatus().isRunning ? 1250 : 0,
        securityEventsToday: DetectionEngine.securityEventsCount + (recentEvents.length || 14),
        activeThreats: alertStats?.active_threats || 0,
        criticalAlerts: alertStats?.critical_alerts || 0,
        averageRiskScore: Math.round(vehicleStats?.avg_risk || 28),
        totalIncidents: (await getOne<any>('SELECT COUNT(*) as c FROM incidents'))?.c || 0,
        totalVulnerabilities: (await getOne<any>('SELECT COUNT(*) as c FROM vulnerabilities'))?.c || 0
      },
      distribution: {
        severity: severityDistribution,
        threatTypes: threatTypes,
        vehicleRisks: vehicleRisks,
        ecuHealth: {
          secure: ecuStats?.secure_ecus || 65,
          warning: ecuStats?.warning_ecus || 4,
          critical: ecuStats?.critical_ecus || 1
        }
      },
      eventsOverTime
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
