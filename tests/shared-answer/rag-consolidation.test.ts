import test from 'node:test';
import assert from 'node:assert/strict';
import {runSharedAnswer,evidenceDigest,assertSharedAnswerDelivery,type AnswerAdapters,type AnswerEvidence} from '../../lib/shared-answer-engine';
import {resolveSovereignQuestion} from '../../lib/sovereign-intelligence/decision';
const scope={organizationId:'org',propertyId:'tenant',generationId:'v1'};
const content='We develop iOS and Android applications. Support is provided after launch.';
const unit:AnswerEvidence={...scope,id:'source',content,digest:evidenceDigest(content),url:'https://example.com/services',title:'Applications'};
function adapters():AnswerAdapters {return {state:async()=>({state:'READY',scope}),lexical:async()=>[unit],semantic:async()=>[unit],generate:async()=>({disposition:'ANSWER',sentences:[{text:'We develop iOS and Android applications.',kind:'FACT',evidenceIds:['source']}],missingParts:[]}),verify:async()=>[{supported:true,evidenceIds:['source'],reason:'Explicit'}],recheck:async()=>true};}
test('iPhone follow-up resolves subject without treating history as evidence',()=>{
 const resolved=resolveSovereignQuestion('Can it also run on iPhones?',['Do you develop mobile apps?']);
 assert.equal(resolved.contextUsed,true);assert.match(resolved.resolvedQuestion,/Follow-up question/);
 assert.equal(resolveSovereignQuestion('What is your address?',['Do you develop mobile apps?']).contextUsed,false);
});
test('reranker outage preserves tenant-scoped evidence and checks support once',async()=>{
 const a=adapters();let calls=0;a.rerank=async()=>{throw new Error('RANKER_UNAVAILABLE')};a.verify=async()=>{calls++;return [{supported:true,evidenceIds:['source'],reason:'Explicit'}]};
 const r=await runSharedAnswer('Which application platforms do you support?',a);
 assert.equal(r.disposition,'ANSWER');assert.equal(calls,1);assert.ok(r.trace.stages.some(s=>s.outcome==='FALLBACK_ORIGINAL_ORDER'));
 assert.equal(assertSharedAnswerDelivery(r,r.answer,'org','tenant').length,1);
 assert.throws(()=>assertSharedAnswerDelivery(r,r.answer+' Extra promise.','org','tenant'));
});
test('unsupported generated claim is omitted while supported requested part remains',async()=>{
 const a=adapters();a.generate=async()=>({disposition:'ANSWER',sentences:[{text:'We develop iOS and Android applications.',kind:'FACT',evidenceIds:['source']},{text:'We deliver everything tomorrow.',kind:'FACT',evidenceIds:['source']}],missingParts:[]});a.verify=async()=>[{supported:true,evidenceIds:['source'],reason:'Explicit'},{supported:false,evidenceIds:[],reason:'Absent',requestedPartMissing:'Delivery timeline'}];
 const r=await runSharedAnswer('Which platforms and delivery timeline?',a);assert.equal(r.disposition,'PARTIAL');assert.doesNotMatch(r.answer,/tomorrow/);assert.match(r.answer,/iOS/);
});
test('cross-tenant evidence and authority changes fail closed',async()=>{
 const a=adapters();a.lexical=async()=>[{...unit,propertyId:'other'}];assert.equal((await runSharedAnswer('Application platforms?',a)).disposition,'TECHNICAL_FAILURE');
 const b=adapters();b.recheck=async()=>false;assert.equal((await runSharedAnswer('Application platforms?',b)).failureCode,'AUTHORITY_CHANGED');
});
test('invalid support review cannot become delivery proof',async()=>{
 const a=adapters();a.verify=async()=>[];const r=await runSharedAnswer('Application platforms?',a);assert.equal(r.failureCode,'SUPPORT_SCHEMA_INVALID');assert.equal(r.evidence.length,0);
});
test('formatting preference never rejects a long supported answer',async()=>{
 const a=adapters();const text=Array(100).fill('Supported explanation').join(' ');
 a.generate=async()=>({disposition:'ANSWER',sentences:[{text,kind:'FACT',evidenceIds:['source']}],missingParts:[]});
 const r=await runSharedAnswer('Explain application support in detail',a);assert.equal(r.disposition,'ANSWER');assert.equal(r.answer,text);
});
test('support-service outage cannot emit an unverified generated answer',async()=>{
 const a=adapters();a.verify=async()=>{throw new Error('MODEL_HTTP_503')};const r=await runSharedAnswer('Application platforms?',a);assert.equal(r.disposition,'TECHNICAL_FAILURE');assert.equal(r.factualClaims.length,0);
});
test('supported factual sentences cannot bypass delivery through a NO_EVIDENCE label',async()=>{
 const a=adapters();a.generate=async()=>({disposition:'NO_EVIDENCE',sentences:[{text:'We develop iOS and Android applications.',kind:'FACT',evidenceIds:['source']}],missingParts:[]});
 const r=await runSharedAnswer('Application platforms?',a);assert.equal(r.disposition,'ANSWER');assert.equal(assertSharedAnswerDelivery(r,r.answer,'org','tenant').length,1);
});
