import test from 'node:test';
import assert from 'node:assert/strict';
import {runSharedAnswer,evidenceDigest,type AnswerAdapters,type AnswerEvidence} from '../../lib/shared-answer-engine';
import {validateQuestionPlan,type QuestionPlan} from '../../lib/rag-request-plan';
const scope={organizationId:'heldout-org',propertyId:'heldout-tenant',generationId:'snapshot'};
const unit=(id:string,content:string):AnswerEvidence=>({...scope,id,content,digest:evidenceDigest(content),title:id,url:'',sourceKind:'CLAIM'});
const plan:QuestionPlan={parts:[{id:'part-1',questionPart:'Material options',query:'material options',kind:'STATIC'},{id:'part-2',questionPart:'Warranty duration',query:'warranty duration',kind:'STATIC'}]};
function adapters():AnswerAdapters {
 const options=Array.from({length:30},(_,i)=>unit(`material-${i}`,'Available materials are oak and ash.'));
 const warranty=unit('warranty','The warranty lasts two years.');
 return {state:async()=>({state:'READY',scope}),plan:async()=>plan,lexical:async(_scope,q)=>q==='warranty duration'?[warranty]:q==='phone number'?[]:options,semantic:async()=>[],generate:async(_q,e,p)=>{assert.deepEqual(p,plan);assert.ok(e.some(u=>u.id==='warranty'),'crowded first part must not evict second part');assert.ok(e.length<=16);return {disposition:'ANSWER',coveragePlan:plan.parts.map(p=>({requestedPartId:p.id,requestedPart:p.questionPart,publishedFacts:[],missingDetail:null})),sentences:[{text:'Available materials are oak and ash.',kind:'FACT',evidenceIds:['material-0'],requestedPartIds:['part-1']},{text:'The warranty lasts two years.',kind:'FACT',evidenceIds:['warranty'],requestedPartIds:['part-2']}],missingParts:[]};},verify:async()=>[{supported:true,evidenceIds:['material-0'],reason:'Exact'},{supported:true,evidenceIds:['warranty'],reason:'Exact'}],recheck:async()=>true};
}
test('plan precedes retrieval and independently supported parts survive ranking pressure',async()=>{
 const a=adapters();let planned=false;const lex=a.lexical;a.plan=async()=>{planned=true;return plan;};a.lexical=async(s,q)=>{assert.equal(planned,true);return lex(s,q);};
 const result=await runSharedAnswer('Which materials are offered and how long is the warranty?',a);
 assert.equal(result.disposition,'ANSWER');assert.equal(result.factualClaims.length,2);assert.equal(result.trace.evidencePlan?.parts.length,2);
});
test('a rejected part cannot erase a supported part or silently mark the whole answer complete',async()=>{
 const a=adapters();a.verify=async()=>[{supported:true,evidenceIds:['material-0'],reason:'Exact'},{supported:false,evidenceIds:[],reason:'Unsupported'}];
 const result=await runSharedAnswer('Which materials are offered and how long is the warranty?',a);
 assert.equal(result.disposition,'PARTIAL');assert.match(result.answer,/oak and ash/);assert.ok(!result.factualClaims.join(' ').includes('two years'));assert.ok(result.coverage?.missingParts.includes('Warranty duration'));
});
test('foreign evidence in any part fails closed even when another part has valid evidence',async()=>{
 const a=adapters();const lex=a.lexical;a.lexical=async(s,q)=>q==='warranty duration'?[{...unit('foreign','Private warranty'),propertyId:'another-tenant'}]:lex(s,q);
 assert.equal((await runSharedAnswer('materials and warranty',a)).coverage?.status,'AUTHORITY_DENIED');
});
test('invalid, duplicated or unbound request identifiers cannot establish completeness',async()=>{
 assert.throws(()=>validateQuestionPlan({parts:[plan.parts[0],plan.parts[0]]}),/QUESTION_PLAN_INVALID/);
 const a=adapters();const generate=a.generate!;a.generate=async(q,e,p)=>{const d=await generate(q,e,p);d.sentences[1].requestedPartIds=['part-6'];return d;};
 assert.equal((await runSharedAnswer('materials and warranty',a)).failureCode,'DRAFT_REQUEST_BINDING_INVALID');
});

test('action-only requests route without retrieval, composition or completion assertions',async()=>{
 const a=adapters();a.plan=async()=>({parts:[{id:'part-1',questionPart:'Complete the transaction',query:'complete transaction',kind:'ACTION'}]});
 a.lexical=async()=>{throw Error('UNEXPECTED_RETRIEVAL');};a.generate=async()=>{throw Error('UNEXPECTED_GENERATION');};
 const result=await runSharedAnswer('Complete the transaction',a);assert.equal(result.disposition,'LIVE_ACTION_REQUIRED');assert.deepEqual(result.factualClaims,[]);assert.equal(result.failureCode,null);
});
test('planning cannot invent a requested subtype absent from the visitor question',async()=>{
 const {SharedAnswerProvider}=await import('../../lib/shared-answer-provider');
 const p=new SharedAnswerProvider({key:'fixture',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000},async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({parts:[{questionPart:'Which varieties do you offer?',query:'varieties',kind:'STATIC'}]})}]}]}));
 await assert.rejects(()=>p.plan('And delivery too?'),/QUESTION_PLAN_SOURCE_BINDING_INVALID/);
});

test('independent completeness review can resolve a supported part despite draft uncertainty',async()=>{
 const a=adapters();const generate=a.generate!;a.generate=async(q,e,p)=>{const d=await generate(q,e,p);d.coveragePlan![1].missingDetail='Unasked warranty subtype';d.missingParts=['Unasked warranty subtype'];d.disposition='PARTIAL';return d;};
 a.verify=async()=>Object.assign([{supported:true,evidenceIds:['material-0'],reason:'Exact'},{supported:true,evidenceIds:['warranty'],reason:'Exact'}],{coverage:plan.parts.map((p,i)=>({requestedPartId:p.id,answered:true,claimIndexes:[i],missingDetail:null}))});
 const result=await runSharedAnswer('Which materials are offered and how long is the warranty?',a);assert.equal(result.disposition,'ANSWER');assert.deepEqual(result.coverage?.missingParts,[]);
});

test('retrieval normalization preserves a valid singular time unit',async()=>{
 const {normalizeRagQuestion}=await import('../../lib/rag-query-normalization');assert.equal(normalizeRagQuestion('How many units per hour?'),'How many units per hour?');
});
