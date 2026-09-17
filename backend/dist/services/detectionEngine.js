"use strict";
// Detection Engine - AutoSOC Automotive Cybersecurity Platform
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCANMessage = analyzeCANMessage;
exports.processSimulationEvent = processSimulationEvent;
// Known safe CAN IDs (hex)
const KNOWN_SAFE_CAN_IDS = new Set([
    '0x100', '0x101', '0x102',
    '0x110', '0x111', '0x120', '0x121',
    '0x200', '0x201',
    '0x300', '0x301',
    '0x400', '0x401',
    '0x500', '0x501',
    '0x150', '0x160', '0x170',
    '0x210', '0x220',
    '0x310', '0x320',
]);
// Message frequency tracking per vehicle+can_id
const messageFrequency = new Map();
const diagnosticRequests = new Map();
const floodDetection = new Map();
function trackFrequency(key, windowMs = 10000) {
    const now = Date.now();
    const entry = messageFrequency.get(key) ?? { count: 0, windowStart: now };
    if (now - entry.windowStart > windowMs) {
        entry.count = 1;
        entry.windowStart = now;
    }
    else {
        entry.count++;
    }
    messageFrequency.set(key, entry);
    return entry.count;
}
function trackFlood(vehicleId) {
    const now = Date.now();
    const timestamps = floodDetection.get(vehicleId) ?? [];
    // Keep only messages in last 1 second
    const recent = timestamps.filter(t => now - t < 1000);
    recent.push(now);
    floodDetection.set(vehicleId, recent);
    return recent.length;
}
function trackDiagnosticRequests(vehicleId) {
    const now = Date.now();
    const timestamps = diagnosticRequests.get(vehicleId) ?? [];
    const recent = timestamps.filter(t => now - t < 60000); // within 1 min
    recent.push(now);
    diagnosticRequests.set(vehicleId, recent);
    return recent.length;
}
function analyzeCANMessage(event) {
    const canIdLower = event.can_id.toLowerCase();
    const canIdNorm = canIdLower.startsWith('0x') ? canIdLower : `0x${canIdLower}`;
    const vehicleId = event.vehicle_id;
    // 1. Unknown CAN ID
    if (!KNOWN_SAFE_CAN_IDS.has(canIdNorm)) {
        return {
            detected: true,
            threatType: 'UNKNOWN_CAN_ID',
            severity: 'HIGH',
            riskDelta: 30,
            description: `Unknown CAN ID ${event.can_id} detected from ECU ${event.ecu_id}. This CAN ID is not in the known-safe list and may indicate spoofing or unauthorized ECU activity.`,
            canId: event.can_id,
        };
    }
    // 2. CAN Flood detection (>50 msgs/sec from same vehicle)
    const floodCount = trackFlood(vehicleId);
    if (floodCount > 50) {
        return {
            detected: true,
            threatType: 'CAN_FLOOD',
            severity: 'CRITICAL',
            riskDelta: 80,
            description: `CAN flooding detected on vehicle ${vehicleId}: ${floodCount} messages/second. Possible denial-of-service attack targeting CAN bus.`,
            canId: event.can_id,
        };
    }
    // 3. Diagnostic request abuse (OBD-II 0x7DF)
    if (canIdNorm === '0x7df' || event.message_type === 'DIAGNOSTIC_REQUEST') {
        const diagCount = trackDiagnosticRequests(vehicleId);
        if (diagCount > 5) {
            return {
                detected: true,
                threatType: 'DIAGNOSTIC_ABUSE',
                severity: 'HIGH',
                riskDelta: 50,
                description: `Repeated diagnostic requests detected on vehicle ${vehicleId}: ${diagCount} OBD-II requests in 1 minute. May indicate unauthorized diagnostic access or reconnaissance.`,
                canId: event.can_id,
            };
        }
    }
    // 4. All-FF data pattern (suspicious payload)
    if (event.data && event.data.replace(/\s/g, '').toUpperCase() === 'FFFFFFFFFFFFFFFF') {
        return {
            detected: true,
            threatType: 'SUSPICIOUS_ECU_COMM',
            severity: 'MEDIUM',
            riskDelta: 25,
            description: `Suspicious all-FF data payload detected on CAN ID ${event.can_id} from ECU ${event.ecu_id}. Anomalous data pattern may indicate ECU fault or malicious injection.`,
            canId: event.can_id,
        };
    }
    // 5. Abnormal message frequency for a specific ECU+CAN combo
    const freqKey = `${vehicleId}:${canIdNorm}`;
    const freq = trackFrequency(freqKey, 5000);
    if (freq > 100) {
        return {
            detected: true,
            threatType: 'ABNORMAL_FREQUENCY',
            severity: 'HIGH',
            riskDelta: 40,
            description: `Abnormal CAN message frequency: ${freq} messages in 5 seconds for CAN ID ${event.can_id} on vehicle ${vehicleId}. Expected maximum is ~20.`,
            canId: event.can_id,
        };
    }
    return null;
}
function processSimulationEvent(type, vehicleId, ecuId) {
    const templates = {
        'unknown-can-id': {
            detected: true,
            threatType: 'UNKNOWN_CAN_ID',
            severity: 'HIGH',
            riskDelta: 30,
            description: `[SIMULATED] Unknown CAN ID 0x${(Math.floor(Math.random() * 0xFFF) + 0x600).toString(16).toUpperCase()} detected from ECU ${ecuId} on vehicle ${vehicleId}. CAN ID not in authorized list.`,
            canId: `0x${(Math.floor(Math.random() * 0xFFF) + 0x600).toString(16).toUpperCase()}`,
        },
        'can-flood': {
            detected: true,
            threatType: 'CAN_FLOOD',
            severity: 'CRITICAL',
            riskDelta: 80,
            description: `[SIMULATED] CAN bus flooding attack detected on vehicle ${vehicleId}: 2,847 messages/second. Bus utilization at 98%. Possible denial-of-service attack.`,
            canId: '0x100',
        },
        'auth-failure': {
            detected: true,
            threatType: 'AUTH_FAILURE',
            severity: 'CRITICAL',
            riskDelta: 50,
            description: `[SIMULATED] Authentication failure detected on ECU ${ecuId} (vehicle ${vehicleId}). Invalid security access attempt. 3 consecutive failures recorded.`,
            canId: '0x7DF',
        },
        'ecu-anomaly': {
            detected: true,
            threatType: 'ECU_SPOOFING',
            severity: 'CRITICAL',
            riskDelta: 70,
            description: `[SIMULATED] ECU spoofing indicators detected: ECU ${ecuId} on vehicle ${vehicleId} is transmitting on CAN IDs that don't match its assigned profile. Possible ECU impersonation.`,
            canId: '0x100',
        },
        'abnormal-rate': {
            detected: true,
            threatType: 'ABNORMAL_FREQUENCY',
            severity: 'HIGH',
            riskDelta: 40,
            description: `[SIMULATED] Abnormal CAN message frequency from ECU ${ecuId} on vehicle ${vehicleId}: 847 messages in 5 seconds (expected: ≤20). Possible replay attack or ECU malfunction.`,
            canId: '0x200',
        },
        'diagnostic-abuse': {
            detected: true,
            threatType: 'DIAGNOSTIC_ABUSE',
            severity: 'HIGH',
            riskDelta: 50,
            description: `[SIMULATED] Diagnostic abuse detected on vehicle ${vehicleId}: 47 UDS/OBD-II requests in 60 seconds from ECU ${ecuId}. Unauthorized diagnostic session suspected.`,
            canId: '0x7DF',
        },
        'firmware-anomaly': {
            detected: true,
            threatType: 'FIRMWARE_ANOMALY',
            severity: 'HIGH',
            riskDelta: 60,
            description: `[SIMULATED] Firmware integrity anomaly detected on ECU ${ecuId} (vehicle ${vehicleId}). Checksum mismatch detected. Possible unauthorized firmware modification.`,
            canId: '0x110',
        },
    };
    return templates[type] ?? {
        detected: true,
        threatType: 'UNKNOWN_THREAT',
        severity: 'MEDIUM',
        riskDelta: 20,
        description: `[SIMULATED] Unknown threat event on vehicle ${vehicleId}, ECU ${ecuId}.`,
        canId: '0x000',
    };
}
