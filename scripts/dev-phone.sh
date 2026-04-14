#!/bin/bash
# Startet Backend + Expo mit automatisch erkannter LAN-IP fuer physisches Geraet

LAN_IP=$(ipconfig getifaddr en0 2>/dev/null)

if [ -z "$LAN_IP" ]; then
  echo "Keine WLAN-Verbindung gefunden. Versuche Ethernet..."
  LAN_IP=$(ipconfig getifaddr en1 2>/dev/null)
fi

if [ -z "$LAN_IP" ]; then
  echo "Fehler: Keine Netzwerk-IP gefunden. Bist du mit dem WLAN verbunden?"
  exit 1
fi

echo "Verwende LAN-IP: $LAN_IP"
echo "Dein Geraet muss im selben Netzwerk sein."
echo ""

export EXPO_PUBLIC_API_URL="http://${LAN_IP}:3000/api/v1"
export EXPO_PUBLIC_SOCKET_URL="http://${LAN_IP}:3000"

cd "$(dirname "$0")/.."
npm run build:shared
npx concurrently -n backend,app -c green,magenta \
  "npm run dev -w backend" \
  "npm run start -w app"
