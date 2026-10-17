import test from 'node:test';
import assert from 'node:assert/strict';
import {SharedAnswerProvider} from '../../lib/shared-answer-provider';
import {evidenceDigest,runSharedAnswer,type AnswerEvidence,type AnswerAdapters} from '../../lib/shared-answer-engine';
import {unsupportedClaimRelation} from '../../lib/rag-claim-relations';
const content='We can work under an NDA. Sensitive information should be shared after access controls are in place.';
const evidence:AnswerEvidence[]=[{organizationId:'test-org',propertyId:'test-tenant',generationId:'test-snapshot',id:'policy',title:'Project safeguards',url:'',content,digest:evidenceDigest(content)}];
const checks={actor:true,relationship:true,modality:true,conditions:true,polarity:true,quantity:true};
async function review(overrides:Record<string,unknown>,claim='We can work under an NDA.') {
 let calls=0;
 const provider=new SharedAnswerProvider({key:'synthetic',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000},async()=>{
  calls++;
  const value={reviews:[{supported:true,evidenceIds:['policy'],reason:'fixture',requestedPartMissing:null,sourceSpans:[{evidenceId:'policy',quote:'We can work under an NDA.'}],checks,...overrides}]};
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
 });
 const result=await provider.verifyClaims([claim],evidence,'What safeguards can you offer?');
 assert.equal(calls,1);return result[0];
}
test('exact quoted capability with all relationship checks is supported',async()=>assert.equal((await review({})).supported,true));
test('a supported flag cannot override any failed semantic dimension',async()=>{
 for(const dimension of Object.keys(checks))assert.equal((await review({checks:{...checks,[dimension]:false}})).supported,false);
});
test('invented, uncited and missing source quotes cannot establish support',async()=>{
 for(const sourceSpans of [[],[{evidenceId:'policy',quote:'We never disclose ideas.'}],[{evidenceId:'other-tenant',quote:content}]])assert.equal((await review({sourceSpans})).supported,false);
 assert.equal((await review({checks:undefined})).supported,false);
});
test('a conditional quote cannot establish a will commitment despite model approval',async()=>assert.equal((await review({},'We will work under an NDA.')).supported,false));
test('an NDA capability cannot establish a negative public-disclosure policy',async()=>assert.equal((await review({},'We do not disclose project ideas publicly.')).supported,false));
test('a capability quote cannot establish an unconditional practice',async()=>assert.equal((await review({},'We work under an NDA.')).supported,false));
test('unrelated conditional process advice cannot erase a published capability',()=>{
 const source='We create promotional videos for hotels and resorts. We first understand what the hotel should make a guest feel: privacy, heritage, celebration, escape, food, design, wellness, destination and beach life.';
 assert.equal(unsupportedClaimRelation('We create promotional videos for hotels and resorts showing the guest experience.',[source]),null);
});
test('joined durations cannot borrow the label of a different offering',()=>{
 const source=['12 minute Workshop\n24 minute Consultation'];
 assert.ok(unsupportedClaimRelation('We offer 12 and 24 minute workshops.',source));
 assert.equal(unsupportedClaimRelation('We offer a 12 minute workshop and a 24 minute consultation.',source),null);
 assert.equal(unsupportedClaimRelation('We offer a 12 minute workshop for beginners and a 24 minute consultation with an adviser.',source),null);
 assert.equal(unsupportedClaimRelation('Packages contain 12 or 24 outputs.',['Packages contain 12 or 24 outputs.']),null);
});
test('partial facts are verified before an authorised contact is attached',async()=>{
 const fact='We can provide a tailored service.';
 const service={...evidence[0],id:'service',title:'Tailored services',content:fact,digest:evidenceDigest(fact)};
 const phone={...evidence[0],id:'phone',content:'Phone: +44 20 7946 0958',digest:evidenceDigest('Phone: +44 20 7946 0958')};
 let verified=0;
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope:service}),lexical:async(_scope,q)=>q==='phone number'?[phone]:[service],semantic:async()=>[],generate:async()=>({disposition:'PARTIAL',sentences:[{text:fact,kind:'FACT',evidenceIds:['service']}],missingParts:['A numerical quote']}),verify:async(claims)=>{verified++;assert.deepEqual(claims,[fact]);return [{supported:true,evidenceIds:['service'],reason:'Exact'}]},recheck:async()=>true};
 const result=await runSharedAnswer('What does a tailored service cost?',adapters);
 assert.equal(verified,1);assert.match(result.answer,/tailored service/);assert.match(result.answer,/7946/);
 assert.deepEqual(result.claimEvidence?.map(claim=>claim.evidenceIds),[['service'],['phone']]);
 adapters.lexical=async(_scope,q)=>q==='phone number'?[{...phone,propertyId:'other-tenant'}]:[service];
 assert.equal((await runSharedAnswer('What does a tailored service cost?',adapters)).coverage?.status,'AUTHORITY_DENIED');
});

