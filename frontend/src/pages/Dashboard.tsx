import React from 'react';
import { useSoc } from '../context/SocContext.js';
import { SeverityBadge, RiskScoreMeter } from '../components/common/Badges.js';
import {
  Car,
  Cpu,
  Radio,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const Dashboard: React.FC<{ onNavigate: (tab: string, param?: string) => void; onOpenSimulator: () => void }> = ({
  onNavigate,
  onOpenSimulator
}) => {
  const { analytics, alerts, incidents, canFrames, securityEvents } = useSoc();

  const summary = analytics?.summary || {
    vehiclesMonitored: 10,
    ecusMonitored: 70,
    canMessagesPerSec: 1250,
    securityEventsToday: 18,
    activeThreats: 2,
    criticalAlerts: 1,
    averageRiskScore: 32
  };

  const statCards = [
    {
      title: 'Vehicles Monitored',
      value: summary.vehiclesMonitored,
      icon: Car,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/20 border-cyan-500/30',
      subtitle: '100% telemetry online'
    },
    {
      title: 'ECUs Monitored',
      value: summary.ecusMonitored,
      icon: Cpu,
      color: 'text-blue-400',
      bg: 'bg-blue-950/20 border-blue-500/30',
      subtitle: 'Powertrain, ADAS & Gateway'
    },
    {
      title: 'CAN Messages / sec',
      value: summary.canMessagesPerSec.toLocaleString(),
      icon: Radio,
      color: 'text-teal-400',
      bg: 'bg-teal-950/20 border-teal-500/30',
      subtitle: 'SocketCAN vcan0 stream'
    },
    {
      title: 'Security Events Today',
      value: summary.securityEventsToday.toLocaleString(),
      icon: ShieldAlert,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/20 border-indigo-500/30',
      subtitle: '10 detection rules live'
    },
    {
      title: 'Active Threats',
      value: summary.activeThreats,
      icon: Flame,
      color: summary.activeThreats > 0 ? 'text-orange-400' : 'text-slate-400',
      bg: 'bg-orange-950/20 border-orange-500/30',
      subtitle: 'Requires SOC triage'
    },
    {
      title: 'Critical Alerts',
      value: summary.criticalAlerts,
      icon: AlertTriangle,
      color: summary.criticalAlerts > 0 ? 'text-rose-400' : 'text-slate-400',
      bg: 'bg-rose-950/20 border-rose-500/30',
      subtitle: 'Priority containment'
    },
    {
      title: 'Average Risk Score',
      value: `${summary.averageRiskScore}/100`,
      icon: Activity,
      color: summary.averageRiskScore > 50 ? 'text-amber-400' : 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-500/30',
      subtitle: 'Fleet cybersecurity posture'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Automotive Security Operations Center
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time intrusion detection, in-vehicle network analysis, and dynamic fleet threat mitigation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/50 transition"
          >
            <Flame className="w-4 h-4" />
            Simulate Attack
          </button>
          <button
            onClick={() => onNavigate('can-monitor')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            Live CAN Bus
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${card.bg} backdrop-blur flex flex-col justify-between hover:scale-[1.02] transition duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-bold tracking-tight ${card.color}`}>{card.value}</div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{card.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Alerts & Threats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Alerts Triage */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-slate-200">Active Security Alerts</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {alerts.filter((a) => a.status === 'ACTIVE').length}
                </span>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-800/60">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No active alerts recorded. All vehicles secure.</div>
              ) : (
                alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <SeverityBadge severity={alert.severity} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{alert.threat_type}</span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {alert.vehicle_id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{alert.ecu_id}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{alert.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{alert.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Critical Auto-Incidents Section */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-200">Critical Incidents Requiring Response</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {incidents.filter((i) => i.status !== 'RESOLVED').length}
                </span>
              </div>
              <button
                onClick={() => onNavigate('incidents')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Manage incidents <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {incidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-300">{inc.id}</span>
                      <SeverityBadge severity={inc.severity} />
                      <span className="text-xs font-semibold text-slate-200">{inc.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                      <span>Vehicle: <strong className="text-cyan-400">{inc.vehicle_id}</strong></span>
                      <span>Assigned: <strong className="text-slate-300">{inc.assigned_analyst}</strong></span>
                      <span className="text-slate-500">{new Date(inc.created_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                      {inc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live CAN Stream Ticker & Fleet Risk Highlights */}
        <div className="space-y-6">
          {/* Live CAN Ticker */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col h-[320px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200">Live CAN Telemetry Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                vcan0 LIVE
              </span>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-1">
              {canFrames.slice(0, 10).map((f, i) => (
                <div
                  key={i}
                  className={`p-1.5 rounded border ${
                    f.status !== 'NORMAL'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300'
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{f.can_id}</span>
                    <span className="text-slate-500 text-[10px]">{f.vehicle_id}</span>
                  </div>
                  <div className="text-slate-400 tracking-wider text-[10px] truncate max-w-[120px]">{f.data}</div>
                  <span
                    className={`text-[9px] px-1 rounded ${
                      f.status !== 'NORMAL' ? 'bg-rose-900 text-rose-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('can-monitor')}
              className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold text-center border border-slate-700 transition"
            >
              Open Full CAN Inspector →
            </button>
          </div>

          {/* Top Risk Vehicles */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">Vehicle Risk Posture</h3>
              </div>
              <button
                onClick={() => onNavigate('vehicles')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Fleet list <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(analytics?.distribution.vehicleRisks || [])
                .slice(0, 4)
                .map((v) => (
                  <div key={v.id} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-bold text-slate-200">{v.id} - {v.model}</span>
                      <SeverityBadge severity={v.security_status} />
                    </div>
                    <RiskScoreMeter score={v.risk_score} showLabel={false} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
