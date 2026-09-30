#!/usr/bin/env bash
set -euo pipefail
: "${AIFROGI_RESTORE_TEST_DATABASE_URL:?Use a dedicated empty restore-test database; production URL is forbidden}"
: "${1:?Pass the encrypted or plain PostgreSQL custom dump path}"
if [[ "${AIFROGI_RESTORE_TEST_DATABASE_URL}" == "${DATABASE_URL:-}" ]]; then echo "Refusing to restore into production" >&2; exit 2; fi
dump="$1"; work_dir=""; cleanup(){ [[ -n "$work_dir" ]] && rm -rf "$work_dir"; }; trap cleanup EXIT
if [[ "$dump" == *.gz.enc ]]; then
  : "${BACKUP_ENCRYPTION_PASSPHRASE:?Required for encrypted dump}"
  [[ ! -f "${dump}.sha256" ]] || (cd "$(dirname "$dump")" && shasum -a 256 -c "$(basename "${dump}.sha256")")
  work_dir="$(mktemp -d)"
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$dump" -out "$work_dir/backup.dump.gz" -pass env:BACKUP_ENCRYPTION_PASSPHRASE
  gzip -dc "$work_dir/backup.dump.gz" > "$work_dir/backup.dump"
  dump="$work_dir/backup.dump"
elif [[ "$dump" == *.enc ]]; then
  echo "Unsupported encrypted backup suffix; expected .dump.gz.enc" >&2
  exit 4
fi
pg_restore --list "$dump" >/dev/null
pg_restore --exit-on-error --clean --if-exists --no-owner --no-privileges --dbname "$AIFROGI_RESTORE_TEST_DATABASE_URL" "$dump"
psql "$AIFROGI_RESTORE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null
echo "Isolated restore verification passed"
