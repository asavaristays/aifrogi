#!/bin/sh
set -eu
: "${DATABASE_URL:?disposable owner database URL required}"
: "${AIFROGI_WEB_DATABASE_URL:?web role URL required}"
: "${AIFROGI_PUBLIC_DATABASE_URL:?public role URL required}"
: "${AIFROGI_WORKER_DATABASE_URL:?worker role URL required}"
: "${AIFROGI_PUBLISHER_DATABASE_URL:?publisher role URL required}"
case "$DATABASE_URL" in *p2b_rehearsal*) ;; *) echo 'refusing non-rehearsal database' >&2; exit 64;; esac
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
nginx_bin=${AIFROGI_NGINX_BIN:-$(command -v nginx)}
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/aifrogi-p2b-staging.XXXXXX")
app_port=${P2B_ROUTE_PORT:-18088}
edge_port=${P2B_EDGE_PORT:-18089}
cleanup(){
  if test -f "$work_dir/nginx.pid"; then "$nginx_bin" -s quit -c "$work_dir/nginx.conf" >/dev/null 2>&1 || true; fi
  kill "$app_pid" >/dev/null 2>&1 || true; wait "$app_pid" >/dev/null 2>&1 || true
  rm -rf "$work_dir"
}
trap cleanup EXIT HUP INT TERM
mkdir -p "$work_dir/logs" "$work_dir/admitted"
printf 'set $aifrogi_release_admitted 0;\n' > "$work_dir/admission.conf"
cat > "$work_dir/nginx.conf" <<EOF
pid $work_dir/nginx.pid;
error_log $work_dir/logs/error.log;
events {}
http {
  access_log off;
  map \$request_uri \$aifrogi_canonical_route { default 0; ~^/api/public/website-bot/ 1; ~^/api/public/hotelgpt/ 1; ~^/api/automation/run 1; }
  map "\$aifrogi_canonical_route:\$aifrogi_release_admitted" \$aifrogi_gate_denied { default 0; "1:0" 1; }
  server {
    listen 127.0.0.1:$edge_port;
    include $work_dir/admission.conf;
    if (\$aifrogi_gate_denied) { return 503; }
    location / { proxy_pass http://127.0.0.1:$app_port; proxy_set_header Host \$host; }
  }
}
EOF
PORT="$app_port" HOSTNAME=127.0.0.1 AIFROGI_CANONICAL_SERVING_REQUIRED=1 AIFROGI_LEGACY_FACT_FALLBACK=0 AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_BUILD_ID=p2b-v6-staging AIFROGI_ADMITTED_RELEASE_ID=p2b-v6-staging WEBSITE_VISITOR_SESSION_SECRET='p2b-rehearsal-secret-with-sufficient-entropy' AUTH_SESSION_SECRET='p2b-rehearsal-auth-secret-with-sufficient-entropy' "$root_dir/node_modules/.bin/next" start >"$work_dir/app.log" 2>&1 &
app_pid=$!
i=0
until curl -fsS "http://127.0.0.1:$app_port/api/health/live" >/dev/null 2>&1; do i=$((i+1)); test "$i" -lt 100 || { cat "$work_dir/app.log" >&2; exit 1; }; sleep 0.1; done
"$nginx_bin" -t -c "$work_dir/nginx.conf" >/dev/null
"$nginx_bin" -c "$work_dir/nginx.conf"
route="http://127.0.0.1:$edge_port/api/public/website-bot/http-property"
request(){ curl -sS -o "$work_dir/body" -w '%{http_code}' -H 'content-type: application/json' --data "{\"sessionId\":\"$1\",\"message\":\"What time is check-in?\"}" "$route"; }
test "$(request edge-closed)" = 503
echo 'PASS real factual application route is closed at nginx before admission'

cp "$root_dir/.next/BUILD_ID" "$work_dir/release"
release_hash=$(openssl dgst -sha256 "$work_dir/release" | sed 's/^.*= //')
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$work_dir/private.pem" >/dev/null 2>&1
openssl pkey -in "$work_dir/private.pem" -pubout -out "$work_dir/public.pem" >/dev/null 2>&1
printf '%s\n' 'RELEASE_ID=p2b-v6-staging' 'CANONICAL_SERVING_CONTRACT=1' "RELEASE_SHA256=$release_hash" > "$work_dir/manifest"
printf '%s\n' 'RELEASE_ID=p2b-v6-staging' "RELEASE_SHA256=$release_hash" > "$work_dir/current-release"
openssl dgst -sha256 -sign "$work_dir/private.pem" -out "$work_dir/signature" "$work_dir/manifest"
AIFROGI_RELEASE_ARCHIVE="$work_dir/release" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_ACTIVE_RELEASE_FILE="$work_dir/current-release" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null
sleep 0.2
test "$(request edge-open)" = 200
grep -q '"answer":"Check-in is at 2 PM."' "$work_dir/body"
grep -q '"grounded":true' "$work_dir/body"
echo 'PASS signed admission opened nginx and the real route returned a grounded canonical answer'

printf 'set $aifrogi_release_admitted 0;\n' > "$work_dir/admission.closed"
mv "$work_dir/admission.closed" "$work_dir/admission.conf"
"$nginx_bin" -t -c "$work_dir/nginx.conf" >/dev/null
"$nginx_bin" -s reload -c "$work_dir/nginx.conf"
sleep 0.2
test "$(request restore-closed)" = 503
echo 'PASS restore barrier re-closed the real factual route'
