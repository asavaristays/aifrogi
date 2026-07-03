#!/usr/bin/env bash
set -euo pipefail

: "${RESTORE_ADMIN_URL:?RESTORE_ADMIN_URL is required and must point to a non-production PostgreSQL server}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

BACKUP_FILE="${1:-}"
[[ -n "$BACKUP_FILE" ]] || { echo "Usage: restore-drill.sh /path/to/aifrogi-*.dump.gz.enc" >&2; exit 2; }
[[ -f "$BACKUP_FILE" ]] || { echo "Backup file not found" >&2; exit 2; }

case "$RESTORE_ADMIN_URL" in
  *aifrogi_prod*|*lead_os_ai*) echo "RESTORE_ADMIN_URL appears to target production; refusing restore drill." >&2; exit 3 ;;
esac

drill_db="aifrogi_restore_$(date -u +%Y%m%d%H%M%S)"
work_dir="$(mktemp -d)"
dump_file="${work_dir}/restore.dump"
trap 'dropdb --if-exists --force --maintenance-db "$RESTORE_ADMIN_URL" "$drill_db" >/dev/null 2>&1 || true; rm -rf "$work_dir"' EXIT

if [[ -f "${BACKUP_FILE}.sha256" ]]; then
  (cd "$(dirname "$BACKUP_FILE")" && shasum -a 256 -c "$(basename "${BACKUP_FILE}.sha256")")
fi

openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -pass env:BACKUP_ENCRYPTION_PASSPHRASE | gzip -dc > "$dump_file"
pg_restore --list "$dump_file" >/dev/null
createdb --maintenance-db "$RESTORE_ADMIN_URL" "$drill_db"
pg_restore --no-owner --no-privileges --dbname "${RESTORE_ADMIN_URL%/*}/${drill_db}" "$dump_file"

table_count="$(psql "${RESTORE_ADMIN_URL%/*}/${drill_db}" --tuples-only --no-align --command "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
[[ "$table_count" -gt 0 ]] || { echo "Restore completed without public tables" >&2; exit 4; }
printf 'Restore drill passed: %s public tables restored into temporary database %s.\n' "$table_count" "$drill_db"
