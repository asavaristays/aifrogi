import {publicFactRetrievalQuery,publicFactRetrievalQueries} from './public-business-facts';
import {withCanonicalRole,type CanonicalIdentity} from './canonical-db-context';
import {type ActiveWebsiteChunk} from './active-website-crawl-retrieval';
import {SharedAnswerProvider,sharedProviderConfig} from './shared-answer-provider';
import {runSharedAnswer,evidenceDigest,type AnswerEvidence,type AnswerScope,type SharedAnswerResult} from './shared-answer-engine';

export async function answerFromSharedCrawl(identity:CanonicalIdentity,question:string):Promise<SharedAnswerResult & {capturedAt:string|null;modelUsage:{inputTokens:number;outputTokens:number}}> {
  let capturedAt:string|null=null;
  let sourceUrl:string|null=null;
  let provider:SharedAnswerProvider|undefined;
  const getProvider=()=>provider??(provider=new SharedAnswerProvider(sharedProviderConfig()));
  const state=async()=>{
    sourceUrl=await resolveSharedCrawlSource(identity);
    const rows=await withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<Array<{state:string;generation_id:string|null;base_url:string|null;captured_at:string|null}>>`SELECT * FROM aifrogi_security.shared_answer_source_state(${identity.propertyId})`);
    const value=rows[0];if(!value || !['READY','NO_ACTIVE_SOURCE','REVOKED','EXPIRED','INDEX_NOT_READY'].includes(value.state)) throw new Error('SOURCE_STATE_INVALID');
    if(value.state === 'READY' && (!value.base_url || new URL(value.base_url).origin !== new URL(sourceUrl!).origin)) throw new Error('SOURCE_ORIGIN_MISMATCH');
    capturedAt=value.captured_at ? new Date(value.captured_at).toISOString() : null;
    return value;
  };
  const evidence=(scope:AnswerScope,rows:ActiveWebsiteChunk[]):AnswerEvidence[]=>rows.map(row=>{
    if(new URL(row.url).origin !== new URL(sourceUrl!).origin) throw new Error('SOURCE_ORIGIN_MISMATCH');
    return {...scope,generationId:row.generation_id,id:row.chunk_id,content:row.content,digest:evidenceDigest(row.content),url:row.url,title:row.title};
  });
  const sheetRequests=new Map<string,Promise<AnswerEvidence[]>>();
  const loadSpreadsheetEvidence=async(scope:AnswerScope,query:string)=>{
    // Published workbook evidence is scoped and checked by the same database
    // authority as crawl evidence, including contact queries.
    const rows=await searchCanonicalPublicCrawlEvidence(identity,publicFactRetrievalQuery(query),3);
    return rows.map(row=>({...scope,generationId:row.generation_id,id:row.chunk_id,content:row.content,digest:evidenceDigest(row.content),url:row.url,title:row.title}));
  };
  const spreadsheetEvidence=(scope:AnswerScope,query:string)=>{
    const key=JSON.stringify([scope.organizationId,scope.propertyId,scope.generationId,query]);
    let pending=sheetRequests.get(key);
    if(!pending){pending=loadSpreadsheetEvidence(scope,query);sheetRequests.set(key,pending);}
    return pending;
  };
  const result=await runSharedAnswer(question,{
    state:async()=>{
      try {const active=await state();return active.state==='READY' && active.generation_id?{state:'READY',scope:{organizationId:identity.organizationId,propertyId:identity.propertyId,generationId:active.generation_id}}:{state:active.state as 'NO_ACTIVE_SOURCE'|'REVOKED'|'EXPIRED'|'INDEX_NOT_READY'};}
      catch{return {state:'ACCESS_ERROR'};}
    },
    lexical:async (scope,query)=>{
      const [sheet,website]=await Promise.all([
        spreadsheetEvidence(scope,query),
        Promise.all(publicFactRetrievalQueries(query).map(search=>withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<ActiveWebsiteChunk[]>`SELECT * FROM aifrogi_security.retrieve_active_website_chunks(${identity.propertyId},${search},12)`))).then(groups=>groups.flat())
      ]);
      // Approved spreadsheet rows are owner-controlled and therefore precede
      // crawl passages. The shared engine still verifies every delivered fact.
      return [...sheet,...evidence(scope,website)];
    },
    semantic:async (scope,query)=>{
      const [[vector],sheet]=await Promise.all([getProvider().embed([query]),spreadsheetEvidence(scope,query)]);
      const website=evidence(scope,await withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<ActiveWebsiteChunk[]>`SELECT * FROM aifrogi_security.shared_answer_semantic_chunks(${identity.propertyId},${scope.generationId},${vector}::double precision[],24)`));
      return [...sheet,...website];
    },
    // Fusion is deterministic; avoid a model ranking call on the normal path.
    generate:(q,e)=>getProvider().generate(q,e),
    recheck:async scope=>{const current=await state();return current.state==='READY'&&current.generation_id===scope.generationId;}
  });
  return {...result,capturedAt,modelUsage:{inputTokens:provider?.usage.inputTokens??0,outputTokens:provider?.usage.outputTokens??0}};
}

