import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const sev = (severity || 'LOW').toUpperCase();
  let bg = 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400';
  let dot = 'bg-emerald-400';

  if (sev === 'CRITICAL') {
    bg = 'bg-rose-950/80 border-rose-500/50 text-rose-400 animate-pulse';
    dot = 'bg-rose-500';
  } else if (sev === 'HIGH' || sev === 'HIGH RISK') {
    bg = 'bg-orange-950/70 border-orange-500/40 text-orange-400';
    dot = 'bg-orange-400';
  } else if (sev === 'MEDIUM' || sev === 'WARNING' || sev === 'MONITORING') {
    bg = 'bg-amber-950/70 border-amber-500/40 text-amber-400';
    dot = 'bg-amber-400';
  }

  const sizeCls = size === 'lg' ? 'px-3 py-1 text-sm' : size === 'md' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${bg} ${sizeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {sev}
    </span>
  );
};

export const RiskScoreMeter: React.FC<{ score: number; showLabel?: boolean }> = ({ score, showLabel = true }) => {
  let color = 'from-emerald-500 to-teal-400';
  let textColor = 'text-emerald-400';
  let statusText = 'SECURE';

  if (score >= 80) {
    color = 'from-rose-600 to-red-500';
    textColor = 'text-rose-400';
    statusText = 'CRITICAL';
  } else if (score >= 60) {
    color = 'from-orange-500 to-amber-500';
    textColor = 'text-orange-400';
    statusText = 'HIGH RISK';
  } else if (score >= 30) {
    color = 'from-amber-500 to-yellow-400';
    textColor = 'text-amber-400';
    statusText = 'MONITORING';
  }

  return (
    <div className="flex flex-col gap-1 w-full min-w-[120px]">
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-slate-400">{statusText}</span>
          <span className={`font-mono font-bold ${textColor}`}>{score}/100</span>
        </div>
      )}
      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>
    </div>
  );
};
