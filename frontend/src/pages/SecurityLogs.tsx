import React, { useEffect, useState } from 'react';
import { SecurityEvent } from '../types/soc.js';
import { SeverityBadge } from '../components/common/Badges.js';
import { FileText, Download, Search, Filter, ArrowUpDown } from 'lucide-react';

export const SecurityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchLogs = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (severityFilter !== 'ALL') q.append('severity', severityFilter);
      q.append('limit', '300');

      const res = await fetch(`/api/events?${q.toString()}`);
      if (res.ok) setLogs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, severityFilter]);

  // CSV Export
  const exportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Event ID', 'Vehicle ID', 'ECU ID', 'CAN ID', 'Threat Type', 'Severity', 'Risk Score', 'Description', 'Status'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.id}"`,
      `"${l.vehicle_id}"`,
      `"${l.ecu_id}"`,
      `"${l.can_id}"`,
      `"${l.threat_type}"`,
      `"${l.severity}"`,
      l.risk_score,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `autosoc_security_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paginated = logs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(logs.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Cybersecurity Audit & Telemetry Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable security event journal with full query filtering and CSV reporting
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition"
        >
          <Download className="w-4 h-4" />
          Export CSV ({logs.length} records)
        </button>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search logs by threat, description, vehicle..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
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
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Event ID</th>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Target ECU</th>
                <th className="px-5 py-3">CAN ID</th>
                <th className="px-5 py-3">Threat Type</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                    No log records found.
                  </td>
                </tr>
              ) : (
                paginated.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-300">{l.id}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-cyan-400">{l.vehicle_id}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">{l.ecu_id}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400">{l.can_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-200">{l.threat_type}</td>
                    <td className="px-5 py-3.5">
                      <SeverityBadge severity={l.severity} />
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-300">{l.risk_score}</td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-sm truncate">{l.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, logs.length)} of {logs.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
