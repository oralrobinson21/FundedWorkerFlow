#!/bin/bash

# FundedWorkerFlow Development Environment Startup Script

echo "========================================"
echo "Starting FundedWorkerFlow Development Environment..."
echo "========================================"

# Auto-detect local IP address
if command -v ip &> /dev/null; then
  LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' | head -n1)
else
  LOCAL_IP=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
fi

if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

echo "Detected local IP: $LOCAL_IP"
echo "Backend will be available at: http://$LOCAL_IP:5001"
echo ""

# Kill old processes
echo "Killing old processes on ports 5001, 8081-8084..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
for PORT in 8081 8082 8083 8084; do
  lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
done
echo "✓ Killed old processes"
echo ""

# Check PM2 installation
if ! command -v pm2 &> /dev/null; then
  echo "❌ PM2 not installed. Install with: npm install -g pm2"
  exit 1
fi
echo "✓ PM2 found, proceeding..."
echo ""

# Create logs directory
if [ ! -d "./logs" ]; then
  mkdir -p ./logs
  echo "✓ Created logs directory at ./logs"
else
  echo "✓ Logs directory ready at ./logs"
fi
echo ""

# Load backend environment
if [ ! -f "./backend/.env" ]; then
  echo "⚠️  WARNING: backend/.env not found"
  echo "   Copy from backend/.env.example and add your real API keys"
  echo ""
else
  echo "✓ Backend environment file found"
fi
export BACKEND_PORT=5001
echo ""

# Delete old PM2 process if exists
pm2 delete fundedworker-backend 2>/dev/null || true

# Start backend via PM2
echo "Starting backend via PM2..."
cd /workspace/cmivy376600jxilr3ndils778/FundedWorkerFlow
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
  echo "✓ Backend started via PM2"
  echo ""
  pm2 status
  echo ""
  echo "View logs with: pm2 logs fundedworker-backend"
  echo "Stop backend with: pm2 stop fundedworker-backend"
  echo ""
else
  echo "❌ Failed to start backend"
  pm2 logs fundedworker-backend --err --lines 20
  exit 1
fi

# Trap Ctrl+C to display helpful message
trap 'echo ""; echo "Stopping Expo... (PM2 backend still running)"; echo "Stop backend with: pm2 stop fundedworker-backend"; exit 0' INT

# Start Expo frontend
echo "Starting Expo frontend..."
export EXPO_PUBLIC_API_URL=http://$LOCAL_IP:5001
npx expo start --tunnel

# If Expo exits normally
echo ""
echo "Expo stopped. PM2 backend still running."
echo "Stop backend with: pm2 stop fundedworker-backend"
