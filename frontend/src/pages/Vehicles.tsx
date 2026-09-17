import React, { useEffect, useState } from 'react';
import { Vehicle } from '../types/soc.js';
import { SeverityBadge, RiskScoreMeter } from '../components/common/Badges.js';
import { Search, Filter, ArrowUpDown, ChevronRight, Car, Shield } from 'lucide-react';

export const VehiclesPage: React.FC<{ onSelectVehicle: (id: string) => void }> = ({ onSelectVehicle }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'id' | 'risk_desc' | 'risk_asc'>('risk_desc');
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (sortOrder !== 'id') query.append('sort', sortOrder);

      const res = await fetch(`/api/vehicles?${query.toString()}`);
      if (res.ok) {
        setVehicles(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Car className="w-6 h-6 text-cyan-400" />
            Monitored Vehicle Fleet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cybersecurity inventory, telemetry status, and ECU posture per vehicle
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Vehicle ID, VIN, or Model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SECURE">SECURE</option>
              <option value="MONITORING">MONITORING</option>
              <option value="WARNING">WARNING</option>
              <option value="HIGH RISK">HIGH RISK</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
              <option value="id">Vehicle ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Grid / Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Vehicle ID</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Simulated VIN</th>
                <th className="px-5 py-3">ECU Count</th>
                <th className="px-5 py-3">CAN Interface</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Security Status</th>
                <th className="px-5 py-3">Last Seen</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vehicles.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => onSelectVehicle(v.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-cyan-400">{v.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-200">{v.model}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{v.vin}</td>
                  <td className="px-5 py-3.5 font-mono">{v.ecu_count} ECUs</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">{v.can_interface}</td>
                  <td className="px-5 py-3.5 w-36">
                    <RiskScoreMeter score={v.risk_score} />
                  </td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={v.security_status} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500">
                    {new Date(v.last_seen).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold hover:underline">
                      Details <ChevronRight className="w-3.5 h-3.5" />
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
