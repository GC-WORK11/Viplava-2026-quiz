#!/usr/bin/env bash
# Viplava 2026 Quiz — offline LAN event launcher.
#
# Setup:
#   1. Turn on the JioFi / WiFi router (NO internet needed — the WiFi alone works).
#      In the router admin page make sure "AP Isolation"/"Client Isolation" is OFF.
#   2. Connect this laptop to that WiFi.
#   3. Run:  ./start-event.sh
#   4. Contestants join the same WiFi and scan the on-screen QR code,
#      or open:  http://<this-laptop-ip>:3000/?view=participant
set -e
cd "$(dirname "$0")"

export PORT="${PORT:-3000}"

echo "=== Contestant join URLs (this laptop's LAN IPs) ==="
if command -v ip >/dev/null 2>&1; then
  ip -4 addr show 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {print $2}' | cut -d/ -f1 | while read -r ip; do
    echo "  http://$ip:$PORT/?view=participant"
  done
else
  ipconfig getifaddr en0 2>/dev/null | while read -r ip; do
    echo "  http://$ip:$PORT/?view=participant"
  done
fi
echo "===================================================="

# Open the firewall port where possible (Linux ufw / firewalld).
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow "$PORT"/tcp >/dev/null 2>&1 || echo "Note: if phones can't connect, allow port $PORT in the firewall"
elif command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --add-port="$PORT"/tcp >/dev/null 2>&1 || true
fi

# Install deps if needed
if [ ! -d node_modules ]; then
  if command -v bun >/dev/null 2>&1; then bun install; else npm install; fi
fi

# Build if there's no standalone bundle yet
if [ ! -f .next/standalone/server.js ]; then
  echo "Building production bundle..."
  NODE_ENV=production npx next build
fi
# output:standalone doesn't bundle .next/static — copy it in or the UI 404s.
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

echo "Starting quiz server on 0.0.0.0:$PORT — press Ctrl+C to stop."
echo "Host console:     http://localhost:$PORT/?view=host"
echo "Projector screen: http://localhost:$PORT/?view=presenter&standalone=true"
# QUIZ_PERSIST=1 keeps scores/questions in quiz-state.json so a laptop crash
# mid-event doesn't lose the game — just relaunch this script to restore.
QUIZ_PERSIST=1 HOSTNAME=0.0.0.0 NODE_ENV=production exec node .next/standalone/server.js
