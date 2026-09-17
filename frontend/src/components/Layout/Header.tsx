import React, { useState } from 'react';
import { useSoc } from '../../context/SocContext.js';
import { Shield, Bell, Clock, User, Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react';

export const Header: React.FC = () => {
  const { wsConnected, notifications, markNotificationRead, user, logout } = useSoc();
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AutoSOC
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              v1.0 Local
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Automotive Cybersecurity Monitoring Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono">
          {wsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-emerald-400 font-semibold">ONLINE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-semibold">CONNECTING</span>
            </>
          )}
        </div>

        {/* Current Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-300 px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 relative transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Live SOC Notifications</span>
                <span className="text-[11px] text-slate-400">{notifications.length} items</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No active notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 hover:bg-slate-800/50 cursor-pointer rounded transition ${
                        !n.read ? 'bg-cyan-950/20 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
            {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-none">{user?.name || 'Analyst'}</div>
            <div className="text-[10px] text-slate-400 leading-none mt-1">{user?.role || 'Tier-2 Responder'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