/** Formatting and existing qualification prompts happen after composition.
 * Reverify altered bytes rather than treating an earlier draft as delivery proof. */
export async function verifySharedRenderedAnswer(proof:SharedAnswerResult,answer:string,identity:CanonicalIdentity) {
  const {assertSharedAnswerDelivery}=await import('./shared-answer-engine');
  if(proof.answer===answer) {assertSharedAnswerDelivery(proof,answer,identity.organizationId,identity.propertyId);return {proof,usage:{inputTokens:0,outputTokens:0}};}
  const provider=new SharedAnswerProvider(sharedProviderConfig());
  const {validateGeneratedClaims}=await import('./sovereign-intelligence/claim-validator');
  const hard=validateGeneratedClaims({answer,approvedContext:proof.evidence.map(e=>`${e.url}\n${e.content}`).join('\n'),connectorVerified:false});
  if(!hard.valid) throw new Error('RENDERED_FACT_GUARD_REJECTED');
  const review=await provider.verify(answer,proof.evidence);
  if(!review.supported||!review.evidenceIds.length||review.evidenceIds.some(id=>!proof.evidence.some(e=>e.id===id))) throw new Error('RENDERED_EVIDENCE_REJECTED');
  const updated={...proof,answer,answerHash:evidenceDigest(answer),factualClaims:[answer]};
  assertSharedAnswerDelivery(updated,answer,identity.organizationId,identity.propertyId);
  return {proof:updated,usage:provider.usage};
}

export function recordSharedAnswerTrace(identity:CanonicalIdentity,evidenceId:string,proof:SharedAnswerResult) {
  return withCanonicalRole('aifrogi_web',identity,tx=>tx.$executeRaw`SELECT aifrogi_security.record_shared_answer_trace(${identity.propertyId},${evidenceId},${proof.disposition},${proof.failureCode},${JSON.stringify(proof.trace)}::jsonb)`);
}

export async function resolveSharedCrawlSource(identity:CanonicalIdentity) {
  const role=identity.purpose==='KNOWLEDGE_CAPTURE'?'aifrogi_worker':'aifrogi_public';
  const rows=await withCanonicalRole(role,identity,tx=>tx.$queryRaw<Array<{source_url:string}>>`SELECT * FROM aifrogi_security.shared_answer_configured_source(${identity.propertyId})`);
  if(rows.length!==1 || !/^https?:\/\//.test(rows[0].source_url)) throw new Error('CONFIGURED_SOURCE_INVALID');
  return rows[0].source_url.replace(/\/+$/,'');
}

export function searchCanonicalPublicClaims(identity:CanonicalIdentity,question:string,limit=3) {
  return withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<Array<{entry_id:string;answer:string;category:string;score:number}>>
    `SELECT * FROM aifrogi_security.search_canonical_public_claims(${identity.propertyId},${question},${limit})`);
}

export function searchCanonicalPublicCrawlEvidence(identity:CanonicalIdentity,question:string,limit=3) {
  return withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<Array<{entry_id:string;generation_id:string;chunk_id:string;url:string;title:string;content:string;category:string;score:number}>>
    `SELECT * FROM aifrogi_security.search_canonical_public_crawl_evidence(${identity.propertyId},${question},${limit})`);
}
