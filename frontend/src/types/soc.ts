export interface Vehicle {
  id: string;
  vin: string;
  model: string;
  software_version: string;
  ecu_count: number;
  can_interface: string;
  risk_score: number;
  security_status: 'SECURE' | 'MONITORING' | 'WARNING' | 'HIGH RISK' | 'CRITICAL';
  last_seen: string;
}

export interface ECU {
  id: string;
  vehicle_id: string;
  name: string;
  type: string;
  status: string;
  firmware_version: string;
  message_rate: number;
  security_status: 'SECURE' | 'WARNING' | 'HIGH RISK' | 'CRITICAL';
  last_event: string;
}

export interface CanFrame {
  id?: number;
  timestamp: string;
  vehicle_id: string;
  ecu_id: string;
  can_id: string;
  dlc: number;
  data: string;
  message_type: string;
  status: 'NORMAL' | 'SUSPICIOUS' | 'FLOOD' | 'ANOMALOUS' | 'AUTH_VIOLATION' | 'DIAG_ABUSE' | 'SPOOFED' | 'INTEGRITY_FAIL';
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  vehicle_id: string;
  ecu_id: string;
  can_id: string;
  threat_type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  status: 'DETECTED' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
}

export interface Alert {
  id: string;
  vehicle_id: string;
  ecu_id: string;
  threat_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  description: string;
}

export interface Incident {
  id: string;
  title: string;
  vehicle_id: string;
  ecu_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  created_time: string;
  assigned_analyst: string;
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  timeline_json?: string;
  notes?: string;
  resolution?: string;
}

export interface Vulnerability {
  id: string;
  ecu_name: string;
  vehicle_id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cvss_score: number;
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
  remediation: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  severity: string;
  read?: boolean;
}

export interface AnalyticsData {
  summary: {
    vehiclesMonitored: number;
    ecusMonitored: number;
    canMessagesPerSec: number;
    securityEventsToday: number;
    activeThreats: number;
    criticalAlerts: number;
    averageRiskScore: number;
    totalIncidents: number;
    totalVulnerabilities: number;
  };
  distribution: {
    severity: { severity: string; count: number }[];
    threatTypes: { threat_type: string; count: number }[];
    vehicleRisks: { id: string; model: string; risk_score: number; security_status: string }[];
    ecuHealth: { secure: number; warning: number; critical: number };
  };
  eventsOverTime: { time: string; events: number; critical: number; high: number }[];
}

export interface SystemHealthData {
  status: string;
  can_interface: string;
  can_collector: string;
  detection_engine: string;
  backend_api: string;
  database: string;
  websocket: string;
  ws_clients: number;
  simulation_running: boolean;
  uptime_seconds: number;
  timestamp: string;
}
