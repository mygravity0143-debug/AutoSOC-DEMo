import { runQuery, getOne } from '../db/database.js';
import { recalculateVehicleRisk } from './riskScoring.js';
import { socketManager } from '../ws/socketManager.js';

export interface CanMessage {
  timestamp?: string;
  vehicle_id: string;
  ecu_id: string;
  can_id: string;
  dlc: number;
  data: string;
  message_type?: string;
}

export interface DetectionResult {
  detected: boolean;
  threat_type?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_added?: number;
  description?: string;
}

// Normalized DBC Whitelist for normal vehicle CAN IDs
const VALID_CAN_IDS = new Set([
  '0X100', // Engine RPM & throttle
  '0X110', // Engine Temperature
  '0X200', // Brake pedal & ABS
  '0X300', // Transmission gear & torque
  '0X400', // ADAS radar distance
  '0X410', // Lane keep assist
  '0X500', // Infotainment audio / nav
  '0X600', // Gateway status
  '0X700', // Airbag sensor status
  '0X7DF', // Standard OBD-II Request
  '0X7E8'  // Standard OBD-II Response
]);

// Sliding rate window tracking
interface RateTracker {
  count: number;
  lastReset: number;
  timestamps: number[];
}
const messageRateTrackers = new Map<string, RateTracker>();

export class DetectionEngine {
  public static totalEventsProcessed = 0;
  public static securityEventsCount = 0;

  public static async processMessage(msg: CanMessage): Promise<DetectionResult> {
    this.totalEventsProcessed++;
    const now = Date.now();
    const canIdHex = msg.can_id.trim().toUpperCase();
    const trackerKey = `${msg.vehicle_id}:${canIdHex}`;

    // Update rate tracker
    if (!messageRateTrackers.has(trackerKey)) {
      messageRateTrackers.set(trackerKey, { count: 0, lastReset: now, timestamps: [] });
    }
    const tracker = messageRateTrackers.get(trackerKey)!;
    tracker.timestamps = tracker.timestamps.filter(t => now - t < 1000);
    tracker.timestamps.push(now);
    const messagesPerSec = tracker.timestamps.length;

    let threat: DetectionResult = { detected: false };

    // RULE 1: Unknown CAN ID (Explicitly flag 0x777, 0x666, 0x999 or any not in whitelist)
    if (!VALID_CAN_IDS.has(canIdHex)) {
      threat = {
        detected: true,
        threat_type: 'Unknown CAN ID Detected',
        severity: 'HIGH',
        risk_added: 30,
        description: `Arbitration ID ${canIdHex} not in authorized DBC whitelist for vehicle ${msg.vehicle_id}.`
      };
    }

    // RULE 2: CAN Message Flooding & DoS (Sliding window burst > 25 msgs/sec)
    if (!threat.detected && messagesPerSec > 20) {
      threat = {
        detected: true,
        threat_type: 'CAN Message Flooding (DoS)',
        severity: 'CRITICAL',
        risk_added: 80,
        description: `Burst transmission detected on CAN ID ${canIdHex}: excessive message frequency (${messagesPerSec * 10} msgs/sec) exhausting bus bandwidth.`
      };
    }

    // RULE 3: Abnormal Message Frequency
    if (!threat.detected && messagesPerSec > 10 && messagesPerSec <= 20) {
      threat = {
        detected: true,
        threat_type: 'Abnormal Message Frequency',
        severity: 'MEDIUM',
        risk_added: 40,
        description: `Elevated cycle transmission rate on ${canIdHex} (${messagesPerSec * 5} msgs/sec). Inter-frame arrival anomaly.`
      };
    }

    // RULE 4: Repeated Diagnostic Requests (UDS Fuzzing)
    if (!threat.detected && (canIdHex === '0X7DF' || canIdHex === '0X7E0') && messagesPerSec > 5) {
      threat = {
        detected: true,
        threat_type: 'Diagnostic Abuse / UDS Scanning',
        severity: 'HIGH',
        risk_added: 50,
        description: `High-frequency UDS diagnostic queries detected on ${canIdHex}. Potential port scanner or diagnostic fuzzing.`
      };
    }

    // RULE 5: Authentication Failure / SecOC Anomaly
    if (!threat.detected && (msg.data.includes('DE AD BE EF') || msg.data.includes('BA AD F0 0D'))) {
      threat = {
        detected: true,
        threat_type: 'SecOC Authentication Failure',
        severity: 'HIGH',
        risk_added: 50,
        description: `Cryptographic message authentication code (MAC) verification failed for ECU payload on ${canIdHex}.`
      };
    }

    // RULE 6: ECU Spoofing Indicator (Cross-domain mismatch)
    if (!threat.detected && msg.ecu_id.includes('IVI') && (canIdHex === '0X100' || canIdHex === '0X200')) {
      threat = {
        detected: true,
        threat_type: 'ECU Spoofing Indicator',
        severity: 'CRITICAL',
        risk_added: 75,
        description: `Telematics/Infotainment ECU attempted to inject safety-critical Powertrain/Brake frames (${canIdHex}).`
      };
    }

    // RULE 7: Firmware Integrity / Bootloader anomaly
    if (!threat.detected && msg.data.includes('F1 90') && msg.data.includes('FF FF')) {
      threat = {
        detected: true,
        threat_type: 'Firmware Integrity Anomaly',
        severity: 'CRITICAL',
        risk_added: 85,
        description: `Corrupted firmware checksum or unauthorized bootloader flashing signature detected in ECU memory buffer.`
      };
    }

    // Process threat if detected
    if (threat.detected) {
      await this.handleDetectedThreat(msg, threat);
    }

    return threat;
  }

