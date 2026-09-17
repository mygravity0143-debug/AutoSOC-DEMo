import React, { useState } from 'react';
import { useSoc } from '../context/SocContext.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { BarChart3, Clock, PieChart as PieIcon, Shield, Activity } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { analytics } = useSoc();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('6h');

  const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'];

  const severityData = analytics?.distribution.severity.map((s) => ({
    name: s.severity,
    value: s.count
  })) || [
    { name: 'LOW', value: 12 },
    { name: 'MEDIUM', value: 8 },
    { name: 'HIGH', value: 5 },
    { name: 'CRITICAL', value: 3 }
  ];

  const threatTypeData = analytics?.distribution.threatTypes.map((t) => ({
    type: t.threat_type.replace(' Detected', '').replace(' (DoS)', ''),
    count: t.count
  })) || [];

  const vehicleRiskData = analytics?.distribution.vehicleRisks.map((v) => ({
    vehicle: v.id,
    risk: v.risk_score
  })) || [];

  const eventsOverTime = analytics?.eventsOverTime || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Security Analytics & Telemetry Metrics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic distribution charts, threat event frequency, and fleet cybersecurity telemetry
          </p>
        </div>

        {/* Time range toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          {(['1h', '6h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-md font-medium transition ${
                timeRange === r ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last {r}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Events Over Time (Line Chart) */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-cyan-400" /> Events Over Time ({timeRange})
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eventsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="events" name="Total Events" stroke="#06b6d4" strokeWidth={2} dot />
              <Line type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} dot />
              <Line type="monotone" dataKey="high" name="High Risk" stroke="#f97316" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Threat Distribution & Threat Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Distribution by Severity */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-indigo-400" /> Threat Severity Distribution
          </h3>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Types Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-amber-400" /> Detected Attack Categories
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatTypeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="type" type="category" stroke="#64748b" fontSize={10} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Vehicle Risk Profile Bar Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-400" /> Vehicle Risk Index (0–100)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleRiskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="vehicle" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
              <Bar dataKey="risk" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
