#!/bin/bash
# Startet Backend + Expo mit automatisch erkannter LAN-IP fuer physisches Geraet.
# Die App leitet die Backend-URL zur Laufzeit aus REACT_NATIVE_PACKAGER_HOSTNAME
# bzw. Constants.expoConfig.hostUri ab — keine Env-Vars noetig.

# Probiert alle gaengigen Interfaces: WLAN (en0), Ethernet/Thunderbolt (en1..en9),
# iPhone-USB-Tethering (oft en4-en7) und Hotspot-Bridges (bridge100+).
# Ueberschreibbar via DEV_LAN_IP=192.168.x.x npm run dev
LAN_IP="${DEV_LAN_IP:-}"

if [ -z "$LAN_IP" ]; then
  for IFACE in en0 en1 en2 en3 en4 en5 en6 en7 en8 en9 bridge100 bridge101; do
    IP=$(ipconfig getifaddr "$IFACE" 2>/dev/null)
    # Fallback: ipconfig liefert nichts fuer "constrained" Interfaces
    # (z.B. iPhone-USB-Tethering) — direkt aus ifconfig parsen
    if [ -z "$IP" ]; then
      IP=$(ifconfig "$IFACE" 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}')
    fi
    if [ -n "$IP" ]; then
      LAN_IP="$IP"
      FOUND_IFACE="$IFACE"
      break
    fi
  done
fi

if [ -z "$LAN_IP" ]; then
  echo "Fehler: Keine Netzwerk-IP gefunden."
  echo ""
  echo "Aktive Interfaces:"
  ifconfig | grep -E "^[a-z]|inet " | grep -B1 "inet " | grep -v "127.0.0.1"
  echo ""
  echo "Tipp: Setze die IP manuell:"
  echo "  DEV_LAN_IP=192.168.x.x npm run dev"
  exit 1
fi

echo "Interface: ${FOUND_IFACE:-manuell}"

echo "Verwende LAN-IP: $LAN_IP (Backend: http://${LAN_IP}:3000)"
echo "Dein Geraet muss im selben WLAN sein."
echo ""

export REACT_NATIVE_PACKAGER_HOSTNAME="${LAN_IP}"

cd "$(dirname "$0")/.."
npm run build:shared

# Backend im Hintergrund — Output mit [backend] Prefix in dasselbe Terminal
npm run dev -w backend 2>&1 | sed -u 's/^/[backend] /' &
BACKEND_PID=$!

# Sicherstellen, dass Backend mitstirbt wenn das Skript endet
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT

# Expo im VORDERGRUND mit echtem TTY → QR-Code + Tastatur-Shortcuts (?, r, m) funktionieren
cd app
exec npx expo start --clear
