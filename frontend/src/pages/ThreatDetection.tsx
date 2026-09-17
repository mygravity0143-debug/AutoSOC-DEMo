import React, { useEffect, useState } from 'react';
import { SecurityEvent } from '../types/soc.js';
import { SeverityBadge } from '../components/common/Badges.js';
import { ShieldAlert, Search, Filter } from 'lucide-react';

export const ThreatDetectionPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchThreats = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (severityFilter !== 'ALL') q.append('severity', severityFilter);
      q.append('limit', '100');

      const res = await fetch(`/api/events?${q.toString()}`);
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchThreats();
    const t = setInterval(fetchThreats, 5000);
    return () => clearInterval(t);
  }, [search, severityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Automotive Threat Detection Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time rule evaluation, cross-domain arbitration checks, and behavioral anomaly detections
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search threat type, description, or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Event ID</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Vehicle ID</th>
                <th className="px-5 py-3">Target ECU</th>
                <th className="px-5 py-3">CAN ID</th>
                <th className="px-5 py-3">Threat Type</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                    No threat events matching filter.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-300">{evt.id}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-cyan-400 font-semibold">{evt.vehicle_id}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">{evt.ecu_id}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400">{evt.can_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-200">{evt.threat_type}</td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">{evt.description}</td>
                    <td className="px-5 py-3.5">
                      <SeverityBadge severity={evt.severity} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