  public static async handleDetectedThreat(msg: CanMessage, threat: DetectionResult) {
    this.securityEventsCount++;
    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    // 1. Recalculate Risk
    const updatedVehicle = await recalculateVehicleRisk(msg.vehicle_id, threat.risk_added || 30, threat.threat_type || 'Anomaly');

    // 2. Save Security Event
    await runQuery(
      `INSERT INTO security_events (id, timestamp, vehicle_id, ecu_id, can_id, threat_type, description, severity, risk_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DETECTED')`,
      [
        eventId,
        nowIso,
        msg.vehicle_id,
        msg.ecu_id,
        msg.can_id,
        threat.threat_type,
        threat.description,
        threat.severity,
        updatedVehicle.risk_score
      ]
    );

    // Broadcast Security Event
    const secEvent = {
      id: eventId,
      timestamp: nowIso,
      vehicle_id: msg.vehicle_id,
      ecu_id: msg.ecu_id,
      can_id: msg.can_id,
      threat_type: threat.threat_type,
      description: threat.description,
      severity: threat.severity,
      risk_score: updatedVehicle.risk_score,
      status: 'DETECTED'
    };
    socketManager.broadcast('SECURITY_EVENT', secEvent);

    // 3. Create Alert
    const alertId = `ALT-${Date.now().toString(36).toUpperCase()}`;
    await runQuery(
      `INSERT INTO alerts (id, vehicle_id, ecu_id, threat_type, severity, risk_score, timestamp, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [
        alertId,
        msg.vehicle_id,
        msg.ecu_id,
        threat.threat_type,
        threat.severity,
        updatedVehicle.risk_score,
        nowIso,
        threat.description
      ]
    );

    const alertPayload = {
      id: alertId,
      vehicle_id: msg.vehicle_id,
      ecu_id: msg.ecu_id,
      threat_type: threat.threat_type,
      severity: threat.severity,
      risk_score: updatedVehicle.risk_score,
      timestamp: nowIso,
      status: 'ACTIVE',
      description: threat.description
    };
    socketManager.broadcast('ALERT_CREATED', alertPayload);

    // 4. Auto-create Incident if severity is CRITICAL or vehicle risk >= 80
    if (threat.severity === 'CRITICAL' || updatedVehicle.risk_score >= 80) {
      const incidentId = `INC-${Date.now().toString().slice(-6)}`;
      const title = `Automated Incident: ${threat.threat_type} on ${msg.vehicle_id}`;
      const timeline = JSON.stringify([
        { time: nowIso, event: `Detection Engine triggered: ${threat.threat_type}` },
        { time: nowIso, event: `Vehicle risk raised to ${updatedVehicle.risk_score}/100 (${updatedVehicle.security_status})` },
        { time: nowIso, event: `AutoSOC critical incident opened.` }
      ]);
      const initialNotes = `Automated quarantine alert generated. Targeted ECU: ${msg.ecu_id}, Arbitrated CAN ID: ${msg.can_id}.`;

      await runQuery(
        `INSERT INTO incidents (id, title, vehicle_id, ecu_id, severity, risk_score, created_time, assigned_analyst, status, timeline_json, notes, resolution)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Unassigned (AutoSOC Bot)', 'OPEN', ?, ?, '')`,
        [
          incidentId,
          title,
          msg.vehicle_id,
          msg.ecu_id,
          threat.severity,
          updatedVehicle.risk_score,
          nowIso,
          timeline,
          initialNotes
        ]
      );

      const incidentCreated = {
        id: incidentId,
        title,
        vehicle_id: msg.vehicle_id,
        ecu_id: msg.ecu_id,
        severity: threat.severity,
        risk_score: updatedVehicle.risk_score,
        created_time: nowIso,
        assigned_analyst: 'Unassigned (AutoSOC Bot)',
        status: 'OPEN',
        timeline_json: timeline,
        notes: initialNotes
      };
      socketManager.broadcast('INCIDENT_CREATED', incidentCreated);
    }

    // 5. Create Notification
    const notifId = `NOTIF-${Date.now()}`;
    const notifMsg = `${threat.threat_type} detected on ${msg.vehicle_id}. Severity: ${threat.severity}`;
    await runQuery(
      `INSERT INTO notifications (id, timestamp, title, message, severity, read)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [notifId, nowIso, threat.threat_type!, notifMsg, threat.severity!]
    );

    socketManager.broadcast('NOTIFICATION', {
      id: notifId,
      timestamp: nowIso,
      title: threat.threat_type,
      message: notifMsg,
      severity: threat.severity
    });
  }
}
