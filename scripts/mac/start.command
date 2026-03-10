#!/usr/bin/env bash

clear

echo "==================================================="
echo "    STARS LAW COLLEGE - STARTING SYSTEM"
echo "==================================================="
echo ""

cd "$(dirname "$0")/../.." || exit

echo "Starting Background Database Services (Docker)..."
npm run dev:infra

echo ""
echo "Starting Application Engine..."
echo "(A browser window will open automatically in a few seconds)"
echo "(DO NOT CLOSE THIS TERMINAL WINDOW)"
echo ""

# Open browser in the background after 5 seconds
(sleep 5 && open http://localhost:3000) &

# Start the servers
npm run dev
