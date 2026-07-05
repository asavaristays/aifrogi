#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${AIFROGI_APP_DIR:-/var/www/lead-os-ai}"
cd "$APP_DIR"

if [[ -z "${AUTOMATION_CRON_SECRET:-}" && -f .env.local ]]; then
  AUTOMATION_CRON_SECRET="$(sed -n 's/^AUTOMATION_CRON_SECRET=//p' .env.local | tail -n 1)"
fi

if [[ -z "${AUTOMATION_CRON_SECRET:-}" ]]; then
  echo "AUTOMATION_CRON_SECRET is not configured" >&2
  exit 1
fi

curl --fail --silent --show-error \
  --request POST \
  --header "Authorization: Bearer ${AUTOMATION_CRON_SECRET}" \
  "http://127.0.0.1:3011/api/automation/run"
