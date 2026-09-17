"""
AutoSOC - Python Virtual CAN Collector & Bridge
Attaches to Linux SocketCAN (vcan0) or operates in standalone bridge mode.
Reads raw CAN frames and forwards telemetry packets to the Node.js backend.
"""

import sys
import time
import json
import urllib.request
import urllib.error

BACKEND_API = "http://localhost:5000/api/events"
CAN_INTERFACE = "vcan0"

def send_frame_to_backend(vehicle_id, ecu_id, can_id, dlc, data_hex, msg_type="COLLECTED"):
    payload = {
        "vehicle_id": vehicle_id,
        "ecu_id": ecu_id,
        "can_id": can_id,
        "dlc": dlc,
        "data": data_hex,
        "message_type": msg_type
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(BACKEND_API, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=2) as response:
            return response.status == 200
    except Exception as e:
        print(f"[Collector] Forward error: {e}", file=sys.stderr)
        return False

def main():
    print(f"[AutoSOC Python Collector] Initializing interface: {CAN_INTERFACE}")
    
    can_available = False
    bus = None
    try:
        import can
        try:
            bus = can.interface.Bus(channel=CAN_INTERFACE, bustype='socketcan')
            can_available = True
            print(f"[AutoSOC Python Collector] Attached successfully to native SocketCAN '{CAN_INTERFACE}'!")
        except Exception as e:
            print(f"[AutoSOC Python Collector] SocketCAN '{CAN_INTERFACE}' not active ({e}).")
            print("[AutoSOC Python Collector] Falling back to automated collector test loop.")
    except ImportError:
        print("[AutoSOC Python Collector] 'python-can' library not installed. Using synthetic telemetry bridge mode.")

    if can_available and bus:
        print("[AutoSOC Python Collector] Listening for frames on vcan0...")
        try:
            for msg in bus:
                can_id = hex(msg.arbitration_id)
                dlc = msg.dlc
                data_hex = " ".join(f"{b:02X}" for b in msg.data)
                print(f"[vcan0] RX ID={can_id} DLC={dlc} DATA={data_hex}")
                send_frame_to_backend("VEH-001", "VEH-001-ECU-01", can_id, dlc, data_hex, "VCAN0_FRAME")
        except KeyboardInterrupt:
            print("\n[AutoSOC Python Collector] Collector stopped.")
    else:
        print("[AutoSOC Python Collector] Running collector bridge heartbeat...")
        # Send a sample verification frame to backend
        success = send_frame_to_backend("VEH-001", "VEH-001-ECU-01", "0x100", 8, "0B C2 04 6A 00 12 40 88", "COLLECTOR_INIT")
        if success:
            print("[AutoSOC Python Collector] Verification frame successfully dispatched to AutoSOC Detection Engine.")

if __name__ == "__main__":
    main()
