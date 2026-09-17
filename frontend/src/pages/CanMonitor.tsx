import React, { useState } from 'react';
import { useSoc } from '../context/SocContext.js';
import { Radio, Play, Pause, Trash2, Filter, ShieldCheck, Download } from 'lucide-react';

export const CanMonitorPage: React.FC = () => {
  const { canFrames, clearCanFrames, isCanPaused, setIsCanPaused } = useSoc();
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [ecuFilter, setEcuFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredFrames = canFrames.filter((f) => {
    const matchesVeh = vehicleFilter === 'ALL' || f.vehicle_id === vehicleFilter;
    const matchesEcu = !ecuFilter || f.ecu_id.toLowerCase().includes(ecuFilter.toLowerCase()) || f.can_id.toLowerCase().includes(ecuFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'NORMAL' ? f.status === 'NORMAL' : f.status !== 'NORMAL');
    return matchesVeh && matchesEcu && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-6 h-6 text-teal-400 animate-pulse" />
            CAN Bus Real-Time Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live physical layer packet inspection across Virtual CAN interface (vcan0)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCanPaused(!isCanPaused)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isCanPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
            }`}
          >
            {isCanPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isCanPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          <button
            onClick={clearCanFrames}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>

      {/* Filter and stats bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Vehicle:</span>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Vehicles</option>
              <option value="VEH-001">VEH-001</option>
              <option value="VEH-002">VEH-002</option>
              <option value="VEH-003">VEH-003</option>
              <option value="VEH-004">VEH-004</option>
              <option value="VEH-005">VEH-005</option>
              <option value="VEH-006">VEH-006</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">CAN ID / ECU:</span>
            <input
              type="text"
              placeholder="e.g. 0x100 or ENGINE"
              value={ecuFilter}
              onChange={(e) => setEcuFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Frame Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Traffic</option>
              <option value="NORMAL">Normal Traffic Only</option>
              <option value="ANOMALOUS">Suspicious / Attack Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            Buffer: <strong className="text-cyan-400">{filteredFrames.length}</strong> / 100 frames
          </div>
          <div>
            Status: <strong className={isCanPaused ? 'text-amber-400' : 'text-emerald-400'}>{isCanPaused ? 'PAUSED' : 'STREAMING'}</strong>
          </div>
        </div>
      </div>

      {/* Frame Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-slate-900/90 uppercase text-[10px] text-slate-400 border-b border-slate-800 sticky top-0 backdrop-blur z-10">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Vehicle</th>
                <th className="px-4 py-2.5">Target ECU</th>
                <th className="px-4 py-2.5">Arbitration ID</th>
                <th className="px-4 py-2.5">DLC</th>
                <th className="px-4 py-2.5">Payload Data (HEX)</th>
                <th className="px-4 py-2.5">Message Type</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredFrames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-sans">
                    No CAN frames matching current filter in stream buffer.
                  </td>
                </tr>
              ) : (
                filteredFrames.map((frame, idx) => {
                  const isSuspicious = frame.status !== 'NORMAL';
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition ${
                        isSuspicious ? 'bg-rose-950/20 text-rose-300 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-2 text-slate-500 text-[11px]">
                        {new Date(frame.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any)}
                      </td>
                      <td className="px-4 py-2 font-bold text-cyan-400">{frame.vehicle_id}</td>
                      <td className="px-4 py-2 text-slate-300">{frame.ecu_id}</td>
                      <td className="px-4 py-2 font-bold text-amber-400">{frame.can_id}</td>
                      <td className="px-4 py-2 text-slate-400">{frame.dlc}</td>
                      <td className="px-4 py-2 tracking-widest text-slate-200">
                        {frame.data}
                      </td>
                      <td className="px-4 py-2 text-indigo-300 text-[11px]">{frame.message_type}</td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuspicious
                              ? 'bg-rose-900/80 text-rose-200 border border-rose-500/40 animate-pulse'
                              : 'bg-slate-800 text-emerald-400 border border-slate-700'
                          }`}
                        >
                          {frame.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
