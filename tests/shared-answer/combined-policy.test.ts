import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedAnswerProvider,type AnswerCompositionMode} from '../../lib/shared-answer-provider';
import {evidenceDigest,type AnswerEvidence} from '../../lib/shared-answer-engine';
const evidence:AnswerEvidence[]=[{organizationId:'org',propertyId:'tenant',generationId:'snapshot',id:'approved',content:'Projects use milestone payments.',digest:evidenceDigest('Projects use milestone payments.'),title:'Payments',url:'https://example.com/payments'}];
function provider(mode:AnswerCompositionMode,requests:Array<any>){
 return new SharedAnswerProvider({key:'synthetic-test-only',model:'fixture',embeddingModel:'fixture',dimensions:512,timeoutMs:1000,compositionMode:mode},async(_url,init)=>{
  const body=JSON.parse(String(init?.body));requests.push(body);
  const result=body.text.format.name==='grounded_answer_v4'?{disposition:'ANSWER',sentences:[{text:'Projects use milestone payments. Would you like booking details?',kind:'FACT',evidenceIds:['approved']}],missingParts:[]}:{reviews:[{supported:true,evidenceIds:['approved'],reason:'fixture review',sourceSpans:[{evidenceId:'approved',quote:evidence[0].content}],checks:{actor:true,relationship:true,modality:true,conditions:true,polarity:true,quantity:true},requestedPartMissing:null}]};
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
 });
}
test('combined uses existing policy and RAG grounding with one composition and one verification',async()=>{
 const requests:any[]=[];const p=provider('combined',requests);const draft=await p.generate('How are payments structured?',evidence);
 assert.equal(draft.sentences[0].text,'Projects use milestone payments.');
 await p.verifyClaims([draft.sentences[0].text],evidence,'How are payments structured?');
 assert.equal(requests.length,2);assert.ok(requests.every(request=>request.store===false));assert.match(requests[0].instructions,/Sovereign Intelligence Constitution/);assert.match(requests[0].instructions,/Every factual sentence must cite/);
});
test('combined rejects unsupported numbers even when batch model incorrectly approves',async()=>{
 const requests:any[]=[];const reviews=await provider('combined',requests).verifyClaims(['The project costs ₹90000.'],evidence,'What is the price?');
 assert.equal(reviews[0].supported,false);assert.match(reviews[0].reason,/UNSUPPORTED_NUMBER/);assert.equal(requests.length,1);
});
test('existing policy reference stays distinct from unchanged default RAG policy',async()=>{
 const existing:any[]=[];const rag:any[]=[];await provider('existing-policy',existing).generate('What can you do?',evidence);await provider('rag',rag).generate('What can you do?',evidence);
 assert.match(existing[0].instructions,/Sovereign Intelligence Constitution/);assert.doesNotMatch(rag[0].instructions,/Sovereign Intelligence Constitution/);
});

test('missing detail explanations cannot become unverified business assertions in the delivered limitation',async()=>{
 const p=new SharedAnswerProvider({key:'synthetic-test-only',model:'fixture',embeddingModel:'fixture',dimensions:512,timeoutMs:1000},async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({coveragePlan:[{requestedPart:'daily quantity',publishedFacts:[],missingDetail:'The business does not provide daily deliveries.'},{requestedPart:'unasked detail',publishedFacts:[],missingDetail:'null'}],disposition:'PARTIAL',sentences:[],missingParts:['daily quantity']})}]}]}));
 const draft=await p.generate('What is the daily quantity?',evidence);
 assert.deepEqual(draft.missingParts,['daily quantity']);
});
