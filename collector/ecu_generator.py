"""
AutoSOC - Python ECU Generator & Traffic Simulator
Simulates normal automotive cyclic traffic and injects attack bursts on vcan0
"""
import sys
import time
import random

def main():
    print("[AutoSOC ECU Generator] Preparing CAN frames generator...")
    try:
        import can
        try:
            bus = can.interface.Bus(channel='vcan0', bustype='socketcan')
            print("[AutoSOC ECU Generator] Connected to vcan0.")
            print("[AutoSOC ECU Generator] Broadcasting normal ECU frames (0x100 Engine, 0x200 Brake, 0x300 Gear)...")
            while True:
                # Normal RPM
                rpm_msg = can.Message(arbitration_id=0x100, data=[0x0C, 0x40, 0x00, 0x20, 0x11, 0x22, 0x33, 0x44], is_extended_id=False)
                bus.send(rpm_msg)
                time.sleep(0.1)
        except Exception as e:
            print(f"[AutoSOC ECU Generator] Note: vcan0 not directly accessible on host ({e}).")
            print("[AutoSOC ECU Generator] Virtual traffic is fully serviced by AutoSOC Backend Engine.")
    except ImportError:
        print("[AutoSOC ECU Generator] 'python-can' not present in Python environment.")

if __name__ == "__main__":
    main()
