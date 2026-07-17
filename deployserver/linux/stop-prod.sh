#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

printf '[BookingBase Stop] Tat Cloudflare Tunnel va backend...\n'
systemctl --user stop bookingbase-tunnel.service bookingbase-backend.service 2>/dev/null || true

printf '[BookingBase Stop] Tat MySQL va Redis...\n'
docker compose -f "$ROOT_DIR/docker-compose.yml" --project-directory "$ROOT_DIR" stop db redis

backend_state="$(systemctl --user is-active bookingbase-backend.service 2>/dev/null || true)"
tunnel_state="$(systemctl --user is-active bookingbase-tunnel.service 2>/dev/null || true)"

printf '\nTrang thai sau khi tat:\n'
printf '  Backend: %s\n' "${backend_state:-inactive}"
printf '  Tunnel:  %s\n' "${tunnel_state:-inactive}"
docker compose -f "$ROOT_DIR/docker-compose.yml" --project-directory "$ROOT_DIR" ps db redis

if [[ "$backend_state" == active || "$tunnel_state" == active ]]; then
  printf '\n[BookingBase Stop] ERROR: Van con service dang chay.\n' >&2
  exit 1
fi

printf '\n[BookingBase Stop] Da tat BookingBase production.\n'

