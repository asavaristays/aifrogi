import fs from 'node:fs';
import cp from 'node:child_process';
import dotenv from 'dotenv';
const prod='/var/www/lead-os-ai',stage='/var/www/aifrogi-hardening-20260905.vcaPTT';
const app=JSON.parse(cp.execFileSync('pm2',['jlist'],{encoding:'utf8'})).find(p=>p.name==='lead-os-ai');
if(!app?.pid)throw Error('App missing');
const env={...dotenv.parse(fs.readFileSync(prod+'/.env.local')),...Object.fromEntries(fs.readFileSync(`/proc/${app.pid}/environ`,'utf8').split('\0').filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}))};
cp.execFileSync(process.execPath,['--import','tsx','scripts/audit-pilot-readiness.ts','webtechnosys'],{cwd:stage,env,stdio:['ignore','inherit','inherit'],timeout:60000});
