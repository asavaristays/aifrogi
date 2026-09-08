import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import path from 'node:path';
let GET:any,POST:any;
const state:any={allowed:false,origin:true,queries:[],writes:[]};
test.before(async()=>{
 (globalThis as any).__teamTest=state;
 state.db={onboardingActivity:{findFirst:async(q:any)=>{state.queries.push(q);return null;},create:async(q:any)=>{state.writes.push(q);return {}; }},leadMessage:{count:async(q:any)=>{state.queries.push(q);return 3;}},websiteVisitorSession:{count:async(q:any)=>{state.queries.push(q);return 1;}}};
 const stubs:Record<string,string>={
 '@/lib/client-access':'export const resolveClientWorkspaceAccess=async()=>globalThis.__teamTest.allowed?{ok:true,propertyId:"owned",organization:{id:"org"},user:{username:"owner@test.invalid"}}:{ok:false,status:401,error:"Sign in"};',
 '@/lib/workspace':'export const getCurrentWorkspaceSlug=async()=>"owned";',
 '@/lib/db':'export const getDb=()=>globalThis.__teamTest.db;',
 '@/lib/sovereign-intelligence/pilot-origin':'export const isPilotReviewOriginAllowed=()=>globalThis.__teamTest.origin;'
 };
 const b=await build({entryPoints:['app/api/team-inbox/summary/route.ts'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'test',setup(b){b.onResolve({filter:/^@\//},a=>stubs[a.path]?{path:a.path,namespace:'stub'}:undefined);b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],loader:'js'}));}}]});
 const m={exports:{} as any};new Function('require','module','exports',b.outputFiles[0].text)(createRequire(path.resolve('package.json')),m,m.exports);GET=m.exports.GET;POST=m.exports.POST;
});
test.beforeEach(()=>{state.allowed=false;state.origin=true;state.queries=[];state.writes=[];});
test.after(()=>{delete (globalThis as any).__teamTest;});
test('anonymous summary is denied before data access',async()=>{assert.equal((await GET()).status,401);assert.equal(state.queries.length,0);});
test('summary queries are tenant and operator scoped',async()=>{state.allowed=true;const r=await GET();assert.equal(r.headers.get('cache-control'),'private, no-store');const b=await r.json();assert.equal(b.unread,3);assert.equal(b.needsHuman,1);assert.equal(state.queries[0].where.organizationId,'org');assert.equal(state.queries[0].where.actorEmail,'owner@test.invalid');assert.equal(state.queries[1].where.lead.propertyId,'owned');assert.equal(state.queries[2].where.propertyId,'owned');});
test('cross-origin review marker is denied',async()=>{state.allowed=true;state.origin=false;assert.equal((await POST(new Request('https://app.aifrogi.com/api/team-inbox/summary',{method:'POST'}))).status,403);assert.equal(state.writes.length,0);});
test('future review cursor cannot hide new messages',async()=>{state.allowed=true;const r=await POST(new Request('https://app.aifrogi.com/api/team-inbox/summary',{method:'POST',body:JSON.stringify({checkedAt:new Date(Date.now()+60000).toISOString()})}));assert.equal(r.status,400);assert.equal(state.writes.length,0);});
test('review marker does not close human requests',async()=>{state.allowed=true;const r=await POST(new Request('https://app.aifrogi.com/api/team-inbox/summary',{method:'POST',body:JSON.stringify({checkedAt:new Date().toISOString()})}));assert.equal(r.status,200);assert.equal(state.writes[0].data.action,'TEAM_INBOX_SEEN:owned');assert.equal(state.writes[0].data.actorEmail,'owner@test.invalid');});
