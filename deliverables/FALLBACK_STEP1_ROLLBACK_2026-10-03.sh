#!/bin/bash
set -euo pipefail
live=/var/www/lead-os-ai
backup=/var/backups/aifrogi-fallback-fdc7c5d-20261003
test -d "$backup/.next"
files=('app/api/public/website-bot/[slug]/route.ts' 'components/website-bot/website-bot-embed.tsx' 'lib/website-answer-presentation.ts' 'lib/sovereign-intelligence/resolution.ts' 'lib/sovereign-intelligence/execution-contract.ts' 'lib/sovereign-intelligence/evidence-pipeline.ts' 'lib/repositories/sovereign-evidence-repository.ts')
pm2 stop lead-os-ai
for file in "${files[@]}"; do cp "$backup/source/$file" "$live/$file"; done
mv "$live/.next" "$backup/.next-rolled-back-7c395d4"
mv "$backup/.next" "$live/.next"
cp "$backup/prior-source-commit" "$live/.aifrogi-source-commit"
AIFROGI_RELEASE=rag-b20f5b1 pm2 restart lead-os-ai --update-env
curl --retry 10 --retry-delay 1 --retry-connrefused -fsS http://127.0.0.1:3011/api/health/ready
# No database schema or knowledge changes in this release. Repeat public checks.
