import React from 'react';
import {
  LayoutDashboard,
  Car,
  Cpu,
  Radio,
  ShieldAlert,
  BellRing,
  FileText,
  Bug,
  AlertOctagon,
  BarChart3,
  Network,
  HeartPulse,
  Settings,
  Flame
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSimulator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, onOpenSimulator }) => {
  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'ecus', label: 'ECUs', icon: Cpu },
    { id: 'can-monitor', label: 'CAN Monitor', icon: Radio },
    { id: 'threat-detection', label: 'Threat Detection', icon: ShieldAlert },
    { id: 'alerts', label: 'Alerts', icon: BellRing },
    { id: 'security-logs', label: 'Security Logs', icon: FileText },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'system-health', label: 'System Health', icon: HeartPulse },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <div className="p-3 space-y-1">
        {/* Quick Attack Simulator Trigger Button */}
        <button
          onClick={onOpenSimulator}
          className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold text-xs shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-red-500 transition border border-rose-400/30"
        >
          <Flame className="w-4 h-4 animate-bounce" />
          <span>Launch Attack Simulator</span>
        </button>

        <div className="text-[10px] uppercase tracking-wider font-mono text-slate-500 px-3 py-1">
          SOC Operations
        </div>

        {menu.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500">
        <div className="flex justify-between items-center">
          <span>Virtual CAN:</span>
          <span className="font-mono text-cyan-400">vcan0 Active</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span>Engine Status:</span>
          <span className="font-mono text-emerald-400">10 Rules Enforced</span>
        </div>
      </div>
    </aside>
  );
};
