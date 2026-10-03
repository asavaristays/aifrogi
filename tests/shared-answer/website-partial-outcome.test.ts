import assert from 'node:assert/strict';
import test from 'node:test';
import { websiteAnswerActions, safeWebsiteAnswerActionUrl } from '../../lib/website-answer-presentation';
import { governResolutionOutcome } from '../../lib/sovereign-intelligence/resolution';
import { evaluateExecutionContract } from '../../lib/sovereign-intelligence/execution-contract';
import type { SovereignDecision } from '../../lib/sovereign-intelligence/decision';
const decision:SovereignDecision={constitutionVersion:'1.1',blueprintVersion:'1.0',intent:'BUSINESS',disposition:'ANSWER',resolvedQuestion:'When can I visit?',contextUsed:false,reason:'Supported contact recovery'};
const sources=[{title:'Commercial filmmaking',url:'https://tenant.example/film',authority:'APPROVED_FIRST_PARTY_WEBSITE'}];
test('missing hours use the verified phone, not an unrelated retrieved service page',()=>{
 assert.deepEqual(websiteAnswerActions('When can I visit?','ANSWER',sources,{disposition:'PARTIAL',factualClaims:['Phone: +44 20 7946 0958']}),[{label:'Call the business',url:'tel:+442079460958'}]);
 assert.deepEqual(websiteAnswerActions('When can I visit?','ANSWER',sources,{disposition:'PARTIAL',factualClaims:['The studio creates films.']}),[]);
 assert.deepEqual(websiteAnswerActions('When can I visit?','ANSWER',sources,{disposition:'PARTIAL',factualClaims:['Phone: javascript:alert(1)']}),[]);
});
test('retrieval alone cannot create an unrelated learn-more button',()=>{
 assert.deepEqual(websiteAnswerActions('What are your hours?','ANSWER',sources),[]);
 assert.deepEqual(websiteAnswerActions('Do you provide filmmaking?','ANSWER',sources),[{label:'Learn more',url:'https://tenant.example/film'}]);
});
test('partial contact recovery stays active without changing approved answer or starting clarification loops',()=>{
 const answer='Phone: +44 20 7946 0958 I cannot confirm: Exact opening hours.';
 const partial=governResolutionOutcome({question:'When can I visit?',answer,decision,answerComplete:false});
 assert.equal(partial.answer,answer);assert.equal(partial.state.status,'ACTIVE');assert.equal(partial.state.clarifyCount,0);assert.equal(partial.state.circuitBreakerTriggered,false);
 const contract=evaluateExecutionContract({decision:partial.decision,answerComplete:false});assert.equal(contract.terminalOutcome,'PARTIALLY_ANSWERED');assert.equal(contract.completionClaimAllowed,false);
 const complete=governResolutionOutcome({question:'What is your phone?',answer:'Phone: +44 20 7946 0958',decision,answerComplete:true});assert.equal(complete.state.status,'RESOLVED');assert.equal(evaluateExecutionContract({decision:complete.decision,answerComplete:true}).terminalOutcome,'ANSWERED');
});

test('client action URLs allow strict telephone links and reject executable payloads',()=>{
 assert.equal(safeWebsiteAnswerActionUrl('tel:+442079460958'),'tel:+442079460958');
 for(const url of ['tel:+123;ext=javascript:alert(1)','tel:abc','javascript:alert(1)'])assert.equal(safeWebsiteAnswerActionUrl(url),null);
});