test('a numeric denial may use a short exact approved limitation but must still pass semantic verification',async()=>{
 const source='Results depend on the campaign and market. We do not guarantee a specific revenue increase.';
 const unit={...evidence[0],content:source,digest:evidenceDigest(source),title:'Results'};let checked='';
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope:unit}),lexical:async()=>[unit],semantic:async()=>[],generate:async()=>({disposition:'ANSWER',sentences:[{text:'We do not guarantee a 40% revenue increase.',kind:'FACT',evidenceIds:['policy']}],missingParts:[]}),verify:async(claims)=>{checked=claims[0];return [{supported:true,evidenceIds:['policy'],reason:'Exact source'}]},recheck:async()=>true};
 const answer=await runSharedAnswer('Can you guarantee a 40% revenue increase?',adapters);
 assert.equal(checked,source);assert.equal(answer.answer,source);assert.equal(answer.disposition,'ANSWER');
 adapters.verify=async()=>[{supported:false,evidenceIds:[],reason:'Rejected'}];
 assert.equal((await runSharedAnswer('Can you guarantee a 40% revenue increase?',adapters)).failureCode,'DRAFT_SUPPORT_REJECTED');
});
test('numeric limitation cannot invent a positive promise, combine sources or substitute unrelated policies',async()=>{
 const {sourceBoundNumericLimitation}=await import('../../lib/rag-numeric-limitation');
 const source='We do not guarantee a specific revenue increase.';
 assert.equal(sourceBoundNumericLimitation('We guarantee 40% revenue increase.','Can you guarantee 40% revenue increase?',[source]),null);
 assert.equal(sourceBoundNumericLimitation('We do not guarantee 40% revenue increase.','Can you guarantee 40% revenue increase?',[source,source]),null);
 assert.equal(sourceBoundNumericLimitation('We do not refund 40% of fees.','Can you refund 40% of fees?',[source]),null);
});


test('all proof reference schemas bind opaque IDs to this request across sources and tenants',async()=>{
 for(const tenant of ['shop-alpha','clinic-beta']) {
  const units:AnswerEvidence[]=['CLAIM','CRAWL','LIVE'].map((kind,i)=>({...evidence[0],propertyId:tenant,id:`${kind.toLowerCase()}:opaque-0o-I1-${tenant}-${i}`,sourceKind:kind as 'CLAIM'|'CRAWL'|'LIVE'}));
  let inspected=false;
  const provider=new SharedAnswerProvider({key:'synthetic',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000},async(_url,init)=>{
   const request=JSON.parse(String(init?.body));
   const properties=request.text.format.schema.properties.reviews.items.properties;
   const allowed=units.map(unit=>unit.id);
   assert.deepEqual(properties.evidenceIds.items.enum,allowed);
   assert.deepEqual(properties.sourceSpans.items.properties.evidenceId.enum,allowed);
   assert.ok(!allowed.some(id=>id.includes(tenant==='shop-alpha'?'clinic-beta':'shop-alpha')));
   inspected=true;
   return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reviews:[{supported:true,evidenceIds:[allowed[0]],reason:'Exact',requestedPartMissing:null,sourceSpans:[{evidenceId:allowed[0],quote:'We can work under an NDA.'}],checks}]})}]}]});
  });
  assert.equal((await provider.verifyClaims(['We can work under an NDA.'],units,'What safeguards are offered?'))[0].supported,true);
  assert.equal(inspected,true);
 }
});
test('one-character corruption of an opaque proof ID is rejected without fuzzy repair',async()=>{
 assert.equal((await review({sourceSpans:[{evidenceId:'polcy',quote:'We can work under an NDA.'}]})).supported,false);
});

test('exact whole approved passages remain supported independently of the requested unit',async()=>{
 const source='The lease includes eight units per week.';const item={...evidence[0],id:'exact',content:source,digest:evidenceDigest(source)};
 const provider=new SharedAnswerProvider({key:'fixture',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000},async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reviews:[{supported:false,evidenceIds:[],reason:'Different requested unit',sourceSpans:[{evidenceId:'exact',quote:source}],checks:{...checks,quantity:false},requestedPartMissing:'Daily count'}]})}]}]}));
 const result=await provider.verifyClaims([source],[item],'How many units per day?');assert.equal(result[0].supported,true);assert.deepEqual(result[0].evidenceIds,['exact']);assert.equal(result[0].requestedPartMissing,'Daily count');
});
test('exact-passage support never repairs a malformed model evidence reference',async()=>{
 assert.equal((await review({sourceSpans:[{evidenceId:'polcy',quote:content}]},content)).supported,false);
});
test('explicit source exclusions retain polarity across grammatical inflections',async()=>{
 const {unsupportedExclusion}=await import('../../lib/shared-answer-engine');
 assert.equal(unsupportedExclusion('Normal wear is not covered.','The warranty excludes normal wear.'),false);
 assert.equal(unsupportedExclusion('Visitors are excluded.','Visitors are welcome.'),true);
});
