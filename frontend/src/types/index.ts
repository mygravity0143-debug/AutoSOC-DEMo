export interface Vehicle {
  id: string;
  model: string;
  vin: string;
  ecu_count: number;
  risk_score: number;
  security_status: "SECURE" | "MONITORING" | "WARNING" | "HIGH_RISK" | "CRITICAL";
  last_seen: string;
  software_version: string;
  can_interface: string;
  last_event?: string;
}

export interface ECU {
  id: string;
  vehicle_id: string;
  ecu_type: "ENGINE" | "BRAKE" | "TRANSMISSION" | "AIRBAG" | "INFOTAINMENT" | "ADAS" | "GATEWAY";
  status: string;
  can_messages_per_sec: number;
  firmware_version: string;
  security_status: string;
  last_event: string;
}

export interface CANEvent {
  id: string;
  timestamp: string;
  vehicle_id: string;
  ecu_id: string;
  can_id: string;
  dlc: number;
  data: string;
  message_type: string;
  status: "NORMAL" | "SUSPICIOUS" | "MALICIOUS";
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  vehicle_id: string;
  ecu_id: string;
  can_id: string;
  event_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  description: string;
  status: "DETECTED" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";
}

export interface Alert {
  id: string;
  timestamp: string;
  vehicle_id: string;
  ecu_id: string;
  threat_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  description: string;
}

export interface Vulnerability {
  id: string;
  ecu_type: string;
  vehicle_id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cvss_score: number;
  status: "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";
  remediation: string;
  discovered_at: string;
}

export interface Incident {
  id: string;
  title: string;
  vehicle_id: string;
  ecu_id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  created_at: string;
  updated_at: string;
  assigned_analyst: string;
  status: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RESOLVED";
  notes: string;
  resolution: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  title: string;
  message: string;
  read: boolean;
}

export interface AnalyticsData {
  eventsOverTime: { time: string; events: number; threats: number }[];
  threatDistribution: { name: string; value: number; color: string }[];
  threatTypes: { name: string; count: number }[];
  vehicleRisks: { vehicle: string; risk: number; status: string }[];
  ecuStatus: { name: string; value: number }[];
  stats: {
    totalEvents: number;
    activeThreats: number;
    criticalAlerts: number;
    avgRiskScore: number;
    canMessagesPerSec: number;
    vehiclesMonitored: number;
    ecuCount: number;
  };
}

export interface SystemHealth {
  canInterface: string;
  canCollector: string;
  detectionEngine: string;
  backendApi: string;
  database: string;
  webSocket: string;
  dashboard: string;
  uptime: number;
  wsClients: number;
  dbSize: string;
  eventsProcessed: number;
  lastEventTime: string;
}

export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}
