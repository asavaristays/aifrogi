#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${AIFROGI_APP_DIR:-/var/www/lead-os-ai}"
cd "$APP_DIR"

set -a
[[ -f .env ]] && source .env
[[ -f .env.local ]] && source .env.local
set +a

if [[ -z "${AUTOMATION_CRON_SECRET:-}" ]]; then
  echo "AUTOMATION_CRON_SECRET is not configured" >&2
  exit 1
fi

curl --fail --silent --show-error \
  --request POST \
  --header "Authorization: Bearer ${AUTOMATION_CRON_SECRET}" \
  "http://127.0.0.1:3011/api/automation/run"
