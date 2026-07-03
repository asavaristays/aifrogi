#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${AIFROGI_MONITOR_URL:-https://app.aifrogi.com}"
ALERT_WEBHOOK_URL="${AIFROGI_ALERT_WEBHOOK_URL:-}"
TIMEOUT_SECONDS="${AIFROGI_MONITOR_TIMEOUT_SECONDS:-15}"
STATE_DIR="${AIFROGI_MONITOR_STATE_DIR:-/var/lib/aifrogi-monitor}"
STATE_FILE="${STATE_DIR}/state"

mkdir -p "$STATE_DIR"

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

http_code="$(curl --silent --show-error --max-time "$TIMEOUT_SECONDS" --output "$response_file" --write-out '%{http_code}' "${BASE_URL%/}/api/health/ready" || printf '000')"
status="down"
if [[ "$http_code" == "200" ]] && grep -q '"status":"ok"' "$response_file"; then
  status="up"
fi

previous="unknown"
[[ -f "$STATE_FILE" ]] && previous="$(cat "$STATE_FILE")"
printf '%s' "$status" > "$STATE_FILE"

if [[ "$status" == "up" ]]; then
  if [[ "$previous" == "down" ]] && [[ -n "$ALERT_WEBHOOK_URL" ]]; then
    curl --silent --show-error --max-time "$TIMEOUT_SECONDS" --request POST --header 'Content-Type: application/json' --data '{"text":"AiFrogi recovered: readiness checks are healthy."}' "$ALERT_WEBHOOK_URL" >/dev/null
  fi
  printf 'AiFrogi ready (%s)\n' "$http_code"
  exit 0
fi

body="$(tr '\n' ' ' < "$response_file" | cut -c1-500)"
if [[ "$previous" != "down" ]] && [[ -n "$ALERT_WEBHOOK_URL" ]]; then
  payload="$(printf '{"text":"AiFrogi alert: readiness failed with HTTP %s. %s"}' "$http_code" "${body//\"/\\\"}")"
  curl --silent --show-error --max-time "$TIMEOUT_SECONDS" --request POST --header 'Content-Type: application/json' --data "$payload" "$ALERT_WEBHOOK_URL" >/dev/null
fi
printf 'AiFrogi readiness failed (%s): %s\n' "$http_code" "$body" >&2
exit 1
