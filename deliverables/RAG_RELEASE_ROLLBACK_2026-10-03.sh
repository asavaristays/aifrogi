#!/bin/bash
# Run on existing AiFrogi server as its authorised deployment administrator.
# Restores prior application/functions while retaining all intervening data.
set -euo pipefail
live=/var/www/lead-os-ai
backup=/var/backups/aifrogi-rag-1f338f3-20261003
[ -s "$backup/application.tgz" ]
[ -s "$backup/prior-functions.sql" ]
[ -d "$backup/.next-at-switch" ]
[ ! -e "$backup/.next-rolled-back-candidate" ]
cp "$backup/prior-functions.sql" /tmp/aifrogi-rag-production-rollback.sql
pm2 stop lead-os-ai
sudo -u postgres psql -X -v ON_ERROR_STOP=1 -1 -d lead_os_ai -f /tmp/aifrogi-rag-production-rollback.sql
tar -xzf "$backup/application.tgz" -C "$live"
mv "$live/.next" "$backup/.next-rolled-back-candidate"
mv "$backup/.next-at-switch" "$live/.next"
printf 'ede70a2\n' > "$live/.aifrogi-source-commit"
AIFROGI_RELEASE=webtech-rag-v4 pm2 restart lead-os-ai --update-env
curl --retry 10 --retry-delay 1 --retry-connrefused -fsS http://127.0.0.1:3011/api/health/ready
# Repeat the approved public question gate after recovery.
# New additive tables/columns/functions remain inert; no records are deleted.
# Do not restore the full database backup over newer messages/publications.
