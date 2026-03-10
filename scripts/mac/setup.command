#!/usr/bin/env bash

# Clear terminal
clear

echo "==================================================="
echo "    STARS LAW COLLEGE - INITIAL SYSTEM SETUP"
echo "==================================================="
echo ""
echo "Please ensure Docker Desktop is OPEN and RUNNING."
echo "Press Enter to continue, or Ctrl+C to cancel."
read -p " "

echo ""
echo "[1/4] Installing Required Core Dependencies..."
cd "$(dirname "$0")/../.." || exit
npm install
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install Node.js dependencies."
    echo "Please ensure Node.js is installed on your Mac."
    exit 1
fi

echo ""
echo "[2/4] Initializing Background Database Engines..."
npm run dev:infra
sleep 5

echo ""
echo "[3/4] Preparing Database Schema..."
npx prisma generate
npx prisma db push --accept-data-loss

echo ""
echo "[4/4] Setup Complete!"
echo ""
echo "==================================================="
echo "  SYSTEM IS READY!"
echo "  You can now close this window and use the "
echo "  Start SLC System alias to launch the app."
echo "==================================================="
echo ""
