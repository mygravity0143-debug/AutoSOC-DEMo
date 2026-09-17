import React, { useState } from 'react';
import { useSoc } from '../context/SocContext.js';
import { SeverityBadge } from '../components/common/Badges.js';
import { AlertOctagon, User, Clock, CheckCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { Incident } from '../types/soc.js';

export const IncidentsPage: React.FC = () => {
  const { incidents, updateIncident, user } = useSoc();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [analystNotes, setAnalystNotes] = useState('');
  const [newStatus, setNewStatus] = useState<any>('OPEN');

  const activeIncident = selectedIncident || incidents[0] || null;

  const handleSave = async () => {
    if (!activeIncident) return;
    await updateIncident(activeIncident.id, {
      status: newStatus,
      notes: analystNotes,
      assigned_analyst: user?.name || 'Lead Responder'
    });
    alert('Incident ticket updated successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            Automotive Incident Management & Response
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated ticket escalation, containment playbooks, and root-cause evidence timeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List (Left 1 col) */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">Incident Queue ({incidents.length})</span>
            <span className="text-[10px] font-mono text-slate-500">Auto-Escalated</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = activeIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setAnalystNotes(inc.notes || '');
                    setNewStatus(inc.status);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{inc.title}</h4>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                    <span>{inc.vehicle_id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{inc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Detail (Right 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          {activeIncident ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-cyan-400">{activeIncident.id}</span>
                    <SeverityBadge severity={activeIncident.severity} size="md" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">{activeIncident.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="CONTAINED">CONTAINED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>

                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
                  >
                    Update Ticket
                  </button>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">VEHICLE ID</span>
                  <span className="text-cyan-400 font-bold">{activeIncident.vehicle_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">AFFECTED ECU</span>
                  <span className="text-slate-200">{activeIncident.ecu_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ASSIGNED ANALYST</span>
                  <span className="text-slate-200">{activeIncident.assigned_analyst}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">RISK SCORE AT EVENT</span>
                  <span className="text-rose-400 font-bold">{activeIncident.risk_score}/100</span>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider mb-3">
                  Incident Forensics Timeline
                </h4>
                <div className="space-y-3 relative pl-4 border-l border-cyan-500/30">
                  {JSON.parse(activeIncident.timeline_json || '[]').map((t: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-950" />
                      <div className="text-[11px] font-mono text-slate-500">{new Date(t.time).toLocaleString()}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{t.event}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyst Notes */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider mb-2 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Analyst Notes & Triage Log
                </h4>
                <textarea
                  rows={4}
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="Record forensic observation, CAN arbitration trace notes, containment steps..."
                  className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500">Select an incident to view investigation details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
