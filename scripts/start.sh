#!/usr/bin/env bash
set -e

echo "========================================================="
echo "   AutoSOC - Unified Launch Script                       "
echo "========================================================="

# Start backend
echo "[*] Starting AutoSOC Backend on http://localhost:5000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "[*] Starting AutoSOC Frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Start python collector in background
echo "[*] Starting Python CAN Collector..."
python3 collector/can_collector.py &
COLLECTOR_PID=$!

echo "========================================================="
echo "   AutoSOC is running!                                   "
echo "   Frontend: http://localhost:5173                       "
echo "   Backend:  http://localhost:5000                       "
echo "   Press Ctrl+C to shutdown all services.                "
echo "========================================================="

trap "kill $BACKEND_PID $FRONTEND_PID $COLLECTOR_PID" SIGINT SIGTERM
wait
