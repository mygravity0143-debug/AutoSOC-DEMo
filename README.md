# AutoSOC – Automotive Cybersecurity Monitoring Platform

A production-grade, local-first **Automotive Security Operations Center (AutoSOC)** monitoring platform that inspects vehicle ECUs, in-vehicle CAN bus traffic, cybersecurity anomalies, threats, vulnerabilities, and dynamic vehicle risk posture.

Built completely **without AWS, Azure, GCP, or external paid cloud services**.

---

## Architecture Overview

```
                AUTOMOTIVE ENVIRONMENT
                       │
          ┌────────────┴────────────┐
          │                         │
      ECU ENGINE                ECU BRAKE
          │                         │
          └──────────┬──────────────┘
                     │
                CAN NETWORK
                     │
                     ▼
               vcan0 / CAN
                     │
                     ▼
            Python CAN Collector
                     │
                     ▼
             Detection Engine (10 Rules)
                     │
          ┌──────────┴──────────┐
          │                     │
     Normal Event          Threat Event
          │                     │
          ▼                     ▼
       Database            Risk Scoring (0-100)
       (SQLite)                 │
                                ▼
                              Alert
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
                Incident              Notification
                     │
                     ▼
              WebSocket Server
                     │
                     ▼
             React Dashboard
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Analytics    Alerts     Logs
```

---

## Tech Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite
* **Backend**: Node.js, Express.js, WebSocket (`ws`), SQLite3 (modular for PostgreSQL)
* **CAN & Automotive Layer**: Python (`python-can`), Linux SocketCAN (`vcan0`) with fallback synthetic high-rate generator
* **Cybersecurity Engine**: 10 Automotive IDS detection rules, dynamic risk scoring (0–100), automated alert triage & incident response

---

## Features & Modules

1. **Main Dashboard**: Fleet KPI cards (Vehicles Monitored, ECUs Monitored, CAN Msg/s, Security Events Today, Active Threats, Critical Alerts, Average Risk Score), live CAN ticker, real-time alert triage.
2. **Vehicle Management**: Filterable fleet inventory with simulated VINs, ECU counts, live risk meters, and security states (`SECURE`, `MONITORING`, `WARNING`, `HIGH RISK`, `CRITICAL`).
3. **Vehicle Details**: Deep diagnostic view showing all 7 ECUs (Engine, Brake, Transmission, Airbag, IVI, ADAS, Gateway), firmware versions, and targeted security events.
4. **ECU Fleet Overview**: Master register of all domain controllers across the vehicle fleet.
5. **CAN Bus Real-Time Monitor**: High-speed hex packet monitor with Start/Stop/Pause/Resume, buffer clearing, ECU/ID filtering, and color-coded attack indicators.
6. **Threat Detection Engine**: Inspection of 10 automotive attack patterns (Unknown CAN ID, CAN flooding DoS, abnormal frequency, UDS diagnostic fuzzing, SecOC authentication failures, cross-domain ECU spoofing, firmware integrity tampering, etc.).
7. **Security Alert Queue**: Triage queue with live status updates, and functional **Acknowledge** and **Resolve** workflow.
8. **Incident Management**: Automated case generation for critical anomalies, forensic event timelines, analyst notes, and containment tracking.
9. **Cybersecurity Analytics**: Interactive Recharts graphs for events over time (1h/6h/24h), threat severity distribution, attack categories, and vehicle risk ranking.
10. **Audit & Security Logs**: Comprehensive searchable audit trail with pagination and **functional CSV export**.
11. **Vulnerability Management**: Simulated CVEs with CVSS 3.1 ratings, affected ECUs, and engineering remediation playbooks.
12. **Attack Simulator**: Interactive testing deck with 7 one-click attack scenarios demonstrating the end-to-end incident response lifecycle in safe sandbox mode.
13. **Architecture**: Interactive animated data pipeline diagram showing ECU -> CAN -> Collector -> Detection -> Backend -> Frontend.
14. **ISO/SAE 21434 Section**: Educational guide mapping platform features to clauses of the standard (TARA, Cybersecurity Goals, Post-Production Monitoring) with the required compliance disclaimer.
15. **System Health**: Live subsystem probe monitoring CAN interfaces, Python collector, detection engine, backend API, database, and WebSocket clients.
16. **Demo Login**: Local mock authentication portal.

---

## Installation & Running on Ubuntu / Linux

### 1. Prerequisites
```bash
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm can-utils
```

### 2. Configure Virtual CAN (`vcan0`)
```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
ip link show vcan0
```
*(Or simply run: `sudo bash scripts/setup_vcan.sh`)*

### 3. Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
*Backend runs on: `http://localhost:5000` (WebSocket at `ws://localhost:5000/ws`)*

### 4. Install & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

### 5. Optional Python CAN Collector
```bash
cd ../collector
pip install -r requirements.txt
python3 can_collector.py
```

---

## Deployment on Render

This project is prepared to run as a single Render web service.

### 1. Prepare the repo
- Push the AutoSOC project to GitHub
- Ensure the app root includes the frontend and backend folders

### 2. Create the Render service
- In Render, choose New -> Web Service
- Connect your GitHub repository
- Use the included render.yaml configuration

### 3. Expected runtime behavior
- The backend starts on the Render-provided PORT value
- The backend serves the built frontend from ../frontend/dist
- The API is available under /api
- The WebSocket endpoint is available under /ws

### 4. Production environment template
Use the sample settings in .env.example before deployment.

Example values:
- NODE_ENV=production
- PORT=5000
- CORS_ORIGIN=*

### 5. Validate the app after deployment
- Open the Render URL in a browser
- Check the health endpoint: /api/health
- Verify the dashboard loads and the WebSocket connects

> This deployment is intended for demo and educational use. It is not a live vehicle control system or an industrial production environment.

---

## 20-Step Demonstration Workflow

1. Open `http://localhost:5173` in your browser.
2. Click **Enter SOC Operations (Demo Login)**.
3. The **Main Dashboard** loads with live vehicles in healthy baseline status.
4. CAN simulation streams normal cyclic frames (`0x100`, `0x200`, `0x300`, `0x400`, `0x500`).
5. Navigate to **CAN Monitor** to inspect real-time hex payloads.
6. Click **Launch Attack Simulator** in the sidebar.
7. Select **Unknown CAN ID Injection** on `VEH-001` and click **Simulate**.
8. The Detection Engine flags arbitration ID `0x777`.
9. Notice the **Notification banner** appear instantly and vehicle risk score increase.
10. Check the **Alerts** page: a new active alert is queued.
11. Return to the Attack Simulator and trigger **CAN Message Flooding (DoS)** on `VEH-002`.
12. `VEH-002` risk escalates to **CRITICAL (100/100)**.
13. A **Critical Incident** is automatically generated in the **Incidents** section.
14. Navigate to **Incidents**: select the new case and examine the **Forensics Timeline**.
15. Add analyst investigation notes and change the status from `OPEN` to `INVESTIGATING` or `CONTAINED`.
16. Navigate to **Alerts** and click **Acknowledge** followed by **Resolve**.
17. Open **Security Logs**, test searching by `Flooding` or `0x777`, and click **Export CSV** to verify downloading the audit report.
18. View **Analytics** to see the Recharts graphs update with the new threat distribution.
19. Inspect **Architecture** and **ISO/SAE 21434** educational sections.
20. Check **System Health** to confirm all local subsystems report `ONLINE` and `HEALTHY`.

---

## Compliance & Educational Notice

> “This project is an educational cybersecurity monitoring simulation and is not an ISO/SAE 21434 certification or compliance assessment.”
