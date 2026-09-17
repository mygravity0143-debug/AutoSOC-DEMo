import React, { useEffect, useState } from 'react';
import { ECU } from '../types/soc.js';
import { SeverityBadge } from '../components/common/Badges.js';
import { Cpu, Search, Filter } from 'lucide-react';

export const EcusPage: React.FC = () => {
  const [ecus, setEcus] = useState<ECU[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/ecus')
      .then((r) => r.json())
      .then((data) => setEcus(data))
      .catch((e) => console.error(e));
  }, []);

  const filtered = ecus.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicle_id.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Fleet Electronic Control Units (ECUs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global register of powertrain, telematics, chassis, and ADAS electronic controllers
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ECU by name, ID, or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Domain:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Domains</option>
            <option value="POWERTRAIN">Powertrain</option>
            <option value="CHASSIS_SAFETY">Chassis Safety</option>
            <option value="TELEMATICS">Telematics / IVI</option>
            <option value="AUTONOMOUS">Autonomous / ADAS</option>
            <option value="GATEWAY_SECURITY">Gateway / Security</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">ECU ID</th>
                <th className="px-5 py-3">ECU Name</th>
                <th className="px-5 py-3">Vehicle ID</th>
                <th className="px-5 py-3">Domain Type</th>
                <th className="px-5 py-3">Firmware</th>
                <th className="px-5 py-3">Bus Cycle Rate</th>
                <th className="px-5 py-3">Security Status</th>
                <th className="px-5 py-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5 font-mono font-bold text-cyan-400">{e.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-200">{e.name}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{e.vehicle_id}</td>
                  <td className="px-5 py-3.5 font-mono text-indigo-400">{e.type}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{e.firmware_version}</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">{e.message_rate} msg/s</td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={e.security_status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
