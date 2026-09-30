#!/bin/sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
nginx_bin=${AIFROGI_NGINX_BIN:-$(command -v nginx)}
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/aifrogi-p2b-edge.XXXXXX")
nginx_pid="$work_dir/nginx.pid"
cleanup() {
  if test -f "$nginx_pid"; then "$nginx_bin" -s quit -c "$work_dir/nginx.conf" >/dev/null 2>&1 || true; fi
  rm -rf "$work_dir"
}
trap cleanup EXIT HUP INT TERM

mkdir -p "$work_dir/logs" "$work_dir/admitted"
printf 'candidate-build\n' > "$work_dir/release.tar"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$work_dir/private.pem" >/dev/null 2>&1
openssl pkey -in "$work_dir/private.pem" -pubout -out "$work_dir/public.pem" >/dev/null 2>&1
release_hash=$(openssl dgst -sha256 "$work_dir/release.tar" | sed 's/^.*= //')
printf '%s\n' 'RELEASE_ID=p2b-v6-test' 'CANONICAL_SERVING_CONTRACT=1' "RELEASE_SHA256=$release_hash" > "$work_dir/manifest"
printf '%s\n' 'RELEASE_ID=p2b-v6-test' "RELEASE_SHA256=$release_hash" > "$work_dir/current-release"
export AIFROGI_ACTIVE_RELEASE_FILE="$work_dir/current-release"
openssl dgst -sha256 -sign "$work_dir/private.pem" -out "$work_dir/signature" "$work_dir/manifest"
printf 'set $aifrogi_release_admitted 0;\n' > "$work_dir/admission.closed"
mv "$work_dir/admission.closed" "$work_dir/admission.conf"
cat > "$work_dir/nginx.conf" <<EOF
pid $nginx_pid;
error_log $work_dir/logs/error.log;
events {}
http {
  access_log off;
  map \$request_uri \$aifrogi_canonical_route { default 0; ~^/api/public/website-bot/ 1; ~^/api/public/hotelgpt/ 1; ~^/api/automation/run 1; }
  map "\$aifrogi_canonical_route:\$aifrogi_release_admitted" \$aifrogi_gate_denied { default 0; "1:0" 1; }
  server {
    listen 127.0.0.1:18086;
    include $work_dir/admission.conf;
    if (\$aifrogi_gate_denied) { return 503; }
    location / { return 204; }
  }
}
EOF
"$nginx_bin" -t -c "$work_dir/nginx.conf" >/dev/null
"$nginx_bin" -c "$work_dir/nginx.conf"
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/about)" = 204
echo 'PASS factual edge closed while release is not admitted'

printf 'not-a-valid-signature\n' > "$work_dir/bad-signature"
if AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/bad-signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null 2>&1; then exit 1; fi
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
echo 'PASS invalid signature rejected and factual edge stayed closed'

printf '%s\n' 'RELEASE_ID=p2b-v5-old' 'CANONICAL_SERVING_CONTRACT=0' "RELEASE_SHA256=$release_hash" > "$work_dir/old-manifest"
openssl dgst -sha256 -sign "$work_dir/private.pem" -out "$work_dir/old-signature" "$work_dir/old-manifest"
if AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/old-manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/old-signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null 2>&1; then exit 1; fi
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
echo 'PASS old-build contract rejected and factual edge stayed closed'

printf '%s\n' 'RELEASE_ID=some-other-release' "RELEASE_SHA256=$release_hash" > "$work_dir/current-release"
if AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null 2>&1; then exit 1; fi
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
echo 'PASS signed candidate rejected when it is not the active deployed release'
printf '%s\n' 'RELEASE_ID=p2b-v6-test' "RELEASE_SHA256=$release_hash" > "$work_dir/current-release"

cat > "$work_dir/nginx-fail-reload" <<EOF
#!/bin/sh
case "\$*" in *'-s reload'*) exit 93;; esac
exec "$nginx_bin" "\$@"
EOF
chmod +x "$work_dir/nginx-fail-reload"
if AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$work_dir/nginx-fail-reload" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null 2>&1; then exit 1; fi
grep -q 'aifrogi_release_admitted 0' "$work_dir/admission.conf"
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
echo 'PASS failed nginx reload restores the closed setting on disk and active edge stays closed'

AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null
sleep 0.2
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 204
test -r "$work_dir/admitted/p2b-v6-test"
echo 'PASS signed compatible build admitted and factual edge opened'

# Restore barrier: the operator closes the factual edge before restoring. An
# old build still cannot reopen it; only the signed compatible build can.
printf 'set $aifrogi_release_admitted 0;\n' > "$work_dir/admission.closed"
mv "$work_dir/admission.closed" "$work_dir/admission.conf"
"$nginx_bin" -t -c "$work_dir/nginx.conf" >/dev/null
"$nginx_bin" -s reload -c "$work_dir/nginx.conf"
sleep 0.2
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
if AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/old-manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/old-signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null 2>&1; then exit 1; fi
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 503
echo 'PASS restore barrier kept factual edge closed for old build'
AIFROGI_RELEASE_ARCHIVE="$work_dir/release.tar" AIFROGI_RELEASE_MANIFEST="$work_dir/manifest" AIFROGI_RELEASE_SIGNATURE="$work_dir/signature" AIFROGI_RELEASE_PUBLIC_KEY="$work_dir/public.pem" AIFROGI_REQUIRED_SERVING_CONTRACT=1 AIFROGI_ADMISSION_DIR="$work_dir/admitted" AIFROGI_NGINX_INCLUDE="$work_dir/admission.conf" AIFROGI_NGINX_BIN="$nginx_bin" AIFROGI_NGINX_CONFIG="$work_dir/nginx.conf" AIFROGI_DEPLOYMENT_TEST_MODE=1 "$root_dir/ops/p2b-deployment-admission.sh" >/dev/null
sleep 0.2
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18086/api/public/website-bot/test)" = 204
echo 'PASS restore barrier reopened only for signed compatible build'
