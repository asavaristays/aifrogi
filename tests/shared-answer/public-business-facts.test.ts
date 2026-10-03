import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runSharedAnswer,evidenceDigest,assertSharedAnswerDelivery,type AnswerEvidence,type AnswerAdapters} from '../../lib/shared-answer-engine';
import {composePublicFactDraft,extractPublicBusinessFacts} from '../../lib/public-business-facts';
const scope={organizationId:'tenant-a',propertyId:'property-a',generationId:'release-a'};
const unit=(content:string,id='contact'):AnswerEvidence=>({...scope,id,content,digest:evidenceDigest(content),url:'https://example.com/contact',title:'Contact'});
function adapters(evidence:AnswerEvidence[]):AnswerAdapters {return {state:async()=>({state:'READY',scope}),lexical:async()=>evidence,semantic:async()=>{throw new Error('EMBEDDING_UNAVAILABLE')},generate:async()=>{throw new Error('GENERATION_UNAVAILABLE')},recheck:async()=>true};}
test('public phone is grounded and delivered without embedding or generation',async()=>{
 const e=unit('Phone: +91 74105 82898'); const a=adapters([e]);
 a.semantic=async()=>{assert.fail('Contact fast path called embedding');};a.generate=async()=>{assert.fail('Contact fast path called generator');};
 const result=await runSharedAnswer('What is your mobile number?',a);
 assert.equal(result.answer,'Phone: +91 74105 82898');assert.equal(result.failureCode,null);
 assertSharedAnswerDelivery(result,result.answer,scope.organizationId,scope.propertyId);
 assert.ok(result.trace.stages.some(s=>s.outcome==='STRUCTURED_FACTS_NO_MODEL'));
});
test('explicit address and email return exact source values',async()=>{
 const result=await runSharedAnswer('Share your address and email',adapters([unit('Address: 22 Example Road, Jaipur 302001 India\nEmail: help@example.com')]));
 assert.equal(result.answer,'Email: help@example.com Address: 22 Example Road, Jaipur 302001 India');
});
test('service coverage and unrelated numbers are not public coordinates',()=>{
 assert.equal(composePublicFactDraft('What is your address?', [unit('We serve Jaipur, Delhi and Goa. Project price: 123456.')]),null);
 assert.equal(composePublicFactDraft('What is your phone number?', [unit('Account number: 1234567890')]),null);
});
test('missing or compound facts fall back rather than discard other question parts',()=>{
 assert.equal(composePublicFactDraft('Phone and address please',[unit('Phone: +44 20 7946 0958')]),null);
 assert.equal(composePublicFactDraft('Phone and training prices please',[unit('Phone: +44 20 7946 0958')]),null);
});
test('retains distinct published phone numbers with evidence',()=>{
 const facts=extractPublicBusinessFacts([unit('Phone: +44 20 7946 0958\nPhone: +44 20 7946 0959')]);assert.equal(facts.filter(f=>f.field==='phone').length,2);
});
test('tenant mismatch and revocation prevent fast delivery',async()=>{
 const e={...unit('Phone: +91 74105 82898'),organizationId:'tenant-b'};
 assert.equal((await runSharedAnswer('Phone number?',adapters([e]))).failureCode,'EVIDENCE_SCOPE_MISMATCH');
 const a=adapters([unit('Phone: +91 74105 82898')]);a.recheck=async()=>false;
 assert.equal((await runSharedAnswer('Phone number?',a)).failureCode,'AUTHORITY_CHANGED');
});
test('lexical service failure uses semantic fallback',async()=>{
 const e=unit('Phone: +91 74105 82898');const a=adapters([]);a.lexical=async()=>{throw new Error('DATABASE_TIMEOUT')};a.semantic=async()=>[e];a.generate=async()=>({disposition:'ANSWER',sentences:[{text:'Phone: +91 74105 82898',kind:'FACT',evidenceIds:[e.id]}],missingParts:[]});
 const r=await runSharedAnswer('Phone number?',a);assert.equal(r.disposition,'ANSWER');
});
test('unlabelled WhatsApp footer remains explicit public phone evidence',async()=>{
 const r=await runSharedAnswer('What is your mobile number?',adapters([unit('WhatsApp Us\n\n+91 74105 82898','footer')]));
 assert.equal(r.answer,'Phone: +91 74105 82898');assert.equal(r.failureCode,null);
});
test('operating address is extracted without promoting workshop venue',()=>{
 const e=unit('Example operates from H.No 746 - TF, New Wada, Morjim, Goa 403512, India and serves business clients.');
 assert.equal(composePublicFactDraft('Share your address',[e])?.sentences[0].text,'Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India');
 assert.equal(composePublicFactDraft('Share your address',[unit('Location Panjim, Goa. Exact workshop venue is shared before the event.')]),null);
});
test('no contact result is cached between tenants or releases',async()=>{
 const first=await runSharedAnswer('Phone number?',adapters([unit('Phone: +44 20 7946 0958')]));
 const second=await runSharedAnswer('Phone number?',adapters([]));
 assert.equal(first.disposition,'ANSWER');assert.equal(second.disposition,'NO_EVIDENCE');assert.ok(!second.answer.includes('7946'));
});
test('intermediate reranking failure retains scoped contact evidence',async()=>{
 const a=adapters([unit('Phone: +91 74105 82898')]);a.rerank=async()=>{throw new Error('RERANK_SCHEMA_INVALID')};
 const r=await runSharedAnswer('Phone number?',a);assert.equal(r.disposition,'ANSWER');assert.ok(r.trace.stages.some(s=>s.outcome==='FALLBACK_ORIGINAL_ORDER'));
});
test('same-priority distinct contact facts remain visible rather than picking one',()=>{
 const draft=composePublicFactDraft('Phone number?', [unit('Phone: +44 20 7946 0958','first'),unit('Phone: +44 20 7946 0959','second')]);
 assert.equal(draft?.sentences.length,2);assert.deepEqual(draft?.sentences.map(s=>s.evidenceIds),[['first'],['second']]);
});
test('general business-hour support is not an exact opening schedule',async()=>{
 const a=adapters([unit('Support windows can be scheduled around Indian business hours.')]);
 const r=await runSharedAnswer('What are your opening hours?',a);assert.equal(r.disposition,'NO_EVIDENCE');assert.match(r.answer,/Exact opening hours/);assert.equal(r.failureCode,null);
});
test('follow-up contact request uses current question without treating history as evidence',async()=>{
 const r=await runSharedAnswer('Previous subject question (context only): Do you develop mobile apps?\nCURRENT visitor question: Can I call them?',adapters([unit('Phone: +91 74105 82898')]));
 assert.equal(r.answer,'Phone: +91 74105 82898');assert.equal(r.failureCode,null);
});
test('absence of a guarantee is not a negative guarantee policy',async()=>{
 const r=await runSharedAnswer('Do you guarantee a specific business outcome?',adapters([unit('We build software around measurable business outcomes.')]));
 assert.equal(r.disposition,'NO_EVIDENCE');assert.match(r.answer,/cannot confirm/i);assert.doesNotMatch(r.answer,/does not guarantee/i);
});

test('missing information offers only an extracted permitted phone with a delivery proof',async()=>{
 const phone=unit('Phone: +44 20 7946 0958','phone');
 const a=adapters([unit('Support visits can be arranged.','support')]);
 a.lexical=async(_scope,q)=>q==='phone number'?[phone]:[unit('Support visits can be arranged.','support')];
 const r=await runSharedAnswer('What are your exact opening hours?',a);
 assert.equal(r.disposition,'PARTIAL');assert.match(r.answer,/Phone: \+44 20 7946 0958/);assert.match(r.answer,/confirm: Exact opening hours/);assertSharedAnswerDelivery(r,r.answer,scope.organizationId,scope.propertyId);
 assert.deepEqual(r.factualClaims,['Phone: +44 20 7946 0958']);
});
test('explicit email in a permitted passage needs no contact-page label',()=>{
 const e={...unit('Questions may be sent to help@example.com.'),title:'Terms',url:'https://example.com/terms'};
 assert.equal(composePublicFactDraft('Email address?',[e])?.sentences[0].text,'Email: help@example.com');
});
