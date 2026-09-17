"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const database_js_1 = require("./database.js");
async function seedDatabase() {
    const existing = await (0, database_js_1.getOne)('SELECT COUNT(*) as count FROM vehicles');
    if (existing && existing.count > 0) {
        console.log('[Database] Seed data already present, skipping.');
        return;
    }
    console.log('[Database] Seeding initial automotive data...');
    const vehicles = [
        { id: 'VEH-001', vin: '1HGCR2F83HA001928', model: 'CyberSedan Alpha', software_version: 'v4.2.1-sec', ecu_count: 7, can_interface: 'vcan0', risk_score: 18, security_status: 'SECURE' },
        { id: 'VEH-002', vin: '3VW2B7AJ9HM291032', model: 'AeroSUV Titanium', software_version: 'v3.8.0', ecu_count: 7, can_interface: 'vcan0', risk_score: 22, security_status: 'SECURE' },
        { id: 'VEH-003', vin: '5NMS23AC4LH492019', model: 'VoltTruck EV-Pro', software_version: 'v5.1.0-rc2', ecu_count: 7, can_interface: 'vcan0', risk_score: 35, security_status: 'MONITORING' },
        { id: 'VEH-004', vin: 'WAUDFAFR1HN019283', model: 'Apex GT Coupe', software_version: 'v4.0.2', ecu_count: 7, can_interface: 'vcan0', risk_score: 12, security_status: 'SECURE' },
        { id: 'VEH-005', vin: 'JN1AZ4EH9KM382910', model: 'Pulse Hybrid Compact', software_version: 'v2.9.4', ecu_count: 7, can_interface: 'vcan0', risk_score: 48, security_status: 'MONITORING' },
        { id: 'VEH-006', vin: '1FTFW1ED4KF938201', model: 'Titan Fleet Hauler', software_version: 'v3.5.0', ecu_count: 7, can_interface: 'vcan0', risk_score: 65, security_status: 'WARNING' },
        { id: 'VEH-007', vin: 'KM8K33A41LU284910', model: 'Nexus Crossover', software_version: 'v4.1.0', ecu_count: 7, can_interface: 'vcan0', risk_score: 15, security_status: 'SECURE' },
        { id: 'VEH-008', vin: 'SALWR2V45KA392019', model: 'Vanguard Luxury', software_version: 'v5.0.1', ecu_count: 7, can_interface: 'vcan0', risk_score: 28, security_status: 'SECURE' },
        { id: 'VEH-009', vin: '2C3CDXBG8KH392011', model: 'Shadow Cruiser', software_version: 'v3.9.1', ecu_count: 7, can_interface: 'vcan0', risk_score: 72, security_status: 'HIGH RISK' },
        { id: 'VEH-010', vin: 'KL4CJ1SB9KB392018', model: 'AeroCoupé Sport', software_version: 'v4.3.0', ecu_count: 7, can_interface: 'vcan0', risk_score: 20, security_status: 'SECURE' }
    ];
    const now = new Date().toISOString();
    for (const v of vehicles) {
        await (0, database_js_1.runQuery)(`INSERT INTO vehicles (id, vin, model, software_version, ecu_count, can_interface, risk_score, security_status, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [v.id, v.vin, v.model, v.software_version, v.ecu_count, v.can_interface, v.risk_score, v.security_status, now]);
        const ecus = [
            { name: 'Engine ECU', type: 'POWERTRAIN', fw: 'ECU-ENG-v2.1', rate: 100 },
            { name: 'Brake ECU', type: 'CHASSIS_SAFETY', fw: 'ECU-BRK-v1.9', rate: 80 },
            { name: 'Transmission ECU', type: 'POWERTRAIN', fw: 'ECU-TRN-v2.0', rate: 50 },
            { name: 'Airbag ECU', type: 'PASSIVE_SAFETY', fw: 'ECU-ABG-v1.4', rate: 20 },
            { name: 'Infotainment ECU', type: 'TELEMATICS', fw: 'ECU-IVI-v4.5', rate: 40 },
            { name: 'ADAS ECU', type: 'AUTONOMOUS', fw: 'ECU-ADS-v3.2', rate: 120 },
            { name: 'Gateway ECU', type: 'GATEWAY_SECURITY', fw: 'ECU-CGW-v5.0', rate: 200 }
        ];
        for (let i = 0; i < ecus.length; i++) {
            const ecu = ecus[i];
            const ecuId = `${v.id}-ECU-0${i + 1}`;
            const secStatus = v.risk_score > 60 && i === 4 ? 'WARNING' : 'SECURE';
            await (0, database_js_1.runQuery)(`INSERT INTO ecus (id, vehicle_id, name, type, status, firmware_version, message_rate, security_status, last_event)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`, [ecuId, v.id, ecu.name, ecu.type, ecu.fw, ecu.rate, secStatus, now]);
        }
    }
    // Seed known vulnerabilities (educational, no exploit code)
    const vulnerabilities = [
        {
            id: 'VULN-2026-001',
            ecu_name: 'Infotainment ECU',
            vehicle_id: 'VEH-001',
            title: 'Unauthenticated Diagnostic Service Access (UDS 0x27)',
            description: 'The Infotainment telematics controller allows security access subfunction requests without proper cryptographic seed-key validation timeout.',
            severity: 'HIGH',
            cvss_score: 7.8,
            status: 'OPEN',
            remediation: 'Deploy HSM-enforced SecOC firmware update ECU-IVI-v4.5.1 with progressive lockout.'
        },
        {
            id: 'VULN-2026-002',
            ecu_name: 'Gateway ECU',
            vehicle_id: 'VEH-002',
            title: 'Missing Arbitration ID Boundary Check on OBD-II Bridge',
            description: 'The Central Gateway accepts external diagnostic arbitration IDs on CAN Bus B without isolating the safety-critical Powertrain CAN Bus A.',
            severity: 'CRITICAL',
            cvss_score: 8.9,
            status: 'INVESTIGATING',
            remediation: 'Implement firewall routing table restricting inter-bus forwarding of 0x7DF-0x7EF IDs.'
        },
        {
            id: 'VULN-2026-003',
            ecu_name: 'ADAS ECU',
            vehicle_id: 'VEH-005',
            title: 'CAN Message Counter Rollover Desynchronization',
            description: 'Radar object tracking frames accept unsynchronized cyclic redundancy checks during burst transmission.',
            severity: 'MEDIUM',
            cvss_score: 5.4,
            status: 'MITIGATED',
            remediation: 'Patch counter validation window to strictly reject out-of-order sequence increments.'
        },
        {
            id: 'VULN-2026-004',
            ecu_name: 'Engine ECU',
            vehicle_id: 'VEH-006',
            title: 'Unsigned Calibration Parameter Flashing',
            description: 'Engine management unit permits runtime re-calibration via unified diagnostic protocol without asymmetric signature verification.',
            severity: 'CRITICAL',
            cvss_score: 9.1,
            status: 'OPEN',
            remediation: 'Mandate RSA-3072 / ECDSA digital signature check in primary bootloader.'
        }
    ];
    for (const vuln of vulnerabilities) {
        await (0, database_js_1.runQuery)(`INSERT INTO vulnerabilities (id, ecu_name, vehicle_id, title, description, severity, cvss_score, status, remediation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [vuln.id, vuln.ecu_name, vuln.vehicle_id, vuln.title, vuln.description, vuln.severity, vuln.cvss_score, vuln.status, vuln.remediation]);
    }
    // Seed sample initial alert and incident
    await (0, database_js_1.runQuery)(`INSERT INTO alerts (id, vehicle_id, ecu_id, threat_type, severity, risk_score, timestamp, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'ALT-1001',
        'VEH-006',
        'VEH-006-ECU-05',
        'Suspicious Diagnostic Activity',
        'HIGH',
        68,
        now,
        'ACTIVE',
        'Frequent UDS TesterPresent (0x3E) and ReadDataByIdentifier requests on Powertrain gateway.'
    ]);
    await (0, database_js_1.runQuery)(`INSERT INTO incidents (id, title, vehicle_id, ecu_id, severity, risk_score, created_time, assigned_analyst, status, timeline_json, notes, resolution)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'INC-2026-01',
        'Anomalous Gateway Frame Injection',
        'VEH-009',
        'VEH-009-ECU-07',
        'HIGH',
        72,
        now,
        'Sarah Chen (SOC Tier-2)',
        'INVESTIGATING',
        JSON.stringify([
            { time: now, event: 'Automated high risk threshold triggered (Risk: 72/100)' },
            { time: now, event: 'Assigned to Sarah Chen for telemetry packet inspection' }
        ]),
        'Investigating potential rogue hardware dongle attached to OBD-II diagnostic port.',
        ''
    ]);
    await (0, database_js_1.runQuery)(`INSERT INTO notifications (id, timestamp, title, message, severity, read)
     VALUES (?, ?, ?, ?, ?, 0)`, ['NOTIF-1', now, 'System Online', 'AutoSOC Detection Engine initialized and monitoring 10 vehicles.', 'LOW']);
    console.log('[Database] Seeding completed.');
}
