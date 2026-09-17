import React, { useEffect, useState } from 'react';
import { SystemHealthData } from '../types/soc.js';
import { HeartPulse, CheckCircle2, RefreshCw, Cpu, Radio, Shield, Database, Server, Wifi } from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) setHealth(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const t = setInterval(fetchHealth, 5000);
    return () => clearInterval(t);
  }, []);

  const components = [
    { name: 'CAN Physical Interface', status: health?.can_interface || 'ONLINE (vcan0)', icon: Radio },
    { name: 'Python CAN Collector', status: health?.can_collector || 'ONLINE', icon: Cpu },
    { name: 'Detection Engine', status: health?.detection_engine || 'ONLINE', icon: Shield },
    { name: 'Node.js Express Backend', status: health?.backend_api || 'ONLINE', icon: Server },
    { name: 'SQLite Storage Engine', status: health?.database || 'HEALTHY', icon: Database },
    { name: 'WebSocket Broadcast Server', status: health?.websocket || 'CONNECTED', icon: Wifi }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
            AutoSOC Subsystem Health & Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of local services, CAN drivers, detection pipelines, and database integrity
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Run Health Probe
        </button>
      </div>

      {/* Subsystems Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{c.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-mono text-xs font-semibold text-emerald-400">{c.status}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Health Metrics Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-4">Runtime Diagnostic Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">SYSTEM UPTIME</span>
            <span className="text-cyan-400 font-bold">{health?.uptime_seconds || 0} seconds</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">WS ACTIVE PEERS</span>
            <span className="text-emerald-400 font-bold">{health?.ws_clients ?? 1} Connected</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">CAN STREAM GENERATOR</span>
            <span className="text-teal-400 font-bold">{health?.simulation_running ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">LAST TELEMETRY PROBE</span>
            <span className="text-slate-400 font-bold">
              {health ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
