"use strict";
// Risk scoring service — tracks vehicle risk scores in memory with persistence sync
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleRisk = getVehicleRisk;
exports.updateVehicleRisk = updateVehicleRisk;
exports.getRiskLevel = getRiskLevel;
exports.getSecurityStatus = getSecurityStatus;
exports.getAllVehicleRisks = getAllVehicleRisks;
exports.setVehicleRisk = setVehicleRisk;
exports.decayAllRisks = decayAllRisks;
const vehicleRisks = new Map([
    ['VEH-001', 15],
    ['VEH-002', 28],
    ['VEH-003', 42],
    ['VEH-004', 10],
    ['VEH-005', 55],
    ['VEH-006', 22],
    ['VEH-007', 73],
    ['VEH-008', 18],
    ['VEH-009', 38],
    ['VEH-010', 65],
]);
/**
 * Returns the current risk score for a vehicle.
 * Returns 0 if the vehicle is not tracked.
 */
function getVehicleRisk(vehicleId) {
    return vehicleRisks.get(vehicleId) ?? 0;
}
/**
 * Applies a delta to a vehicle's risk score and clamps the result to [0, 100].
 * Returns the updated score.
 */
function updateVehicleRisk(vehicleId, delta) {
    const current = vehicleRisks.get(vehicleId) ?? 0;
    const updated = Math.max(0, Math.min(100, current + delta));
    vehicleRisks.set(vehicleId, updated);
    return updated;
}
/**
 * Maps a numeric risk score to a categorical risk level.
 */
function getRiskLevel(score) {
    if (score >= 75)
        return 'CRITICAL';
    if (score >= 50)
        return 'HIGH';
    if (score >= 25)
        return 'MEDIUM';
    return 'LOW';
}
/**
 * Maps a numeric risk score to a human-readable security status string.
 */
function getSecurityStatus(score) {
    if (score >= 75)
        return 'CRITICAL';
    if (score >= 50)
        return 'WARNING';
    if (score >= 25)
        return 'MONITOR';
    return 'SECURE';
}
/**
 * Returns the full map of all tracked vehicle risk scores.
 * The returned map is a snapshot — modifying it does not affect internal state.
 */
function getAllVehicleRisks() {
    return new Map(vehicleRisks);
}
/**
 * Sets a vehicle risk score directly (used for initialisation from DB).
 */
function setVehicleRisk(vehicleId, score) {
    vehicleRisks.set(vehicleId, Math.max(0, Math.min(100, score)));
}
/**
 * Decays all vehicle risk scores slightly towards zero over time.
 * Call periodically (e.g. every 60s) to model risk reduction when no new events occur.
 * Decay rate: 1 point per call, minimum 0.
 */
function decayAllRisks(decayAmount = 1) {
    for (const [id, score] of vehicleRisks.entries()) {
        vehicleRisks.set(id, Math.max(0, score - decayAmount));
    }
}
