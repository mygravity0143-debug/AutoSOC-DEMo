#!/usr/bin/env bash
set -e

echo "========================================================="
echo "   AutoSOC - Virtual CAN (vcan0) Setup Script (Linux)    "
echo "========================================================="

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo "[!] Please run as root: sudo ./setup_vcan.sh"
  exit 1
fi

echo "[*] Loading kernel module 'vcan'..."
modprobe vcan

echo "[*] Adding virtual CAN link 'vcan0'..."
if ip link show vcan0 > /dev/null 2>&1; then
    echo "[*] Interface vcan0 already exists."
else
    ip link add dev vcan0 type vcan
fi

echo "[*] Bringing up vcan0..."
ip link set up vcan0

echo "[✓] Virtual CAN setup complete. Interface 'vcan0' is UP."
ip link show vcan0
