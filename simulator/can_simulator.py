#!/usr/bin/env python3
"""
AutoSOC Python CAN Simulator
Simulates CAN bus traffic from multiple ECUs.
Uses python-can library with vcan0 if available, otherwise pure simulation.
Posts events to the AutoSOC backend API.
"""

import time
import random
import json
import threading
import signal
import sys
import struct
import logging
from datetime import datetime
from typing import Optional
import requests

# Try to import python-can (optional, requires SocketCAN on Linux)
try:
    import can
    CAN_AVAILABLE = True
except ImportError:
    CAN_AVAILABLE = False
    print("[WARNING] python-can not available. Running in pure simulation mode.")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────
BACKEND_URL = "http://localhost:3001"
CAN_INTERFACE = "vcan0"
SIMULATION_RATE = 2.0   # seconds between message batches
BATCH_SIZE = 5          # messages per batch
ANOMALY_PROBABILITY = 0.05  # 5% chance of anomaly per batch

# ─── Vehicle / ECU definitions ────────────────────────────────────────────────
VEHICLES = [
    {"id": "VEH-001", "model": "Tesla Model S"},
    {"id": "VEH-002", "model": "BMW 5 Series"},
    {"id": "VEH-003", "model": "Mercedes E-Class"},
    {"id": "VEH-004", "model": "Audi A6"},
    {"id": "VEH-005", "model": "Toyota Camry"},
]

ECU_CONFIG = {
    "ENGINE":       {"can_ids": [0x100, 0x101, 0x102], "message_types": ["RPM_UPDATE", "ENGINE_TEMP", "FUEL_STATUS"]},
    "BRAKE":        {"can_ids": [0x200, 0x201],         "message_types": ["BRAKE_STATUS", "ABS_STATUS"]},
    "TRANSMISSION": {"can_ids": [0x300, 0x301],         "message_types": ["GEAR_STATUS", "TORQUE_DATA"]},
    "AIRBAG":       {"can_ids": [0x110, 0x111],         "message_types": ["AIRBAG_STATUS", "SEATBELT_STATUS"]},
    "INFOTAINMENT": {"can_ids": [0x400, 0x401],         "message_types": ["MEDIA_STATUS", "NAV_UPDATE"]},
    "ADAS":         {"can_ids": [0x500, 0x501],         "message_types": ["OBJECT_DETECTION", "LANE_STATUS"]},
    "GATEWAY":      {"can_ids": [0x120, 0x121],         "message_types": ["ROUTING_STATUS", "GATEWAY_HEARTBEAT"]},
}

# Known-safe CAN IDs
SAFE_CAN_IDS = [
    0x100, 0x101, 0x102, 0x110, 0x111, 0x120, 0x121,
    0x200, 0x201, 0x300, 0x301, 0x400, 0x401, 0x500, 0x501,
]

# Suspicious/unknown CAN IDs
SUSPICIOUS_CAN_IDS = [0x777, 0x666, 0x999, 0x7DF, 0x7FF, 0x6FF]


# ─── Data generators ──────────────────────────────────────────────────────────
def generate_engine_data() -> bytes:
    """Generate realistic engine ECU data (RPM, temperature)."""
    rpm = random.randint(800, 6500)
    temp = random.randint(70, 110)
    throttle = random.randint(0, 100)
    fuel = random.randint(20, 100)
    return struct.pack(">HBBBBBB", rpm, temp, throttle, fuel, 0, 0, 0)

def generate_brake_data() -> bytes:
    """Generate brake ECU data (pressure, ABS active)."""
    pressure = random.randint(0, 255)
    abs_active = random.randint(0, 1)
    pad_wear = random.randint(30, 100)
    return struct.pack(">BBBBBBBB", pressure, abs_active, pad_wear, 0, 0, 0, 0, 0)

def generate_transmission_data() -> bytes:
    """Generate transmission ECU data (gear, torque)."""
    gear = random.randint(1, 8)
    torque = random.randint(100, 400)
    return struct.pack(">BHBBBBB", gear, torque, 0, 0, 0, 0, 0)

