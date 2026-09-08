import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePilotReview} from '../../lib/sovereign-intelligence/pilot-review';
import {latestPilotReviews} from '../../lib/sovereign-intelligence/pilot-review';
import {isPilotReviewOriginAllowed} from '../../lib/sovereign-intelligence/pilot-origin';
const input = {version: 1, evidenceId: 'e', propertyId: 'p', cohort: 'UNCLASSIFIED', outcome: 'UNRESOLVED', rationale: 'Reviewed against approved source; outcome needs confirmation.'};
test('review requires explicit provenance and outcome', () => assert.ok(parsePilotReview(input)));
test('review does not trust actor fields supplied by caller', () => assert.equal('actorEmail' in parsePilotReview({...input, actorEmail: 'forged'})!, false));
test('review rejects absent rationale', () => assert.equal(parsePilotReview({...input, rationale: 'done'}), null));
test('review rejects arbitrary cohorts and outcomes', () => {
  assert.equal(parsePilotReview({...input, cohort: 'PRODUCTION'}), null);
  assert.equal(parsePilotReview({...input, outcome: '95%'}), null);
});
test('review rejects malformed or oversized values', () => {
  for (const v of [null, [], {...input, version: 2}, {...input, evidenceId: ''}, {...input, rationale: 'x'.repeat(2001)}]) assert.equal(parsePilotReview(v), null);
});
test('array values cannot masquerade as review enums',()=>{assert.equal(parsePilotReview({...input,cohort:['REAL']}),null);assert.equal(parsePilotReview({...input,outcome:['CORRECT']}),null);});
const event={id:'1',organizationId:'o',actorEmail:'reviewer@example.test',createdAt:new Date('2026-09-01'),detail:JSON.stringify(input)};
test('latest revision replaces an earlier verdict, not an extra sample',()=>{
 const latest=latestPilotReviews([event,{...event,id:'2',createdAt:new Date('2026-09-02'),detail:JSON.stringify({...input,outcome:'CORRECT'})}]);
 assert.equal(latest.size,1);assert.equal(latest.get('p:e')?.outcome,'CORRECT');
});
test('corrupt or unattributed audit events do not become review evidence',()=>assert.equal(latestPilotReviews([{...event,detail:'bad'},{...event,actorEmail:null}]).size,0));
test('review projection keeps property boundaries',()=>assert.equal(latestPilotReviews([event,{...event,id:'2',detail:JSON.stringify({...input,propertyId:'other'})}]).size,2));
test('production origin uses trusted configuration rather than proxy request host',()=>{
 assert.equal(isPilotReviewOriginAllowed('https://app.aifrogi.com','http://localhost:3011/reviews',true),true);
 for(const origin of [null,'null','https://evil.example','http://localhost:3011'])assert.equal(isPilotReviewOriginAllowed(origin,'http://localhost:3011/reviews',true),false);
});
