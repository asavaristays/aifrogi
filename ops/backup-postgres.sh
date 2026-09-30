#!/usr/bin/env bash
set -euo pipefail

: "${AIFROGI_BACKUP_DATABASE_URL:?Explicit administrative backup target is required}"
: "${AIFROGI_BACKUP_EXPECTED_DATABASE:?Expected database name is required}"
: "${AIFROGI_BACKUP_EXPECTED_SERVER_ADDR:?Expected inet_server_addr is required (or LOCAL_SOCKET)}"
: "${AIFROGI_BACKUP_EXPECTED_ROLE:?Expected backup session_user is required}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

BACKUP_DIR="${AIFROGI_BACKUP_DIR:-/var/backups/aifrogi}"
RETENTION_DAYS="${AIFROGI_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="${BACKUP_DIR}/aifrogi-${timestamp}.dump"
encrypted="${base}.gz.enc"
temporary="${base}.tmp"
pg_database_url="$(node -e 'const url=new URL(process.argv[1]); url.searchParams.delete("schema"); process.stdout.write(url.toString())' "$AIFROGI_BACKUP_DATABASE_URL")"

actual_identity="$(psql "$pg_database_url" -X -v ON_ERROR_STOP=1 -At -F $'\t' -c "SELECT current_database(),COALESCE(inet_server_addr()::text,'LOCAL_SOCKET'),session_user")"
IFS=$'\t' read -r actual_database actual_server_addr actual_role <<<"$actual_identity"
[[ "$actual_database" == "$AIFROGI_BACKUP_EXPECTED_DATABASE" ]] || { echo "Refusing backup: connected database identity mismatch" >&2; exit 65; }
[[ "$actual_server_addr" == "$AIFROGI_BACKUP_EXPECTED_SERVER_ADDR" ]] || { echo "Refusing backup: connected server address mismatch" >&2; exit 66; }
[[ "$actual_role" == "$AIFROGI_BACKUP_EXPECTED_ROLE" ]] || { echo "Refusing backup: connected role mismatch" >&2; exit 67; }

mkdir -p "$BACKUP_DIR"
umask 077
trap 'rm -f "$temporary" "${base}.gz"' EXIT

# The explicitly supplied and verified administrative target is always used.
# There is no root/local-postgres fallback. Grants, owners and role memberships
# are captured separately because this portable dump intentionally omits them.
pg_dump --format=custom --no-owner --no-privileges --schema public --schema aifrogi_security --file "$temporary" "$pg_database_url"
restore_list="$(pg_restore --list "$temporary")"
grep -Eq 'SCHEMA - public ' <<<"$restore_list" || { echo "Refusing incomplete backup: public schema missing" >&2; exit 68; }
grep -Eq 'SCHEMA - aifrogi_security ' <<<"$restore_list" || { echo "Refusing incomplete backup: aifrogi_security schema missing" >&2; exit 69; }
gzip -c "$temporary" > "${base}.gz"
openssl enc -aes-256-cbc -pbkdf2 -salt -in "${base}.gz" -out "$encrypted" -pass env:BACKUP_ENCRYPTION_PASSPHRASE
shasum -a 256 "$encrypted" > "${encrypted}.sha256"
rm -f "$temporary" "${base}.gz"

find "$BACKUP_DIR" -type f \( -name 'aifrogi-*.dump.gz.enc' -o -name 'aifrogi-*.dump.gz.enc.sha256' \) -mtime "+${RETENTION_DAYS}" -delete
printf '%s\n' "$encrypted"
