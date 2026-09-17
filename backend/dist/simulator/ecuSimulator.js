"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcuSimulator = void 0;
const socketManager_js_1 = require("../ws/socketManager.js");
const detectionEngine_js_1 = require("../engine/detectionEngine.js");
const database_js_1 = require("../db/database.js");
class EcuSimulator {
    static isRunning = false;
    static intervalId = null;
    static messageRate = 5; // messages per sec for normal traffic
    static vehicles = ['VEH-001', 'VEH-002', 'VEH-003', 'VEH-004', 'VEH-005'];
    static start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log('[ECU Simulator] Traffic simulation started.');
        this.intervalId = setInterval(async () => {
            if (!this.isRunning)
                return;
            try {
                const frame = this.generateNormalFrame();
                await this.emitFrame(frame);
            }
            catch (err) {
                console.error('[ECU Simulator] Error emitting frame:', err);
            }
        }, 1000 / this.messageRate);
    }
    static stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('[ECU Simulator] Traffic simulation paused/stopped.');
    }
    static getStatus() {
        return {
            isRunning: this.isRunning,
            messageRate: this.messageRate
        };
    }
    static setRate(rate) {
        this.messageRate = Math.max(1, Math.min(100, rate));
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    static generateNormalFrame(targetVehicle) {
        const vId = targetVehicle || this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
        const templates = [
            {
                ecu_id: `${vId}-ECU-01`,
                can_id: '0x100',
                type: 'ENGINE_RPM',
                genData: () => {
                    const rpm = 800 + Math.floor(Math.random() * 3200);
                    const hexRpm = rpm.toString(16).padStart(4, '0').toUpperCase();
                    return `${hexRpm.slice(0, 2)} ${hexRpm.slice(2, 4)} 04 6A 00 12 40 88`;
                }
            },
            {
                ecu_id: `${vId}-ECU-02`,
                can_id: '0x200',
                type: 'BRAKE_STATUS',
                genData: () => {
                    const press = Math.floor(Math.random() * 80);
                    return `01 ${press.toString(16).padStart(2, '0').toUpperCase()} AA 00 10 20 00 00`;
                }
            },
            {
                ecu_id: `${vId}-ECU-03`,
                can_id: '0x300',
                type: 'GEAR_STATUS',
                genData: () => `04 0D A1 00 ${Math.floor(Math.random() * 6).toString(16).padStart(2, '0')} 00 00 00`
            },
            {
                ecu_id: `${vId}-ECU-06`,
                can_id: '0x400',
                type: 'ADAS_RADAR',
                genData: () => {
                    const dist = Math.floor(20 + Math.random() * 120);
                    return `0F ${dist.toString(16).padStart(2, '0').toUpperCase()} 14 28 01 02 55 AA`;
                }
            },
            {
                ecu_id: `${vId}-ECU-05`,
                can_id: '0x500',
                type: 'IVI_TELEMETRY',
                genData: () => `B0 22 18 44 99 00 01 FE`
            }
        ];
        const pick = templates[Math.floor(Math.random() * templates.length)];
        return {
            timestamp: new Date().toISOString(),
            vehicle_id: vId,
            ecu_id: pick.ecu_id,
            can_id: pick.can_id,
            dlc: 8,
            data: pick.genData(),
            message_type: pick.type
        };
    }
    static async emitFrame(frame, customStatus = 'NORMAL') {
        frame.timestamp = frame.timestamp || new Date().toISOString();
        // Persist a sample of frames to can_events to avoid DB bloat (keep last 500)
        await (0, database_js_1.runQuery)(`INSERT INTO can_events (timestamp, vehicle_id, ecu_id, can_id, dlc, data, message_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            frame.timestamp,
            frame.vehicle_id,
            frame.ecu_id,
            frame.can_id,
            frame.dlc,
            frame.data,
            frame.message_type || 'NORMAL',
            customStatus
        ]);
        // Keep table trimmed to last 500 records
        await (0, database_js_1.runQuery)(`DELETE FROM can_events WHERE id NOT IN (SELECT id FROM can_events ORDER BY id DESC LIMIT 500)`);
        // Broadcast frame to live CAN monitors
        socketManager_js_1.socketManager.broadcast('CAN_FRAME', {
            ...frame,
            status: customStatus
        });
        // Run through detection engine
        await detectionEngine_js_1.DetectionEngine.processMessage(frame);
    }
    // Attack Injections
    static async injectUnknownCanId(vehicleId = 'VEH-001') {
        const unknownFrame = {
            timestamp: new Date().toISOString(),
            vehicle_id: vehicleId,
            ecu_id: `${vehicleId}-ECU-UNKNOWN`,
            can_id: '0x777',
            dlc: 8,
            data: 'FF FF FF FF DE AD BE EF',
            message_type: 'ROGUE_INJECTION'
        };
        await this.emitFrame(unknownFrame, 'SUSPICIOUS');
        return unknownFrame;
    }
    static async injectCanFlood(vehicleId = 'VEH-002') {
        // Inject 35 rapid frames within 300ms to trigger rate sliding window
        const results = [];
        for (let i = 0; i < 30; i++) {
            const floodFrame = {
                timestamp: new Date().toISOString(),
                vehicle_id: vehicleId,
                ecu_id: `${vehicleId}-ECU-01`,
                can_id: '0x100',
                dlc: 8,
                data: `00 00 00 00 00 00 00 ${i.toString(16).padStart(2, '0')}`,
                message_type: 'BUS_FLOOD'
            };
            await this.emitFrame(floodFrame, 'FLOOD');
            results.push(floodFrame);
        }
        return results;
    }
    static async injectAbnormalRate(vehicleId = 'VEH-003') {
        for (let i = 0; i < 15; i++) {
            const frame = {
                timestamp: new Date().toISOString(),
                vehicle_id: vehicleId,
                ecu_id: `${vehicleId}-ECU-02`,
                can_id: '0x200',
                dlc: 8,
                data: `FF 88 44 22 11 00 99 ${i.toString(16).padStart(2, '0')}`,
                message_type: 'BURST_CYCLE'
            };
            await this.emitFrame(frame, 'ANOMALOUS');
        }
    }
    static async injectAuthFailure(vehicleId = 'VEH-004') {
        const frame = {
            timestamp: new Date().toISOString(),
            vehicle_id: vehicleId,
            ecu_id: `${vehicleId}-ECU-05`,
            can_id: '0x500',
            dlc: 8,
            data: '02 3E 80 DE AD BE EF 00',
            message_type: 'SECOC_FAIL'
        };
        await this.emitFrame(frame, 'AUTH_VIOLATION');
        return frame;
    }
    static async injectDiagnosticAbuse(vehicleId = 'VEH-006') {
        for (let i = 0; i < 12; i++) {
            const frame = {
                timestamp: new Date().toISOString(),
                vehicle_id: vehicleId,
                ecu_id: `${vehicleId}-ECU-07`,
                can_id: '0x7DF',
                dlc: 8,
                data: `02 27 01 ${i.toString(16).padStart(2, '0')} 00 00 00 00`,
                message_type: 'UDS_SCAN'
            };
            await this.emitFrame(frame, 'DIAG_ABUSE');
        }
    }
    static async injectEcuAnomaly(vehicleId = 'VEH-001') {
        const frame = {
            timestamp: new Date().toISOString(),
            vehicle_id: vehicleId,
            ecu_id: `${vehicleId}-ECU-05-IVI`, // Infotainment attempting to write to Powertrain RPM
            can_id: '0x100',
            dlc: 8,
            data: '00 FF 11 22 33 44 55 66',
            message_type: 'SPOOF_CROSS_DOMAIN'
        };
        await this.emitFrame(frame, 'SPOOFED');
        return frame;
    }
    static async injectFirmwareAnomaly(vehicleId = 'VEH-005') {
        const frame = {
            timestamp: new Date().toISOString(),
            vehicle_id: vehicleId,
            ecu_id: `${vehicleId}-ECU-01`,
            can_id: '0x110',
            dlc: 8,
            data: 'F1 90 FF FF CA FE BA BE',
            message_type: 'BOOTLOADER_TAMPER'
        };
        await this.emitFrame(frame, 'INTEGRITY_FAIL');
        return frame;
    }
}
exports.EcuSimulator = EcuSimulator;
