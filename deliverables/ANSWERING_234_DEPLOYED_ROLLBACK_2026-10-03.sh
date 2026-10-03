#!/bin/bash
set -euo pipefail
live=/var/www/lead-os-ai
backup=/var/backups/aifrogi-answering-fc09918-20261003
test -d "$backup/.next"
pm2 stop lead-os-ai
python3 - "$live" "$backup" <<'PY'
import json,pathlib,shutil,sys
live,backup=map(pathlib.Path,sys.argv[1:])
for name,exists in json.loads((backup/'prior-files.json').read_text()).items():
 target=live/name
 if exists:shutil.copy2(backup/'source'/name,target)
 elif target.exists():target.unlink()
shutil.copy2(backup/'prior-source-commit',live/'.aifrogi-source-commit')
PY
mv "$live/.next" "$backup/.next-failed-fc09918"
cp -a "$backup/.next" "$live/.next"
AIFROGI_RELEASE=rag-7c395d4 pm2 restart lead-os-ai --update-env
curl --retry 12 --retry-delay 1 --retry-connrefused -fsS http://127.0.0.1:3011/api/health/ready
