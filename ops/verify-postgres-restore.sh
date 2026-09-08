#!/usr/bin/env bash
set -euo pipefail
: "${AIFROGI_RESTORE_TEST_DATABASE_URL:?Use a dedicated empty restore-test database; production URL is forbidden}"
: "${1:?Pass the encrypted or plain PostgreSQL custom dump path}"
if [[ "${AIFROGI_RESTORE_TEST_DATABASE_URL}" == "${DATABASE_URL:-}" ]]; then echo "Refusing to restore into production" >&2; exit 2; fi
dump="$1"; temporary=""; cleanup(){ [[ -n "$temporary" ]] && rm -f "$temporary"; }; trap cleanup EXIT
if [[ "$dump" == *.enc ]]; then : "${BACKUP_ENCRYPTION_PASSPHRASE:?Required for encrypted dump}"; temporary="$(mktemp)"; openssl enc -d -aes-256-cbc -pbkdf2 -in "$dump" -out "$temporary" -pass env:BACKUP_ENCRYPTION_PASSPHRASE; dump="$temporary"; fi
pg_restore --list "$dump" >/dev/null
pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$AIFROGI_RESTORE_TEST_DATABASE_URL" "$dump"
psql "$AIFROGI_RESTORE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null
echo "Isolated restore verification passed"
