import React, { createContext, useContext, useEffect, useState } from 'react';
import { CanFrame, SecurityEvent, Alert, Incident, NotificationItem, AnalyticsData } from '../types/soc.js';

interface SocContextType {
  canFrames: CanFrame[];
  securityEvents: SecurityEvent[];
  alerts: Alert[];
  incidents: Incident[];
  notifications: NotificationItem[];
  analytics: AnalyticsData | null;
  wsConnected: boolean;
  clearCanFrames: () => void;
  isCanPaused: boolean;
  setIsCanPaused: (paused: boolean) => void;
  triggerAttack: (attackType: string, vehicleId?: string) => Promise<any>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  updateIncident: (incidentId: string, payload: any) => Promise<void>;
  refreshAll: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  user: { name: string; email: string; role: string } | null;
  login: (email: string) => void;
  logout: () => void;
}

const SocContext = createContext<SocContextType | undefined>(undefined);

export const SocProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canFrames, setCanFrames] = useState<CanFrame[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isCanPaused, setIsCanPaused] = useState(false);

  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const saved = localStorage.getItem('autosoc_user');
    return saved ? JSON.parse(saved) : { name: 'SOC Analyst John Smith', email: 'analyst@autosoc.lab', role: 'Lead Incident Responder' };
  });

  const login = (email: string) => {
    const u = { name: 'SOC Analyst John Smith', email, role: 'Senior Security Analyst' };
    setUser(u);
    localStorage.setItem('autosoc_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autosoc_user');
  };

  const refreshAll = async () => {
    try {
      const [alertsRes, incRes, evtRes, anaRes, notifRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/incidents'),
        fetch('/api/events?limit=50'),
        fetch('/api/analytics'),
        fetch('/api/notifications')
      ]);

      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
      if (evtRes.ok) setSecurityEvents(await evtRes.json());
      if (anaRes.ok) setAnalytics(await anaRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  };

  useEffect(() => {
    refreshAll();

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;

    function connectWs() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WebSocket] Connected to AutoSOC gateway');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          if (type === 'CAN_FRAME') {
            if (!isCanPaused) {
              setCanFrames((prev) => [data, ...prev.slice(0, 99)]);
            }
          } else if (type === 'SECURITY_EVENT') {
            setSecurityEvents((prev) => [data, ...prev]);
            refreshAnalytics();
          } else if (type === 'ALERT_CREATED') {
            setAlerts((prev) => [data, ...prev]);
            refreshAnalytics();
          } else if (type === 'ALERT_UPDATED') {
            setAlerts((prev) => prev.map((a) => (a.id === data.id ? data : a)));
            refreshAnalytics();
          } else if (type === 'INCIDENT_CREATED') {
            setIncidents((prev) => [data, ...prev]);
            refreshAnalytics();
          } else if (type === 'INCIDENT_UPDATED') {
            setIncidents((prev) => prev.map((i) => (i.id === data.id ? data : i)));
            refreshAnalytics();
          } else if (type === 'NOTIFICATION') {
            setNotifications((prev) => [data, ...prev.slice(0, 29)]);
          } else if (type === 'VEHICLE_RISK_UPDATED') {
            refreshAnalytics();
          }
        } catch (e) {
          console.error('Error handling WS message', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    }

    connectWs();

    const interval = setInterval(refreshAnalytics, 10000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [isCanPaused]);

  const refreshAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {}
  };

  const clearCanFrames = () => setCanFrames([]);

  const triggerAttack = async (attackType: string, vehicleId?: string) => {
    const res = await fetch(`/api/simulate/${attackType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId })
    });
    const result = await res.json();
    await refreshAll();
    return result;
  };

  const acknowledgeAlert = async (alertId: string) => {
    await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)));
  };

  const resolveAlert = async (alertId: string) => {
    await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' });
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a)));
  };

  const updateIncident = async (incidentId: string, payload: any) => {
    const res = await fetch(`/api/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const updated = await res.json();
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <SocContext.Provider
      value={{
        canFrames,
        securityEvents,
        alerts,
        incidents,
        notifications,
        analytics,
        wsConnected,
        clearCanFrames,
        isCanPaused,
        setIsCanPaused,
        triggerAttack,
        acknowledgeAlert,
        resolveAlert,
        updateIncident,
        refreshAll,
        markNotificationRead,
        user,
        login,
        logout
      }}
    >
      {children}
    </SocContext.Provider>
  );
};

export const useSoc = () => {
  const context = useContext(SocContext);
  if (!context) throw new Error('useSoc must be used within a SocProvider');
  return context;
};