def generate_generic_data() -> bytes:
    """Generate generic 8-byte CAN data."""
    return bytes([random.randint(0, 255) for _ in range(8)])

def generate_suspicious_data() -> bytes:
    """Generate obviously suspicious all-FF data."""
    return bytes([0xFF] * 8)

def bytes_to_hex_string(data: bytes) -> str:
    """Convert bytes to hex string like '11 22 33 44 55 66 77 88'."""
    return ' '.join(f'{b:02X}' for b in data)


# ─── CAN Message Senders ──────────────────────────────────────────────────────
def send_to_backend(vehicle: dict, ecu_type: str, can_id: int, data: bytes,
                    message_type: str, status: str = "NORMAL") -> bool:
    """Send a CAN event to the backend API."""
    payload = {
        "vehicle_id": vehicle["id"],
        "ecu_id": f"ECU_{ecu_type}_{vehicle['id']}",
        "can_id": f"0x{can_id:03X}",
        "dlc": len(data),
        "data": bytes_to_hex_string(data),
        "message_type": message_type,
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    try:
        resp = requests.post(f"{BACKEND_URL}/api/can", json=payload, timeout=3)
        return resp.status_code in (200, 201)
    except requests.exceptions.ConnectionError:
        logger.warning("Backend not reachable. Is the Node.js server running?")
        return False
    except Exception as e:
        logger.error(f"Failed to send CAN event: {e}")
        return False


def send_via_vcan(can_id: int, data: bytes) -> bool:
    """Send a CAN frame via vcan0 interface (Linux SocketCAN)."""
    if not CAN_AVAILABLE:
        return False
    try:
        bus = can.interface.Bus(channel=CAN_INTERFACE, interface='socketcan')
        msg = can.Message(arbitration_id=can_id, data=data, is_extended_id=False)
        bus.send(msg)
        bus.shutdown()
        return True
    except Exception as e:
        logger.debug(f"vcan0 send failed: {e}")
        return False


# ─── Simulator Core ───────────────────────────────────────────────────────────
class CANSimulator:
    def __init__(self):
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.messages_sent = 0
        self.anomalies_sent = 0
        self.vcan_available = False
        self._check_vcan()

    def _check_vcan(self):
        """Check if vcan0 is available."""
        if not CAN_AVAILABLE:
            self.vcan_available = False
            return
        try:
            bus = can.interface.Bus(channel=CAN_INTERFACE, interface='socketcan')
            bus.shutdown()
            self.vcan_available = True
            logger.info(f"✓ {CAN_INTERFACE} interface detected. Using SocketCAN.")
        except Exception:
            self.vcan_available = False
            logger.info(f"✗ {CAN_INTERFACE} not available. Using pure simulation mode.")

    def generate_normal_message(self, vehicle: dict):
        """Generate and send a normal CAN message."""
        ecu_type = random.choice(list(ECU_CONFIG.keys()))
        ecu_cfg = ECU_CONFIG[ecu_type]
        can_id = random.choice(ecu_cfg["can_ids"])
        message_type = random.choice(ecu_cfg["message_types"])

        if ecu_type == "ENGINE":
            data = generate_engine_data()
        elif ecu_type == "BRAKE":
            data = generate_brake_data()
        elif ecu_type == "TRANSMISSION":
            data = generate_transmission_data()
        else:
            data = generate_generic_data()

        if self.vcan_available:
            send_via_vcan(can_id, data)

        success = send_to_backend(vehicle, ecu_type, can_id, data, message_type, "NORMAL")
        if success:
            self.messages_sent += 1

    def generate_anomaly_message(self, vehicle: dict):
        """Generate and send an anomalous CAN message."""
        anomaly_type = random.choice([
            "unknown_can_id",
            "suspicious_data",
            "diagnostic_request",
        ])

        if anomaly_type == "unknown_can_id":
            can_id = random.choice(SUSPICIOUS_CAN_IDS)
            data = generate_generic_data()
            message_type = "UNKNOWN"
            status = "SUSPICIOUS"
        elif anomaly_type == "suspicious_data":
            ecu_type = random.choice(list(ECU_CONFIG.keys()))
            can_id = random.choice(ECU_CONFIG[ecu_type]["can_ids"])
            data = generate_suspicious_data()
            message_type = "ANOMALOUS_DATA"
            status = "SUSPICIOUS"
        else:  # diagnostic_request
            can_id = 0x7DF  # OBD-II broadcast
            data = bytes([0x02, 0x01, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00])
            message_type = "DIAGNOSTIC_REQUEST"
            status = "SUSPICIOUS"
            ecu_type = "GATEWAY"

        if anomaly_type != "diagnostic_request":
            ecu_type = "UNKNOWN"

        logger.warning(f"[ANOMALY] Vehicle {vehicle['id']} | CAN 0x{can_id:03X} | {anomaly_type}")

        if self.vcan_available:
            send_via_vcan(can_id, data)

        success = send_to_backend(vehicle, ecu_type, can_id, data, message_type, status)
        if success:
            self.anomalies_sent += 1

    def simulation_loop(self):
        """Main simulation loop."""
        logger.info("CAN simulation loop started.")
        while self.running:
            try:
                # Pick random vehicles for this batch
                for _ in range(BATCH_SIZE):
                    if not self.running:
                        break
                    vehicle = random.choice(VEHICLES)

                    # Decide normal or anomaly
                    if random.random() < ANOMALY_PROBABILITY:
                        self.generate_anomaly_message(vehicle)
                    else:
                        self.generate_normal_message(vehicle)

                    time.sleep(0.1)  # stagger messages slightly

                # Status log every 50 messages
                if self.messages_sent % 50 == 0 and self.messages_sent > 0:
                    logger.info(
                        f"Status: {self.messages_sent} messages sent, "
                        f"{self.anomalies_sent} anomalies, "
                        f"vcan={'YES' if self.vcan_available else 'NO'}"
                    )

                time.sleep(SIMULATION_RATE)

            except Exception as e:
                logger.error(f"Simulation loop error: {e}")
                time.sleep(1)

        logger.info("CAN simulation loop stopped.")

    def start(self):
        """Start the simulation."""
        if self.running:
            logger.warning("Simulator already running.")
            return
        self.running = True
        self.thread = threading.Thread(target=self.simulation_loop, daemon=True)
        self.thread.start()
        logger.info("AutoSOC CAN Simulator started.")
        logger.info(f"Mode: {'SocketCAN (vcan0)' if self.vcan_available else 'Pure Simulation'}")
        logger.info(f"Rate: {BATCH_SIZE} messages every {SIMULATION_RATE}s")
        logger.info(f"Backend: {BACKEND_URL}")

    def stop(self):
        """Stop the simulation."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info(f"Simulator stopped. Total: {self.messages_sent} messages, {self.anomalies_sent} anomalies.")


# ─── Signal Handling ──────────────────────────────────────────────────────────
simulator = CANSimulator()

def signal_handler(sig, frame):
    logger.info("\nShutdown signal received.")
    simulator.stop()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  AutoSOC Python CAN Simulator")
    print("  Automotive Cybersecurity Monitoring Platform")
    print("=" * 60)

    # Check backend connectivity
    logger.info(f"Checking backend connectivity at {BACKEND_URL}...")
    for attempt in range(5):
        try:
            resp = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
            if resp.status_code == 200:
                logger.info("✓ Backend is reachable.")
                break
        except Exception:
            if attempt < 4:
                logger.warning(f"Backend not ready, retrying in 3 seconds... ({attempt+1}/5)")
                time.sleep(3)
            else:
                logger.error("Backend not reachable after 5 attempts. Starting anyway (messages will be buffered).")

    # Start simulation
    simulator.start()

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        simulator.stop()
