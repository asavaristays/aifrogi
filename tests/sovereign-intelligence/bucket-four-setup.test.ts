import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import path from 'node:path';
const state:any={allowed:false,calls:[]};let POST:any;
test.before(async()=>{
 (globalThis as any).__b4setup=state;
 const adapters:Record<string,string>={
 '@/lib/client-access':'export const resolveClientWorkspaceAccess=async(input)=>{globalThis.__b4setup.access=input;return globalThis.__b4setup.allowed?{ok:true,propertyId:"trusted",organization:{id:"org"},user:{username:"owner"}}:{ok:false,status:403,error:"Denied"}};',
 '@/lib/appointment-journey-service':'export const getAppointmentTenantForProperty=async()=>({});export const setAppointmentJourneyEnabled=async(input)=>{globalThis.__b4setup.calls.push(input);return {error:null}};'
 };
 const result=await build({entryPoints:['app/api/appointment-journey/current/route.ts'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/^@\//},a=>adapters[a.path]?{path:a.path,namespace:'stub'}:undefined);b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:adapters[a.path],loader:'js'}));}}]});
 const m={exports:{} as any};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(path.resolve('package.json')),m,m.exports);POST=m.exports.POST;
});
test.after(()=>{delete (globalThis as any).__b4setup;});
test.beforeEach(()=>{state.allowed=false;state.calls=[];});
const request=(body:any)=>new Request('https://example.test/api',{method:'POST',body:JSON.stringify(body)});
test('B4 setup rejects unauthorized workspace changes',async()=>{assert.equal((await POST(request({action:'PREPARE_GOOGLE'}))).status,403);assert.equal(state.calls.length,0);});
test('B4 setup derives tenant and actor from trusted access',async()=>{state.allowed=true;assert.equal((await POST(request({action:'PREPARE_GOOGLE',propertyId:'foreign',organizationId:'foreign',actorEmail:'fake'}))).status,200);assert.equal(state.access.requireManage,true);assert.deepEqual(state.calls,[{propertyId:'trusted',organizationId:'org',enabled:true,actorEmail:'owner'}]);});
test('B4 setup rejects arbitrary actions',async()=>{assert.equal((await POST(request({action:'DELETE'}))).status,400);assert.equal(state.calls.length,0);});
