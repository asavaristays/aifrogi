import {createRequire} from 'node:module';
const {ModelRequestFailure}=createRequire(import.meta.url)('../lib/rag-answer-failure.ts');
import {appendFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
if(!/^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/p2b_rehearsal_business(?:\?|$)/.test(process.env.DATABASE_URL||''))throw Error('SYNTHETIC_BUSINESS_DATABASE_REQUIRED');
const realFetch=globalThis.fetch;
const remoteCode=`const cp=require('child_process');let input='';process.stdin.on('data',x=>{input+=x;if(input.length>262144)process.exit(2)});process.stdin.on('end',async()=>{try{const request=JSON.parse(input);if(!['responses','embeddings'].includes(request.path))throw Error('PATH_NOT_ALLOWED');const apps=JSON.parse(cp.execFileSync('pm2',['jlist'],{maxBuffer:16777216}));const key=apps.find(a=>a.name==='lead-os-ai')?.pm2_env?.OPENAI_API_KEY;if(!key)throw Error('CREDENTIAL_UNAVAILABLE');const response=await fetch('https://api.openai.com/v1/'+request.path,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:request.body,signal:AbortSignal.timeout(14000)});process.stdout.write(JSON.stringify({status:response.status,body:await response.text()}));}catch(e){process.stderr.write(String(e.message));process.exitCode=1}});`;
let requests=0;
globalThis.fetch=async(input,options={})=>{
 const url=new URL(String(input));
 if(['localhost','127.0.0.1'].includes(url.hostname))return realFetch(input,options);
 if(url.origin!=='https://api.openai.com'||!['/v1/responses','/v1/embeddings'].includes(url.pathname))throw Error('SYNTHETIC_TEST_EXTERNAL_REQUEST_BLOCKED');
 if(++requests>120)throw Error('SYNTHETIC_MODEL_REQUEST_LIMIT');
 return new Promise((resolve,reject)=>{
  const child=spawn('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=15','-o','ControlPath=/private/tmp/aifrogi-architecture-release-20261017/model-ssh.sock',process.env.SYNTHETIC_MODEL_SSH_HOST,'node -e '+"'"+remoteCode.replaceAll("'","'\\''")+"'"],{stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
  const abort=()=>{child.kill();reject(new ModelRequestFailure('HARNESS_MODEL_ABORTED',{layer:'TEST_TRANSPORT',timedOut:true}));};options.signal?.addEventListener('abort',abort,{once:true});
  child.on('error',()=>reject(new ModelRequestFailure('HARNESS_SSH_PROCESS_FAILED',{layer:'TEST_TRANSPORT'})));child.on('close',code=>{options.signal?.removeEventListener('abort',abort);if(code!==0)return reject(new ModelRequestFailure(stderr.trim()==='CREDENTIAL_UNAVAILABLE'?'HARNESS_CREDENTIAL_UNAVAILABLE':'HARNESS_SSH_CONNECTION_FAILED',{layer:'TEST_TRANSPORT'}));try{const result=JSON.parse(stdout);appendFileSync("/private/tmp/aifrogi-architecture-release-20261017/model-wire.jsonl",JSON.stringify({request:JSON.parse(String(options.body)),response:JSON.parse(result.body)})+"\n");resolve(new Response(result.body,{status:result.status,headers:{'Content-Type':'application/json'}}));}catch{reject(new ModelRequestFailure('HARNESS_MODEL_RESPONSE_INVALID',{layer:'TEST_TRANSPORT'}))}});
  child.stdin.end(JSON.stringify({path:url.pathname.split('/').pop(),body:options.body}));
 });
};
process.env.OPENAI_API_KEY='remote-synthetic-transport';
