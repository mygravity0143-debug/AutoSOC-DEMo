import React, { useEffect, useState } from 'react';
import { Vulnerability } from '../types/soc.js';
import { SeverityBadge } from '../components/common/Badges.js';
import { Bug, Search, Filter, ShieldAlert, Wrench } from 'lucide-react';

export const VulnerabilitiesPage: React.FC = () => {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchVulns = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (statusFilter !== 'ALL') q.append('status', statusFilter);

      const res = await fetch(`/api/vulnerabilities?${q.toString()}`);
      if (res.ok) setVulns(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchVulns();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bug className="w-6 h-6 text-purple-400" />
            Vehicle Vulnerability Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulated CVE/CWE firmware flaws, CVSS 3.1 ratings, and engineering remediation playbooks
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vulnerability title, ECU, or remediation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="MITIGATED">MITIGATED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vulns.map((v) => (
          <div
            key={v.id}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono font-bold text-cyan-400">{v.id}</span>
                  <h3 className="text-sm font-bold text-slate-200 mt-0.5">{v.title}</h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono text-rose-400">CVSS {v.cvss_score.toFixed(1)}</div>
                  <SeverityBadge severity={v.severity} />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-2 pb-3 border-b border-slate-800">
                <span>Affected ECU: <strong className="text-slate-200">{v.ecu_name}</strong></span>
                <span>•</span>
                <span>Vehicle: <strong className="text-cyan-400">{v.vehicle_id}</strong></span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">{v.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Remediation Recommendation
              </div>
              <p className="text-xs text-slate-400 font-mono">{v.remediation}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-500">
                Status: <strong className="text-slate-300">{v.status}</strong>
              </span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
               
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
