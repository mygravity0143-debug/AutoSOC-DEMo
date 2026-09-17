import React, { useState } from 'react';
import { useSoc } from '../context/SocContext.js';
import { Settings, RefreshCw, Sliders, ShieldCheck, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { refreshAll } = useSoc();
  const [canRate, setCanRate] = useState(5);
  const [rateSaved, setRateSaved] = useState(false);

  const handleUpdateRate = async () => {
    try {
      await fetch('/api/simulate/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: canRate })
      });
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          AutoSOC System & Telemetry Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust simulation rates, detection thresholds, and local node parameters
        </p>
      </div>

      {/* Simulation Parameters */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" /> Virtual CAN Generator Parameters
        </h3>

        <div className="space-y-3 max-w-md">
          <div>
            <label className="text-xs text-slate-300 block mb-1">
              Normal Background Traffic Rate: <strong className="text-cyan-400">{canRate} frames/sec</strong>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={canRate}
              onChange={(e) => setCanRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <button
            onClick={handleUpdateRate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
          >
            {rateSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            <span>{rateSaved ? 'Updated!' : 'Apply Generator Rate'}</span>
          </button>
        </div>
      </div>

      {/* Detection Rules Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Detection Rules (10 Enforced)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
          {[
            'Rule 1: Unknown CAN ID Verification',
            'Rule 2: CAN Message Flooding & DoS',
            'Rule 3: Abnormal Transmission Frequency',
            'Rule 4: Repeated Diagnostic Requests (UDS Fuzzing)',
            'Rule 5: Authentication Failures (SecOC MAC Anomaly)',
            'Rule 6: Suspicious ECU Communication',
            'Rule 7: ECU Spoofing Indicators',
            'Rule 8: Firmware Integrity / Bootloader Flash Anomaly',
            'Rule 9: Gateway Boundary Check Anomaly',
            'Rule 10: Dominant Bit Denial-of-Service Patterns'
          ].map((rule, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
