#!/bin/sh
set -eu
: "${AIFROGI_RELEASE_ARCHIVE:?immutable release archive required}"
: "${AIFROGI_RELEASE_MANIFEST:?signed manifest required}"
: "${AIFROGI_RELEASE_SIGNATURE:?manifest signature required}"
: "${AIFROGI_RELEASE_PUBLIC_KEY:=/etc/aifrogi/release-signing-public.pem}"
: "${AIFROGI_REQUIRED_SERVING_CONTRACT:?required contract required}"
: "${AIFROGI_ADMISSION_DIR:=/var/lib/aifrogi/canonical-serving-admitted}"
: "${AIFROGI_NGINX_INCLUDE:=/etc/nginx/conf.d/aifrogi-release-admission.conf}"
: "${AIFROGI_NGINX_BIN:=nginx}"
: "${AIFROGI_ACTIVE_RELEASE_FILE:=/var/lib/aifrogi/current-release}"
: "${AIFROGI_DEPLOYMENT_TEST_MODE:=0}"
if [ "$AIFROGI_DEPLOYMENT_TEST_MODE" = 1 ]; then
  : "${AIFROGI_ADMISSION_OWNER:=$(id -un)}"
  : "${AIFROGI_ADMISSION_GROUP:=$(id -gn)}"
else
  test "$(id -u)" -eq 0 || { echo 'REJECT production admission must run as root' >&2; exit 77; }
  AIFROGI_ADMISSION_OWNER=root
  AIFROGI_ADMISSION_GROUP=root
fi
for file in "$AIFROGI_RELEASE_ARCHIVE" "$AIFROGI_RELEASE_MANIFEST" "$AIFROGI_RELEASE_SIGNATURE" "$AIFROGI_RELEASE_PUBLIC_KEY" "$AIFROGI_ACTIVE_RELEASE_FILE"; do test -f "$file" || { echo "REJECT missing $file" >&2; exit 64; }; done
openssl dgst -sha256 -verify "$AIFROGI_RELEASE_PUBLIC_KEY" -signature "$AIFROGI_RELEASE_SIGNATURE" "$AIFROGI_RELEASE_MANIFEST" >/dev/null || { echo 'REJECT invalid release signature' >&2; exit 65; }
contract="$(sed -n 's/^CANONICAL_SERVING_CONTRACT=//p' "$AIFROGI_RELEASE_MANIFEST")"
expected_hash="$(sed -n 's/^RELEASE_SHA256=//p' "$AIFROGI_RELEASE_MANIFEST")"
release_id="$(sed -n 's/^RELEASE_ID=//p' "$AIFROGI_RELEASE_MANIFEST")"
case "$contract" in ''|*[!0-9]*) echo 'REJECT invalid contract' >&2; exit 66;; esac
case "$expected_hash" in *[!0-9a-f]*|'') echo 'REJECT invalid release hash' >&2; exit 67;; esac
test "${#expected_hash}" -eq 64 || { echo 'REJECT invalid release hash length' >&2; exit 67; }
actual_hash="$(openssl dgst -sha256 "$AIFROGI_RELEASE_ARCHIVE" | sed 's/^.*= //')"
test "$actual_hash" = "$expected_hash" || { echo 'REJECT build hash mismatch' >&2; exit 68; }
test "$contract" -ge "$AIFROGI_REQUIRED_SERVING_CONTRACT" || { echo 'REJECT incompatible application build' >&2; exit 69; }
case "$release_id" in ''|*[!A-Za-z0-9._-]*) echo 'REJECT invalid release id' >&2; exit 70;; esac
active_release_id="$(sed -n 's/^RELEASE_ID=//p' "$AIFROGI_ACTIVE_RELEASE_FILE")"
active_release_hash="$(sed -n 's/^RELEASE_SHA256=//p' "$AIFROGI_ACTIVE_RELEASE_FILE")"
test "$active_release_id" = "$release_id" && test "$active_release_hash" = "$actual_hash" || { echo 'REJECT active release does not match signed candidate' >&2; exit 71; }
install -d -o "$AIFROGI_ADMISSION_OWNER" -g "$AIFROGI_ADMISSION_GROUP" -m 0755 "$AIFROGI_ADMISSION_DIR"
marker="$AIFROGI_ADMISSION_DIR/$release_id"
umask 022
printf '%s\n' "contract=$contract" "release=$release_id" "sha256=$actual_hash" > "$marker.tmp"
chown "$AIFROGI_ADMISSION_OWNER:$AIFROGI_ADMISSION_GROUP" "$marker.tmp" && chmod 0444 "$marker.tmp" && mv "$marker.tmp" "$marker"
close_gate() {
  printf 'set $aifrogi_release_admitted 0;\n' > "$AIFROGI_NGINX_INCLUDE.tmp"
  chown "$AIFROGI_ADMISSION_OWNER:$AIFROGI_ADMISSION_GROUP" "$AIFROGI_NGINX_INCLUDE.tmp" && chmod 0444 "$AIFROGI_NGINX_INCLUDE.tmp" && mv "$AIFROGI_NGINX_INCLUDE.tmp" "$AIFROGI_NGINX_INCLUDE"
}
nginx_check() { if [ -n "${AIFROGI_NGINX_CONFIG:-}" ]; then "$AIFROGI_NGINX_BIN" -t -c "$AIFROGI_NGINX_CONFIG"; else "$AIFROGI_NGINX_BIN" -t; fi; }
nginx_reload() { if [ -n "${AIFROGI_NGINX_CONFIG:-}" ]; then "$AIFROGI_NGINX_BIN" -s reload -c "$AIFROGI_NGINX_CONFIG"; else "$AIFROGI_NGINX_BIN" -s reload; fi; }
admission_failed() {
  trap - EXIT HUP INT TERM
  close_gate || true
  nginx_check >/dev/null 2>&1 && nginx_reload >/dev/null 2>&1 || true
}
close_gate
nginx_check
nginx_reload
trap admission_failed EXIT HUP INT TERM
printf 'set $aifrogi_release_admitted 1;\n' > "$AIFROGI_NGINX_INCLUDE.tmp"
chown "$AIFROGI_ADMISSION_OWNER:$AIFROGI_ADMISSION_GROUP" "$AIFROGI_NGINX_INCLUDE.tmp" && chmod 0444 "$AIFROGI_NGINX_INCLUDE.tmp" && mv "$AIFROGI_NGINX_INCLUDE.tmp" "$AIFROGI_NGINX_INCLUDE"
nginx_check
nginx_reload
trap - EXIT HUP INT TERM
echo "ADMIT $release_id contract=$contract sha256=$actual_hash"
