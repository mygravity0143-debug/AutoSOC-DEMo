"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateVehicleRisk = recalculateVehicleRisk;
exports.startRiskDecayService = startRiskDecayService;
const database_js_1 = require("../db/database.js");
const socketManager_js_1 = require("../ws/socketManager.js");
async function recalculateVehicleRisk(vehicleId, addedRisk, reason) {
    const currentVehicle = await (0, database_js_1.getOne)('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (!currentVehicle) {
        throw new Error(`Vehicle not found: ${vehicleId}`);
    }
    // Calculate new score clamped 0-100
    let newScore = Math.min(100, Math.max(0, currentVehicle.risk_score + addedRisk));
    // Determine status
    let newStatus = 'SECURE';
    if (newScore >= 80)
        newStatus = 'CRITICAL';
    else if (newScore >= 60)
        newStatus = 'HIGH RISK';
    else if (newScore >= 30)
        newStatus = 'MONITORING';
    const now = new Date().toISOString();
    await (0, database_js_1.runQuery)(`UPDATE vehicles SET risk_score = ?, security_status = ?, last_seen = ? WHERE id = ?`, [newScore, newStatus, now, vehicleId]);
    const updatedVehicle = {
        ...currentVehicle,
        risk_score: newScore,
        security_status: newStatus,
        last_seen: now
    };
    // Broadcast update
    socketManager_js_1.socketManager.broadcast('VEHICLE_RISK_UPDATED', {
        vehicleId,
        risk_score: newScore,
        security_status: newStatus,
        reason
    });
    return updatedVehicle;
}
// Background risk decay simulator to return vehicles to normal state gradually
function startRiskDecayService() {
    setInterval(async () => {
        try {
            const highRiskVehicles = await (0, database_js_1.getAll)('SELECT * FROM vehicles WHERE risk_score > 20');
            for (const v of highRiskVehicles) {
                // Natural gradual decay of 2 points per interval towards baseline 15
                const decayedScore = Math.max(15, v.risk_score - 2);
                let status = 'SECURE';
                if (decayedScore >= 80)
                    status = 'CRITICAL';
                else if (decayedScore >= 60)
                    status = 'HIGH RISK';
                else if (decayedScore >= 30)
                    status = 'MONITORING';
                if (decayedScore !== v.risk_score) {
                    await (0, database_js_1.runQuery)('UPDATE vehicles SET risk_score = ?, security_status = ? WHERE id = ?', [decayedScore, status, v.id]);
                    socketManager_js_1.socketManager.broadcast('VEHICLE_RISK_UPDATED', {
                        vehicleId: v.id,
                        risk_score: decayedScore,
                        security_status: status,
                        reason: 'Risk decay'
                    });
                }
            }
        }
        catch (err) {
            // Quiet decay errors
        }
    }, 20000); // every 20s
}
