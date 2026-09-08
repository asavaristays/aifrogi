import fs from 'node:fs';
import cp from 'node:child_process';
import {createHash} from 'node:crypto';
import dotenv from 'dotenv';
const stage='/var/www/aifrogi-hardening-20260905.vcaPTT',prod='/var/www/lead-os-ai';
const health=await (await fetch('https://app.aifrogi.com/api/health/ready')).json();
if(health.status!=='ok'||health.release!=='bucket5b-corrections-20260906')throw Error('Live release mismatch');
for(const file of ['lib/knowledge-correction-gate.ts','lib/repositories/knowledge-verification-repository.ts','app/api/knowledge/entries/route.ts']){
 const hash=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
 if(hash(stage+'/'+file)!==hash(prod+'/'+file))throw Error('Deployed source mismatch');
}
console.log(JSON.stringify({liveHealth:health,sourceFilesMatched:3}));
const app=JSON.parse(cp.execFileSync('pm2',['jlist'],{encoding:'utf8'})).find(p=>p.name==='lead-os-ai');
if(!app?.pid)throw Error('App missing');
const env={...dotenv.parse(fs.readFileSync(prod+'/.env.local')),...Object.fromEntries(fs.readFileSync(`/proc/${app.pid}/environ`,'utf8').split('\0').filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}))};
cp.execFileSync(process.execPath,['--import','tsx','scripts/verify-bucket-five-b.ts'],{cwd:stage,env,stdio:['ignore','inherit','inherit'],timeout:60000});
cp.execFileSync(process.execPath,['scripts/run-bucket-five-a-qa.mjs'],{cwd:stage,stdio:['ignore','inherit','inherit'],timeout:240000});
