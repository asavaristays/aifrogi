import test from 'node:test';
import assert from 'node:assert/strict';
import {SharedAnswerProvider} from '../../lib/shared-answer-provider';
import {ModelRequestFailure,answerFailure} from '../../lib/rag-answer-failure';
import {runSharedAnswer,evidenceDigest,type AnswerAdapters} from '../../lib/shared-answer-engine';
const config={key:'SECRET_SENTINEL',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000};
test('HTTP failures retain safe status and request correlation without provider body',async()=>{
 const p=new SharedAnswerProvider(config,async()=>new Response('SECRET_SENTINEL sensitive body',{status:429,headers:{'x-request-id':'req_example_1'}}));
 await assert.rejects(()=>p.embed(['question']),/MODEL_HTTP_429/);
 assert.deepEqual(p.metrics[0].failure,{code:'MODEL_HTTP_429',layer:'PROVIDER',stage:'EMBEDDING',httpStatus:429,requestId:'req_example_1'});
 assert.ok(!JSON.stringify(p.metrics).includes('SECRET_SENTINEL'));
});
test('timeouts, provider network faults and test transport remain distinguishable',async()=>{
 for(const [fault,code,layer] of [[new DOMException('sensitive','TimeoutError'),'MODEL_TIMEOUT','PROVIDER'],[new TypeError('sensitive network payload'),'MODEL_TRANSPORT_ERROR','PROVIDER'],[new ModelRequestFailure('HARNESS_SSH_CONNECTION_FAILED',{layer:'TEST_TRANSPORT'}),'HARNESS_SSH_CONNECTION_FAILED','TEST_TRANSPORT']] as const){
  const p=new SharedAnswerProvider(config,async()=>{throw fault;});
  await assert.rejects(()=>p.embed(['question']),new RegExp(code));
  assert.equal(p.metrics[0].failure?.layer,layer);
  assert.ok(!JSON.stringify(p.metrics).includes('sensitive'));
 }
 assert.equal(answerFailure(new Error('EVIDENCE_SCOPE_MISMATCH'),'RETRIEVAL').layer,'AUTHORITY');
 assert.equal(answerFailure(new Error('DRAFT_EVIDENCE_INVALID'),'COMPOSITION').layer,'PROOF');
});
test('approved contact recovery retains the real engine failure in internal trace',async()=>{
 const content='Phone: +44 20 7946 0958';const unit={organizationId:'org',propertyId:'tenant',generationId:'v1',id:'phone',title:'Contact',url:'',content,digest:evidenceDigest(content)};
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope:unit}),lexical:async()=>[unit],semantic:async()=>[],generate:async()=>{throw new ModelRequestFailure('MODEL_HTTP_503',{httpStatus:503});},recheck:async()=>true};
 const result=await runSharedAnswer('Tell me about services',adapters);
 assert.equal(result.disposition,'PARTIAL');assert.equal(result.coverage?.status,'ENGINE_FAILURE');
 assert.deepEqual(result.trace.failures,[{code:'MODEL_HTTP_503',layer:'PROVIDER',httpStatus:503,stage:'COMPOSITION'}]);
 assert.ok(!result.answer.includes('503'));
});
