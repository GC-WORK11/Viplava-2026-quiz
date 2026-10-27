#!/usr/bin/env bash
# Emergency fallback: if the router blocks phone->laptop traffic (AP isolation),
# make THIS laptop the WiFi network — no router needed at all.
#   ./testing/hotspot.sh      -> creates "ViplavaTest" WiFi on the laptop
#   ./testing/hotspot.sh off  -> back to TP-Link_40F8_5G
# Phone then reaches the quiz at http://10.42.0.1:3100/?view=participant
set -e
IF="wlp2s0"

if [ "${1:-}" = "off" ]; then
  nmcli dev disconnect "$IF" || true
  sleep 1
  nmcli dev wifi connect "TP-Link_40F8_5G" password "91850782" || true
  exit 0
fi

echo "Turning laptop WiFi into a hotspot (drops TP-Link connection)..."
nmcli dev wifi hotspot ifname "$IF" ssid "ViplavaTest" password "harekrishna"
sleep 2
IP=$(ip -4 addr show "$IF" | awk '/inet / {print $2}' | cut -d/ -f1 | head -1)
echo "Hotspot up. Connect phone to WiFi 'ViplavaTest' (pass: harekrishna)"
echo "Quiz join URL:  http://${IP:-10.42.0.1}:${PORT:-3100}/?view=participant"
