#!/bin/bash
# Startet Backend + ngrok + Expo Tunnel.
# iPhone braucht nur Internet (auch LTE) — kein gemeinsames WLAN noetig.
#
# Voraussetzungen (einmalig):
#   brew install ngrok
#   ngrok config add-authtoken <token>   # https://dashboard.ngrok.com/get-started/your-authtoken
#   cd app && npx expo install @expo/ngrok

set -e

# Explizit das brew-installierte ngrok v3 nehmen — npm setzt node_modules/.bin
# in PATH vorne und @expo/ngrok bringt eine alte v2 mit, die andere Config-Pfade
# nutzt und mit dem v3-authtoken nicht klarkommt.
NGROK_BIN=""
for CANDIDATE in /opt/homebrew/bin/ngrok /usr/local/bin/ngrok "$(command -v ngrok 2>/dev/null)"; do
  if [ -x "$CANDIDATE" ]; then
    NGROK_BIN="$CANDIDATE"
    break
  fi
done

if [ -z "$NGROK_BIN" ]; then
  echo "Fehler: ngrok ist nicht installiert."
  echo "  brew install ngrok"
  echo "  ngrok config add-authtoken <token>"
  exit 1
fi
echo "[setup] Verwende ngrok: $NGROK_BIN"

cd "$(dirname "$0")/.."
npm run build:shared

# Backend starten
echo "[setup] Starte Backend..."
npm run dev -w backend 2>&1 | sed -u 's/^/[backend] /' &
BACKEND_PID=$!

# Auf Backend warten (max 30s)
echo "[setup] Warte auf Backend auf Port 3000..."
for i in {1..30}; do
  if curl -sf http://localhost:3000/api/v1/health >/dev/null 2>&1; then
    echo "[setup] Backend ist bereit."
    break
  fi
  sleep 1
done

# ngrok im Hintergrund + URL aus dem ngrok-API abgreifen
echo "[setup] Starte ngrok-Tunnel fuer Backend..."
"$NGROK_BIN" http 3000 --log=stdout > /tmp/ngrok-tcmuch.log 2>&1 &
NGROK_PID=$!

# Cleanup-Trap
trap "echo '[setup] Stoppe alles...'; kill $BACKEND_PID $NGROK_PID 2>/dev/null; exit" INT TERM EXIT

# Auf ngrok warten und Public-URL holen
NGROK_URL=""
for i in {1..20}; do
  sleep 1
  NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || true)
  if [ -n "$NGROK_URL" ]; then break; fi
done

if [ -z "$NGROK_URL" ]; then
  echo "Fehler: ngrok-URL konnte nicht ermittelt werden. Log:"
  tail -20 /tmp/ngrok-tcmuch.log
  exit 1
fi

echo ""
echo "================================================================"
echo " Backend public:  $NGROK_URL"
echo " Health-Check:    $NGROK_URL/api/v1/health"
echo "================================================================"
echo ""

# Expo mit der oeffentlichen Backend-URL starten — Tunnel-Modus fuer das Bundle
cd app
exec env EXPO_PUBLIC_API_HOST="$NGROK_URL" npx expo start --tunnel --clear
