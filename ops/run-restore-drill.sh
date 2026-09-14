#!/usr/bin/env bash
set -euo pipefail

app_root="$(cd "$(dirname "$0")/.." && pwd)"
backup_file="$(find /var/backups/aifrogi -maxdepth 1 -type f -name 'aifrogi-*.dump.gz.enc' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)"
[[ -n "$backup_file" ]] || { echo "No encrypted AiFrogi backup is available for restore drill." >&2; exit 2; }

container="aifrogi-restore-drill"
port="55432"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup
docker run --rm -d --name "$container" -e POSTGRES_HOST_AUTH_METHOD=trust -p "127.0.0.1:${port}:5432" postgres:16-alpine >/dev/null
for _ in $(seq 1 30); do docker exec "$container" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
docker exec "$container" pg_isready -U postgres >/dev/null

export RESTORE_ADMIN_URL="postgresql://postgres@127.0.0.1:${port}/postgres"
export BACKUP_ENCRYPTION_PASSPHRASE="$(pm2 jlist | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s).find(x=>x.name==="lead-os-ai"&&x.pm2_env?.status==="online");if(!a?.pm2_env?.BACKUP_ENCRYPTION_PASSPHRASE)process.exit(2);process.stdout.write(a.pm2_env.BACKUP_ENCRYPTION_PASSPHRASE)})')"
"$app_root/ops/restore-drill.sh" "$backup_file"
