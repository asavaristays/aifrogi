#!/bin/bash
# Run on the existing AiFrogi server only if rollback is required.
set -euo pipefail
live=/var/www/lead-os-ai
backup=/var/backups/aifrogi-contact-ede70a2-20261003
[ -f "$backup/.next/BUILD_ID" ]
failed="$backup/replaced-next-$(date +%s)"
pm2 stop lead-os-ai
mv "$live/.next" "$failed"
mv "$backup/.next" "$live/.next"
for f in lib/shared-answer-engine.ts lib/shared-answer-provider.ts lib/shared-answer-runtime.ts lib/sovereign-intelligence/claim-validator.ts app/api/public/website-bot/[slug]/route.ts; do cp -a "$backup/$f" "$live/$f"; done
if [ -f "$backup/public-business-facts-was-absent" ]; then mv "$live/lib/public-business-facts.ts" "$backup/replaced-public-business-facts.ts"; else cp -a "$backup/lib/public-business-facts.ts" "$live/lib/public-business-facts.ts"; fi
pm2 restart lead-os-ai
curl --retry 10 --retry-delay 1 --retry-connrefused -fsS http://127.0.0.1:3011/api/health/ready
