#!/bin/sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
nginx_bin=${AIFROGI_NGINX_BIN:-$(command -v nginx)}
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/aifrogi-p2b-canary.XXXXXX")
pid_file="$work_dir/nginx.pid"
cleanup(){ if test -f "$pid_file"; then "$nginx_bin" -s quit -c "$work_dir/nginx.conf" >/dev/null 2>&1 || true; fi; rm -rf "$work_dir"; }
trap cleanup EXIT HUP INT TERM
mkdir -p "$work_dir/logs" "$work_dir/admitted"
printf 'set $aifrogi_release_admitted 0;\n' > "$work_dir/admission.conf"
printf 'set $aifrogi_canary_required 1;\n' > "$work_dir/canary-mode.conf"
printf '192.0.2.10/32 1;\n' > "$work_dir/canary-allow-cidrs.conf"
cat > "$work_dir/nginx.conf" <<EOF
pid $pid_file;
error_log $work_dir/logs/error.log;
events {}
http {
 access_log off;
 map \$request_uri \$aifrogi_canonical_route { default 0; ~^/api/public/website-bot/ 1; ~^/api/public/hotelgpt/ 1; ~^/api/automation/run 1; }
 map "\$aifrogi_canonical_route:\$aifrogi_release_admitted" \$aifrogi_gate_denied { default 0; "1:0" 1; }
 geo \$aifrogi_canary_allowed { default 0; include $work_dir/canary-allow-cidrs.conf; }
 map "\$aifrogi_canonical_route:\$aifrogi_canary_required:\$aifrogi_canary_allowed" \$aifrogi_canary_denied { default 0; "1:1:0" 1; }
 map "\$aifrogi_gate_denied:\$aifrogi_canary_denied" \$aifrogi_factual_denied { default 0; "1:0" 1; "0:1" 1; "1:1" 1; }
 server { listen 127.0.0.1:18089; set_real_ip_from 127.0.0.1; real_ip_header X-Test-Client-IP; include $work_dir/admission.conf; include $work_dir/canary-mode.conf; if (\$aifrogi_factual_denied) { return 503; } location / { return 204; } }
}
EOF
"$nginx_bin" -t -c "$work_dir/nginx.conf" >/dev/null
"$nginx_bin" -c "$work_dir/nginx.conf"
factual=http://127.0.0.1:18089/api/public/website-bot/canary
test "$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'X-Test-Client-IP: 192.0.2.10' "$factual")" = 503
test "$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'X-Test-Client-IP: 198.51.100.77' "$factual")" = 503
echo 'PASS gate closed for allowlisted and non-allowlisted sources before admission'

printf 'candidate\n' > "$work_dir/release"
release_hash=$(openssl dgst -sha256 "$work_dir/release" | sed 's/^.*= //')
printf '%s\n' 'RELEASE_ID=p2b-canary-test' 'CANONICAL_SERVING_CONTRACT=1' "RELEASE_SHA256=$release_hash" > "$work_dir/manifest"
printf '%s\n' 'RELEASE_ID=p2b-canary-test' "RELEASE_SHA256=$release_hash" > "$work_dir/current-release"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$work_dir/private.pem" >/dev/null 2>&1
openssl pkey -in "$work_dir/private.pem" -pubout -out "$work_dir/public.pem" >/dev/null 2>&1
openssl dgst -sha256 -sign "$work_dir/private.pem" -out "$work_dir/signature" "$work_dir/manifest"
AIFROGI_RELEASE_ARCHIVE="$work_dir/release" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_ACTIVE_RELEASE_FILE="$work_dir/current-release" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null
sleep 0.2
test "$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'X-Test-Client-IP: 192.0.2.10' "$factual")" = 204
test "$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'X-Test-Client-IP: 198.51.100.77' "$factual")" = 503
test "$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'X-Test-Client-IP: 198.51.100.77' http://127.0.0.1:18089/about)" = 204
echo 'PASS after admission only allowlisted canary source reaches factual route; other factual traffic remains 503'

printf 'set $aifrogi_canary_required 0;\n' > "$work_dir/canary-mode.tmp"
mv "$work_dir/canary-mode.tmp" "$work_dir/canary-mode.conf"
"$nginx_bin" -t -c "$work_dir/nginx.conf" >/dev/null
"$nginx_bin" -s reload -c "$work_dir/nginx.conf"
sleep 0.2
test "$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'X-Test-Client-IP: 198.51.100.77' "$factual")" = 204
echo 'PASS separately approved canary expansion disables source restriction without changing release admission'
