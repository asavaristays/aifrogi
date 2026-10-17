#!/bin/sh
set -eu
: "${DATABASE_URL:?disposable owner database URL required}"
: "${AIFROGI_WEB_DATABASE_URL:?web role URL required}"
: "${AIFROGI_PUBLIC_DATABASE_URL:?public role URL required}"
: "${AIFROGI_WORKER_DATABASE_URL:?worker role URL required}"
: "${AIFROGI_PUBLISHER_DATABASE_URL:?publisher role URL required}"
case "$DATABASE_URL" in *p2b_rehearsal*) ;; *) echo 'refusing non-rehearsal database' >&2; exit 64;; esac
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
port=${P2B_ROUTE_PORT:-18088}
run_id="route-$(date +%s)"
log_file=$(mktemp "${TMPDIR:-/tmp}/aifrogi-p2b-route.XXXXXX")
body_file=$(mktemp "${TMPDIR:-/tmp}/aifrogi-p2b-route-body.XXXXXX")
cleanup(){ kill "$server_pid" >/dev/null 2>&1 || true; wait "$server_pid" >/dev/null 2>&1 || true; rm -f "$log_file" "$body_file"; }
trap cleanup EXIT HUP INT TERM

PORT="$port" HOSTNAME=127.0.0.1 AIFROGI_CANONICAL_SERVING_REQUIRED=1 AIFROGI_LEGACY_FACT_FALLBACK=0 AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_BUILD_ID=p2b-v6-route AIFROGI_ADMITTED_RELEASE_ID=p2b-v6-route WEBSITE_VISITOR_SESSION_SECRET='p2b-rehearsal-secret-with-sufficient-entropy' AUTH_SESSION_SECRET='p2b-rehearsal-auth-secret-with-sufficient-entropy' "$root_dir/node_modules/.bin/next" start >"$log_file" 2>&1 &
server_pid=$!
i=0
until curl -fsS "http://127.0.0.1:$port/api/health/live" >/dev/null 2>&1; do
  i=$((i+1)); test "$i" -lt 100 || { cat "$log_file" >&2; exit 1; }; sleep 0.1
done
before_count=$(psql "$DATABASE_URL" -Atqc "SELECT count(*) FROM \"RagAnswerReceipt\" WHERE \"propertyId\"='http-property' AND answer='Check-in is at 2 PM.' AND \"answerHash\"=encode(digest(convert_to(answer,'UTF8'),'sha256'),'hex') AND evidence @> '[{\"sourceId\":\"http-entry-form\"}]'::jsonb")
status=$(curl -sS -o "$body_file" -w '%{http_code}' -H 'content-type: application/json' --data "{\"sessionId\":\"$run_id\",\"message\":\"What time is check-in?\"}" "http://127.0.0.1:$port/api/public/website-bot/http-property")
test "$status" = 200 || { cat "$body_file" >&2; cat "$log_file" >&2; exit 1; }
grep -q '"answer":"Check-in is at 2 PM."' "$body_file" || { cat "$body_file" >&2; cat "$log_file" >&2; exit 1; }
grep -q '"grounded":true' "$body_file" || { cat "$body_file" >&2; cat "$log_file" >&2; exit 1; }
audit_count=$(psql "$DATABASE_URL" -Atqc "SELECT count(*) FROM \"RagAnswerReceipt\" WHERE \"propertyId\"='http-property' AND answer='Check-in is at 2 PM.' AND \"answerHash\"=encode(digest(convert_to(answer,'UTF8'),'sha256'),'hex') AND evidence @> '[{\"sourceId\":\"http-entry-form\"}]'::jsonb")
test "$audit_count" -gt "$before_count"
echo "PASS actual Next.js website route returned grounded canonical answer with $audit_count durable evidence-bound RAG receipt(s)"
