#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

BACKUP_DIR="${AIFROGI_BACKUP_DIR:-/var/backups/aifrogi}"
RETENTION_DAYS="${AIFROGI_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="${BACKUP_DIR}/aifrogi-${timestamp}.dump"
encrypted="${base}.gz.enc"
temporary="${base}.tmp"
pg_database_url="$(node -e 'const url=new URL(process.argv[1]); url.searchParams.delete("schema"); process.stdout.write(url.toString())' "$DATABASE_URL")"
pg_schema="$(node -e 'const url=new URL(process.argv[1]); process.stdout.write(url.searchParams.get("schema") || "public")' "$DATABASE_URL")"

mkdir -p "$BACKUP_DIR"
umask 077
trap 'rm -f "$temporary" "${base}.gz"' EXIT

pg_dump --format=custom --no-owner --no-privileges --schema "$pg_schema" --file "$temporary" "$pg_database_url"
pg_restore --list "$temporary" >/dev/null
gzip -c "$temporary" > "${base}.gz"
openssl enc -aes-256-cbc -pbkdf2 -salt -in "${base}.gz" -out "$encrypted" -pass env:BACKUP_ENCRYPTION_PASSPHRASE
shasum -a 256 "$encrypted" > "${encrypted}.sha256"
rm -f "$temporary" "${base}.gz"

find "$BACKUP_DIR" -type f \( -name 'aifrogi-*.dump.gz.enc' -o -name 'aifrogi-*.dump.gz.enc.sha256' \) -mtime "+${RETENTION_DAYS}" -delete
printf '%s\n' "$encrypted"
