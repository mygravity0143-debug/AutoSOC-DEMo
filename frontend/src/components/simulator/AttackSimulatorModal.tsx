import React, { useState } from 'react';
import { useSoc } from '../../context/SocContext.js';
import { X, Flame, ShieldAlert, Cpu, AlertTriangle, KeyRound, Wrench, Binary, Radio } from 'lucide-react';

export const AttackSimulatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { triggerAttack } = useSoc();
  const [selectedVehicle, setSelectedVehicle] = useState('VEH-001');
  const [loadingAttack, setLoadingAttack] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const attacks = [
    {
      id: 'unknown-can-id',
      name: 'Unknown CAN ID Injection',
      rule: 'Rule 1: Unknown Arbitration ID',
      desc: 'Injects frame 0x777 with anomalous payload outside authorized DBC whitelist.',
      icon: Radio,
      color: 'border-orange-500/40 text-orange-400 bg-orange-950/20'
    },
    {
      id: 'can-flood',
      name: 'CAN Message Flooding (DoS)',
      rule: 'Rule 2 & 10: Bus Flooding / DoS',
      desc: 'Injects 30 rapid CAN frames within 300ms causing high bus load and packet collisions.',
      icon: Flame,
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/20'
    },
    {
      id: 'abnormal-rate',
      name: 'Abnormal Message Rate',
      rule: 'Rule 3: Cycle Rate Anomaly',
      desc: 'Injects periodic bursts deviating from normal ECU transmission intervals.',
      icon: AlertTriangle,
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20'
    },
    {
      id: 'auth-failure',
      name: 'SecOC Authentication Failure',
      rule: 'Rule 5: Cryptographic MAC Anomaly',
      desc: 'Sends telematics payload containing invalid Freshness Value and corrupt SecOC MAC.',
      icon: KeyRound,
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/20'
    },
    {
      id: 'diagnostic-abuse',
      name: 'UDS Diagnostic Abuse / Fuzzing',
      rule: 'Rule 4: Diagnostic Service Exploitation',
      desc: 'High-frequency 0x7DF / 0x7E0 UDS requests attempting brute-force SecurityAccess (0x27).',
      icon: Wrench,
      color: 'border-yellow-500/40 text-yellow-400 bg-yellow-950/20'
    },
    {
      id: 'ecu-anomaly',
      name: 'ECU Cross-Domain Spoofing',
      rule: 'Rule 6 & 7: Spoofing & Domain Violation',
      desc: 'Infotainment telematics controller attempts to inject safety-critical Powertrain RPM commands.',
      icon: Cpu,
      color: 'border-red-500/40 text-red-400 bg-red-950/20'
    },
    {
      id: 'firmware-integrity',
      name: 'Firmware Integrity Tampering',
      rule: 'Rule 8: Memory & Bootloader Tampering',
      desc: 'Simulates unauthorized flash memory bootloader rewrite signature (F1 90 FF FF).',
      icon: Binary,
      color: 'border-rose-600/40 text-rose-500 bg-rose-950/30'
    }
  ];

  const handleRun = async (attackId: string) => {
    setLoadingAttack(attackId);
    setLastFeedback(null);
    try {
      const res = await triggerAttack(attackId, selectedVehicle);
      setLastFeedback(`[SUCCESS] Triggered ${attackId} on ${selectedVehicle}. Flow: Engine Detected -> Risk Calculated -> Alert & Incident Created -> Live Broadcast.`);
    } catch (e: any) {
      setLastFeedback(`[ERROR] Failed to run simulation: ${e.message}`);
    } finally {
      setLoadingAttack(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Cybersecurity Attack & Threat Simulator</h2>
              <p className="text-xs text-slate-400">Simulate controlled automotive cyberattacks against selected ECUs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Selection & Feedback Bar */}
        <div className="px-6 py-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">Target Vehicle:</span>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="VEH-001">VEH-001 (CyberSedan Alpha)</option>
              <option value="VEH-002">VEH-002 (AeroSUV Titanium)</option>
              <option value="VEH-003">VEH-003 (VoltTruck EV-Pro)</option>
              <option value="VEH-004">VEH-004 (Apex GT Coupe)</option>
              <option value="VEH-005">VEH-005 (Pulse Hybrid)</option>
              <option value="VEH-006">VEH-006 (Titan Hauler)</option>
            </select>
          </div>

          <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-md">
            Safe Sandbox: Educational Vehicle Simulation Only
          </div>
        </div>

        {lastFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            {lastFeedback}
          </div>
        )}

        {/* Attacks List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {attacks.map((atk) => {
            const Icon = atk.icon;
            const isRunning = loadingAttack === atk.id;
            return (
              <div
                key={atk.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4 transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg border ${atk.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-200">{atk.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {atk.rule}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{atk.desc}</p>
                  </div>
                </div>

                <button
                  disabled={isRunning}
                  onClick={() => handleRun(atk.id)}
                  className="shrink-0 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-md shadow-rose-950 disabled:opacity-50 transition"
                >
                  {isRunning ? 'Injecting...' : 'Simulate'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close Deck
          </button>
        </div>
      </div>
    </div>
  );
};
