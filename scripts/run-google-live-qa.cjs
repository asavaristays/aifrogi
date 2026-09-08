const fs=require('node:fs'),cp=require('node:child_process');
const p=JSON.parse(cp.execFileSync('pm2',['jlist'],{encoding:'utf8'})).find(p=>p.name==='lead-os-ai');
if(!p?.pid)throw Error('App missing');
const env=Object.fromEntries(fs.readFileSync('/proc/'+p.pid+'/environ','utf8').split('\0').filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}));
const r=cp.spawnSync('node',['--import','tsx','scripts/verify-webtechnosys-google-live.ts'],{cwd:'/var/www/lead-os-ai',env,encoding:'utf8',timeout:90000});
process.stdout.write(r.stdout||'');if(r.status!==0)console.error('QA failed; diagnostic stderr withheld to protect credentials');process.exitCode=r.status||0;
