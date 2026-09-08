import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import path from 'node:path';
let GET:any;
const state:any={user:null,allowed:false,calls:0};
test.before(async()=>{
  (globalThis as any).__b4oauth=state;
  const adapters:Record<string,string>={
    '@/lib/auth-server':'export const getCurrentUser=async()=>globalThis.__b4oauth.user;',
    '@/lib/client-access':'export const resolveClientWorkspaceAccess=async()=>({ok:globalThis.__b4oauth.allowed,status:403});',
    '@/lib/appointment-journey-google-oauth':'export const parseGoogleAppointmentOAuthState=()=>({tenantId:"a",returnTo:"/settings"});export const exchangeGoogleAppointmentCode=async()=>{globalThis.__b4oauth.calls++;return {accessToken:"fake",refreshToken:"fake"}};export const createAppointmentGoogleResources=async()=>({calendarId:"c",sheetId:"s"});',
    '@/lib/appointment-journey-service':'export const getAppointmentTenantOAuthContext=async()=>({name:"A",timezone:"UTC",property:{slug:"a"}});export const connectAppointmentTenantGoogle=async()=>({});export const markAppointmentTenantGoogleActionRequired=async()=>{};'
  };
  const compiled=await build({entryPoints:['app/api/appointment-journey/google/oauth/callback/route.ts'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/^@\//},a=>adapters[a.path]?{path:a.path,namespace:'stub'}:undefined);b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:adapters[a.path],loader:'js'}));}}]});
  const module={exports:{} as any};new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(path.resolve('package.json')),module,module.exports);GET=module.exports.GET;
});
test.after(()=>{delete (globalThis as any).__b4oauth;});
test.beforeEach(()=>{state.user=null;state.allowed=false;state.calls=0;});
for(const user of [null,{role:'client',username:'foreign'}])test(`B4 callback denies ${user?'foreign workspace':'unauthenticated caller'} before token exchange`,async()=>{
  state.user=user;const result=await GET(new Request('https://example.test/callback?code=x&state=y'));assert.equal(result.status,403);assert.equal(state.calls,0);
});
test('B4 callback permits authorized workspace manager',async()=>{
  state.user={role:'client'};state.allowed=true;const result=await GET(new Request('https://example.test/callback?code=x&state=y'));assert.equal(result.status,307);assert.equal(state.calls,1);
});
test('B4 callback escapes provider error text',async()=>{
  const result=await GET(new Request('https://example.test/callback?error=%3Cscript%3Ebad%3C%2Fscript%3E'));const body=await result.text();assert.ok(!body.includes('<script>'));assert.ok(body.includes('&lt;script&gt;'));assert.equal(state.calls,0);
});
test('B4 callback returns to public app behind localhost proxy',async()=>{
  state.user={role:'client'};state.allowed=true;
  const result=await GET(new Request('https://localhost:3011/callback?code=x&state=y'));
  assert.equal(new URL(result.headers.get('location')).origin,'https://app.aifrogi.com');
});
