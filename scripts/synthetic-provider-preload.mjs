// Explicit opt-in for local rehearsals. Never loaded by production code.
if (process.env.AIFROGI_SYNTHETIC_PROVIDER !== 'local-only' || !/^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/p2b_rehearsal/.test(process.env.DATABASE_URL || '')) throw Error('LOCAL_SYNTHETIC_PROVIDER_ONLY');
const realFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
  const url=String(input);
  if(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) return realFetch(input,init);
  if(!url.startsWith('https://api.openai.com/v1/')) throw Error('EXTERNAL_IO_FORBIDDEN_IN_REHEARSAL');
  if(init?.headers?.Authorization!=='Bearer synthetic-local-rehearsal') throw Error('SYNTHETIC_CREDENTIAL_REQUIRED');
  const body=JSON.parse(String(init.body));
  if(url.endsWith('/embeddings')) return Response.json({data:body.input.map((_,index)=>({index,embedding:[1,...Array(511).fill(0)]})),usage:{prompt_tokens:1}});
  const payload=JSON.parse(body.input);
  const evidence=payload.evidence;
  let value;
  if(body.text.format.name==='grounded_answer_v4') {
    const row=evidence.find(row=>row.content==='Check-in is at 2 PM.');
    if(!row) throw Error('EXPECTED_SYNTHETIC_EVIDENCE_MISSING');
    value={coveragePlan:[],disposition:'ANSWER',sentences:[{text:row.content,kind:'FACT',evidenceIds:[row.id]}],missingParts:[]};
  } else if(body.text.format.name==='business_support_batch_v1') {
    value={reviews:payload.claims.map(claim=>{const row=evidence.find(row=>row.content===claim);return {supported:Boolean(row),evidenceIds:row?[row.id]:[],sourceSpans:row?[{evidenceId:row.id,quote:claim}]:[],checks:{actor:true,relationship:true,modality:true,conditions:true,polarity:true,quantity:true},requestedPartMissing:null,reason:'Exact synthetic source'};})};
  } else throw Error('UNEXPECTED_SYNTHETIC_PROVIDER_SCHEMA');
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:1,output_tokens:1}});
};
