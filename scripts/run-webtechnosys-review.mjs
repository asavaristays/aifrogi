import fs from 'node:fs';
let source=fs.readFileSync('/var/www/aifrogi-hardening-20260905.vcaPTT/scripts/check-five-c-readiness.mjs','utf8');
source=source.replace("from 'dotenv'","from 'file:///var/www/aifrogi-hardening-20260905.vcaPTT/node_modules/dotenv/lib/main.js'").replace("'scripts/audit-pilot-readiness.ts','webtechnosys'","'scripts/review-webtechnosys-readiness.ts'");
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
