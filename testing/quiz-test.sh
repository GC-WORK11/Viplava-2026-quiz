#!/usr/bin/env bash
# One-command OFFLINE quiz test rig — completely isolated from the real event.
#   ./testing/quiz-test.sh         -> start server (if needed), load dummy
#                                   questions, print join QR in the terminal
#   ./testing/quiz-test.sh fresh   -> same but wipes the test save first
#   ./testing/quiz-test.sh stop    -> stop the background server
#   PORT=3200 ./testing/quiz-test.sh
#
# Test mode differences vs the real event (via env, main codebase untouched):
#   - timers set to 600s (no time pressure while testing)
#   - state saves to testing/quiz-test-state.json, NOT the event quiz-state.json
set -e
cd "$(dirname "$0")/.."

export PORT="${PORT:-3100}"
export QUIZ_PERSIST=1
export QUIZ_STATE_FILE="$PWD/testing/quiz-test-state.json"
export QUIZ_R1_SECONDS="${QUIZ_R1_SECONDS:-600}"
export QUIZ_PASS_SECONDS="${QUIZ_PASS_SECONDS:-600}"
export QUIZ_R2_SECONDS="${QUIZ_R2_SECONDS:-600}"
export QUIZ_R3_SECONDS="${QUIZ_R3_SECONDS:-600}"
export QUIZ_TB_SECONDS="${QUIZ_TB_SECONDS:-600}"

BASE="http://localhost:$PORT"
PIDFILE="testing/.quiz-test.pid"

if [ "${1:-}" = "stop" ]; then
  [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null && echo "Stopped."
  rm -f "$PIDFILE"; exit 0
fi
if [ "${1:-}" = "fresh" ]; then rm -f "$QUIZ_STATE_FILE"; fi

if curl -s -o /dev/null --max-time 2 "$BASE/api/quiz"; then
  echo "Server already running on :$PORT"
else
  [ -d node_modules ] || { command -v bun >/dev/null && bun install || npm install; }
  [ -f .next/standalone/server.js ] || NODE_ENV=production npx next build
  # output:standalone doesn't bundle .next/static — copy it in or the UI 404s.
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
  echo "Starting quiz server on 0.0.0.0:$PORT ..."
  HOSTNAME=0.0.0.0 NODE_ENV=production nohup node .next/standalone/server.js > testing/.quiz-test.log 2>&1 &
  echo $! > "$PIDFILE"
  for i in $(seq 1 30); do
    curl -s -o /dev/null --max-time 2 "$BASE/api/quiz" && break; sleep 1
  done
fi

curl -s -X POST "$BASE/api/quiz" -H 'Content-Type: application/json' \
  -d "$(python3 -c "import json;print(json.dumps({'action':'bulk_update_all_questions','payload':json.load(open('testing/questions.json'))}))")" \
  > /dev/null && echo "Test questions loaded (5 Gita buzzer MCQs + rounds)."

# QR must encode the LAN-reachable URL, not localhost — qr.mjs picks the best
# local interface (192.168.x preferred) unless a URL is passed explicitly.
LAN_IP=$(ip -4 addr show 2>/dev/null | awk '/inet / && $2 !~ /^127\./ && $2 ~ /^192\.168\./ {print $2}' | cut -d/ -f1 | head -1)
LAN_IP=${LAN_IP:-$(ip -4 addr show 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {print $2}' | cut -d/ -f1 | head -1)}
node testing/qr.mjs "http://${LAN_IP:-<LAN-IP>}:$PORT/?view=participant"
echo "Host console:     $BASE/?view=host   (passcode: 108)"
echo "Projector screen: $BASE/?view=presenter&standalone=true"
echo "Stop with:        ./testing/quiz-test.sh stop"
