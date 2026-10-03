import {preserveOfferingInventory} from "../../lib/rag-offering-completeness";
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectEvidenceForSubject} from '../../lib/rag-subject-evidence';
import {runSharedAnswer,assertSharedAnswerDelivery,evidenceDigest,type AnswerAdapters,type AnswerEvidence} from '../../lib/shared-answer-engine';
import {requestedPublicFactFields} from '../../lib/public-business-facts';
const scope={organizationId:'org',propertyId:'tenant',generationId:'snapshot'};
const unit=(id:string,title:string,content:string):AnswerEvidence=>({...scope,id,title,content,digest:evidenceDigest(content),url:'https://example.com'});
const general=unit('general','Mobile services','Our customer applications support iOS and Android.');
const product=unit('product','Project ALPHA Field Intelligence | Example','The ALPHA application uses Android and a proprietary offline engine.');
test('industry keywords cannot discard a semantic match for the requested service',async()=>{
 const industry=unit('industry','School Management','School accounts and billing are connected.');
 const requested=unit('requested','Visual Design','We produce custom artwork.');
 const a:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>[industry],semantic:async()=>[requested],generate:async(_q,e)=>{assert.ok(e.some(u=>u.id==='requested'));return {disposition:'ANSWER',sentences:[{text:requested.content,kind:'FACT',evidenceIds:['requested']}],missingParts:[]};},verify:async()=>[{supported:true,evidenceIds:['requested'],reason:'direct service evidence'}],recheck:async()=>true};
 const r=await runSharedAnswer('Can you create an illustration for our school?',a);
 assert.equal(r.answer,requested.content);
});
test('a named case study is excluded from general capability evidence but retained for an explicit product question',()=>{
 assert.deepEqual(selectEvidenceForSubject('Which platforms do those customer apps support?',[product,general]).map(e=>e.id),['general']);
 assert.deepEqual(selectEvidenceForSubject('Which platforms does ALPHA support?',[product,general]).map(e=>e.id),['product']);
});
test('unrelated entity metadata cannot establish another product fact',()=>{
 assert.deepEqual(selectEvidenceForSubject('Explain Omega deployment',[{...product,title:'Deployment',entityKey:'alpha'}]),[]);
});
test('answer plus missing parts becomes partial without a second generation or loss of facts',async()=>{
 let generation=0,verification=0;
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>[general],semantic:async()=>[],generate:async()=>{generation++;return {disposition:'ANSWER',sentences:[{text:general.content,kind:'FACT',evidenceIds:['general']}],missingParts:['A delivery date']};},verify:async()=>{verification++;return [{supported:true,evidenceIds:['general'],reason:'supported'}];},recheck:async()=>true};
 const r=await runSharedAnswer('Which platforms and delivery date?',adapters);
 assert.equal(r.disposition,'PARTIAL');assert.match(r.answer,/iOS and Android/);assert.match(r.answer,/delivery date/);assert.equal(generation,1);assert.equal(verification,1);
});
test('Sunday opening question routes to hours while source-code questions remain business queries',()=>{
 assert.deepEqual(requestedPublicFactFields('Are you open this Sunday, and what time?'),['hours']);
 assert.deepEqual(requestedPublicFactFields('Is the app open source?'),[]);
});

test('opening deliverable inventory is preserved from source text across domains',()=>{
 const source=unit('stay','Seaside Accommodation','We offer private villas, rooms and suites for guests.');
 const draft={disposition:'ANSWER' as const,sentences:[{text:'Private villas are offered.',kind:'FACT' as const,evidenceIds:['stay']}],missingParts:[]};
 preserveOfferingInventory('Tell me about Seaside Accommodation',draft,[source]);
 assert.match(draft.sentences[0].text,/villas, rooms and suites/);assert.deepEqual(draft.sentences[0].evidenceIds,['stay']);
});

test('short topic tokens still bind the source inventory',()=>{
 const source=unit('ux','UX Workshops','We offer tutorials, exercises and assessments for teams.');
 const draft={disposition:'ANSWER' as const,sentences:[{text:'We offer tutorials.',kind:'FACT' as const,evidenceIds:['ux']}],missingParts:[]};
 preserveOfferingInventory('Can you tell me about UX Workshops?',draft,[source]);
 assert.match(draft.sentences[0].text,/tutorials, exercises and assessments/);
});

for(const failedStage of ['generation','verification'])test(`model ${failedStage} outage recovers only an approved phone without retrying`,async()=>{
 const phone=unit('phone','Contact','Phone: +44 20 7946 0958');let calls=0;
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async(_s,q)=>q==='phone number'?[phone]:[general],semantic:async()=>[],generate:async()=>{calls++;if(failedStage==='generation')throw new Error('MODEL_RESPONSE_INCOMPLETE');return {disposition:'ANSWER',sentences:[{text:general.content,kind:'FACT',evidenceIds:['general']}],missingParts:[]};},verify:async()=>{throw new Error('MODEL_HTTP_503');},recheck:async()=>true};
 const r=await runSharedAnswer('What applications can you build?',adapters);assert.equal(r.disposition,'PARTIAL');assert.match(r.answer,/Phone: \+44/);assert.equal(calls,1);assertSharedAnswerDelivery(r,r.answer,scope.organizationId,scope.propertyId);assert.deepEqual(r.factualClaims,['Phone: +44 20 7946 0958']);
});
test('model outage contact recovery cannot survive an authority change',async()=>{
 const phone=unit('phone','Contact','Phone: +44 20 7946 0958');
 const a:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>[phone],semantic:async()=>[],generate:async()=>{throw Error('MODEL_HTTP_503');},recheck:async()=>false};
 const r=await runSharedAnswer('What services do you offer?',a);assert.equal(r.disposition,'TECHNICAL_FAILURE');assert.equal(r.evidence.length,0);assert.ok(!r.answer.includes('7946'));
});
