import React, { useEffect, useState } from 'react';
import { Vehicle, ECU, SecurityEvent, CanFrame } from '../types/soc.js';
import { SeverityBadge, RiskScoreMeter } from '../components/common/Badges.js';
import { ArrowLeft, Cpu, ShieldCheck, Radio, AlertTriangle, Activity } from 'lucide-react';

export const VehicleDetailsPage: React.FC<{ vehicleId: string; onBack: () => void }> = ({ vehicleId, onBack }) => {
  const [data, setData] = useState<{
    vehicle: Vehicle;
    ecus: ECU[];
    recentEvents: SecurityEvent[];
    recentCan: CanFrame[];
  } | null>(null);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDetails();
    const timer = setInterval(fetchDetails, 4000);
    return () => clearInterval(timer);
  }, [vehicleId]);

  if (!data) {
    return <div className="p-8 text-center text-slate-400 font-mono">Loading vehicle diagnostic profile...</div>;
  }

  const { vehicle, ecus, recentEvents, recentCan } = data;

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vehicle Fleet
        </button>
        <div className="text-xs font-mono text-slate-500">Live Telemetry Synchronized</div>
      </div>

      {/* Vehicle Info Card */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-100">{vehicle.model}</h2>
              <span className="font-mono text-cyan-400 font-bold px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-xs">
                {vehicle.id}
              </span>
              <SeverityBadge severity={vehicle.security_status} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-2">
              <span>VIN: <strong className="text-slate-200">{vehicle.vin}</strong></span>
              <span>•</span>
              <span>Software: <strong className="text-slate-200">{vehicle.software_version}</strong></span>
              <span>•</span>
              <span>Bus Interface: <strong className="text-emerald-400">{vehicle.can_interface}</strong></span>
            </div>
          </div>

          <div className="w-full md:w-64 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Dynamic Vehicle Risk</div>
            <RiskScoreMeter score={vehicle.risk_score} />
          </div>
        </div>

        {/* ECU Subsystem Grid */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Configured In-Vehicle ECUs ({ecus.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {ecus.map((ecu) => (
              <div
                key={ecu.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{ecu.name}</span>
                  <SeverityBadge severity={ecu.security_status} />
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>ECU ID:</span>
                    <span className="text-slate-300">{ecu.id.split('-').slice(2).join('-')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domain:</span>
                    <span className="text-cyan-400">{ecu.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firmware:</span>
                    <span className="text-slate-300">{ecu.firmware_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Msg Rate:</span>
                    <span className="text-emerald-400">{ecu.message_rate} Hz</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Security Events & Recent Raw CAN Frames */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events for this Vehicle */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-800">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Detected Cybersecurity Events for {vehicle.id}
          </h3>

          <div className="mt-3 divide-y divide-slate-800/60">
            {recentEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No security events triggered for this vehicle.</div>
            ) : (
              recentEvents.map((evt) => (
                <div key={evt.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={evt.severity} />
                      <span className="text-xs font-semibold text-slate-200">{evt.threat_type}</span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.can_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{evt.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live CAN Telemetry for this Vehicle */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Radio className="w-4 h-4 text-teal-400" />
            Recent CAN Bus Traffic for {vehicle.id}
          </h3>

          <div className="mt-3 overflow-y-auto max-h-[300px] font-mono text-[11px] space-y-1">
            {recentCan.map((f, i) => (
              <div
                key={i}
                className="p-1.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-bold">{f.can_id}</span>
                  <span className="text-slate-500 text-[10px]">{f.message_type}</span>
                </div>
                <span className="text-slate-400 tracking-wider text-[10px]">{f.data}</span>
                <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
