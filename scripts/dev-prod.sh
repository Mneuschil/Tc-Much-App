#!/bin/bash
# Startet NUR Expo (kein lokales Backend, kein ngrok) — App spricht
# direkt das Production-Backend auf https://app-api.tcmuch.de an.
#
# Empfohlen seit dem Hetzner-Deployment (Schritt 3 der Roadmap), weil:
#   - Funktioniert in jedem Netzwerk (LTE, Hotspot, WLAN)
#   - Keine ngrok-/Tunnel-Fummelei noetig
#   - Echte Production-Daten und -Latenz beim Test
#
# Wann NICHT nutzen:
#   - Du willst lokale Backend-Aenderungen testen → "npm run dev:online"
#
# Voraussetzungen:
#   - https://app-api.tcmuch.de erreichbar (siehe SERVER_SETUP.md)
#   - Expo Go auf dem iPhone

set -e

cd "$(dirname "$0")/.."

# Sicherheitshalber alte Expo-Prozesse + Ports killen
lsof -ti:8081,8082 2>/dev/null | xargs kill -9 2>/dev/null || true
pkill -9 -f "expo start" 2>/dev/null || true
pkill -9 -f "metro" 2>/dev/null || true
sleep 1

# Health-Check: stellt sicher dass Backend wirklich erreichbar ist
echo "[setup] Pruefe Production-Backend..."
if ! curl -sf https://app-api.tcmuch.de/api/v1/health >/dev/null; then
  echo ""
  echo "FEHLER: https://app-api.tcmuch.de/api/v1/health antwortet nicht."
  echo "Pruefe:"
  echo "  - Internet-Verbindung"
  echo "  - Server-Status: ssh root@91.99.164.240 'pm2 list'"
  exit 1
fi
echo "[setup] Backend OK."

echo ""
echo "================================================================"
echo " Backend:  https://app-api.tcmuch.de"
echo " Modus:    Expo --tunnel (App spricht Backend direkt uebers Netz)"
echo "================================================================"
echo ""

cd app
exec env EXPO_PUBLIC_API_HOST="https://app-api.tcmuch.de" \
  npx expo start --tunnel --clear
