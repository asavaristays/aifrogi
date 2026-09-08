import fs from 'node:fs';
import cp from 'node:child_process';
import dotenv from 'dotenv';
const stage='/var/www/aifrogi-hardening-20260905.vcaPTT';
const app=JSON.parse(cp.execFileSync('pm2',['jlist'],{encoding:'utf8'})).find(p=>p.name==='lead-os-ai');
if(!app?.pid)throw Error('App missing');
const procEnv=Object.fromEntries(fs.readFileSync(`/proc/${app.pid}/environ`,'utf8').split('\0').filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}));
// Runtime-only: do not persist or print the parsed configuration.
const env={...dotenv.parse(fs.readFileSync('/var/www/lead-os-ai/.env.local')),...procEnv};
const staging=process.argv.includes('--staging');
const target=staging?'http://127.0.0.1:3115':'https://app.aifrogi.com';
let preview;
try{
 if(staging){
  preview=cp.spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3115','-H','127.0.0.1'],{cwd:stage,env:{...env,AIFROGI_RELEASE:'bucket5a-closed-20260906'},stdio:'ignore'});
  let ready=false;
  for(let i=0;i<30;i++){
   if(preview.exitCode!==null)throw Error('Staging startup failed');
   try{const r=await fetch(target+'/api/health/ready',{signal:AbortSignal.timeout(2000)});const b=await r.json();if(i===1||i===29)console.log(JSON.stringify({stagingHealth:b}));if(r.ok&&b.release==='bucket5a-closed-20260906'){ready=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,1000));
  }
  if(!ready)throw Error('Staging readiness failed');
 }
 cp.execFileSync(process.execPath,['--import','tsx','scripts/verify-bucket-five-a.ts'],{cwd:stage,env:{...env,AIFROGI_5A_QA_URL:target,AIFROGI_5A_QA_CONFIRM:'synthetic-demo-evidence-only'},stdio:['ignore','inherit','inherit'],timeout:240000});
}finally{preview?.kill('SIGTERM');}
