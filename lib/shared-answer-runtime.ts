import {normalizeRagQuestion} from './rag-query-normalization';
import {readPublicRagCatalog,liveRagRequest} from './rag-live-read';
import {publicFactRetrievalQueries} from './public-business-facts';
import {withCanonicalRole,type CanonicalIdentity} from './canonical-db-context';
import {type ActiveWebsiteChunk} from './active-website-crawl-retrieval';
import {SharedAnswerProvider,sharedProviderConfig,type AnswerCompositionMode} from './shared-answer-provider';
import {runSharedAnswer,evidenceDigest,type AnswerEvidence,type AnswerScope,type SharedAnswerResult} from './shared-answer-engine';

type RagSnapshot={snapshot_hash:string;crawl_generation:string|null;claim_count:bigint;knowledge_as_of:Date|null};
type RagClaim={entry_id:string;content:string;question:string;title:string;seal_hash:string;field_key:string;entity_key:string;value_hash:string;authority_rank:number;effective_from:Date|null;effective_until:Date|null};

/** One runtime adapter for approved documents and authorised website captures. */
export async function answerFromSharedKnowledge(identity:CanonicalIdentity,question:string,options:{compositionMode?:AnswerCompositionMode}={}):Promise<SharedAnswerResult & {capturedAt:string|null;modelUsage:{inputTokens:number;outputTokens:number}}> {
  question=normalizeRagQuestion(question);
  let provider:SharedAnswerProvider|undefined;
  let active:RagSnapshot|undefined;
  const getProvider=()=>provider??(provider=new SharedAnswerProvider({...sharedProviderConfig(),compositionMode:options.compositionMode}));
  const snapshot=async()=>{
    const rows=await withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<RagSnapshot[]>`SELECT * FROM aifrogi_security.rag_snapshot(${identity.propertyId})`);
    if(rows.length!==1 || !/^[a-f0-9]{64}$/.test(rows[0].snapshot_hash)) throw new Error('SOURCE_STATE_INVALID');
    return rows[0];
  };
  const requests=new Map<string,Promise<AnswerEvidence[]>>();
  const claims=(scope:AnswerScope,query:string,vector:number[]|null=null)=>{
    const key=JSON.stringify([scope,query,vector]);
    let pending=requests.get(key);
    if(!pending) {
      pending=withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<RagClaim[]>`SELECT * FROM aifrogi_security.rag_search_claims(${identity.propertyId},${query},${vector}::double precision[],24)`).then(rows=>rows.map(row=>({
        ...scope,id:`claim:${row.entry_id}`,content:row.content,digest:evidenceDigest(row.content),url:'',title:`${row.title}: ${row.question}`,
        sourceKind:'CLAIM' as const,sourceId:row.entry_id,sourceVersion:row.seal_hash,fieldKey:row.field_key,entityKey:row.entity_key,valueHash:row.value_hash,authorityRank:row.authority_rank,
        effectiveFrom:row.effective_from?.toISOString()??null,effectiveUntil:row.effective_until?.toISOString()??null
      })));
      requests.set(key,pending);
    }
    return pending;
  };
  const crawl=(scope:AnswerScope,rows:ActiveWebsiteChunk[])=>rows.filter(row=>row.generation_id===active?.crawl_generation).map(row=>({
    ...scope,id:`crawl:${row.chunk_id}`,content:row.content,digest:evidenceDigest(row.content),url:row.url,title:row.title,
    sourceKind:'CRAWL' as const,sourceId:row.chunk_id,sourceVersion:row.generation_id,authorityRank:3
  }));
  const result=await runSharedAnswer(question,{
    state:async()=>{active=await snapshot();return active.crawl_generation || Number(active.claim_count)>0 || liveRagRequest(question) ? {state:'READY',scope:{organizationId:identity.organizationId,propertyId:identity.propertyId,generationId:active.snapshot_hash}} : {state:'NO_ACTIVE_SOURCE'};},
    live:(scope,q)=>readPublicRagCatalog(scope,q),
    lexical:async(scope,q)=>{
      const queries=publicFactRetrievalQueries(q);
      const [published,website]=await Promise.all([
        Promise.all(queries.map(query=>claims(scope,query))),
        active?.crawl_generation ? Promise.all(queries.map(query=>withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<ActiveWebsiteChunk[]>`SELECT * FROM aifrogi_security.retrieve_active_website_chunks(${identity.propertyId},${query},12)`))) : Promise.resolve([])
      ]);
      return [...published.flat(),...crawl(scope,website.flat())];
    },
    semantic:async(scope,q)=>{
      const [vector]=await getProvider().embed([q]);
      const outcomes=await Promise.allSettled([
        claims(scope,q,vector),
        active?.crawl_generation ? withCanonicalRole('aifrogi_public',identity,tx=>tx.$queryRaw<ActiveWebsiteChunk[]>`SELECT * FROM aifrogi_security.shared_answer_semantic_chunks(${identity.propertyId},${active!.crawl_generation},${vector}::double precision[],24)`).then(rows=>crawl(scope,rows)) : Promise.resolve([])
      ]);
      for(const outcome of outcomes) if(outcome.status==='rejected' && /SCOPE|DIGEST|ORIGIN|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(String(outcome.reason))) throw outcome.reason;
      if(outcomes.every(o=>o.status==='rejected')) throw new Error('SEMANTIC_RETRIEVAL_UNAVAILABLE');
      return outcomes.flatMap(o=>o.status==='fulfilled'?o.value:[]);
    },
    generate:(q,e)=>getProvider().generate(q,e),
    verify:(c,e,q)=>getProvider().verifyClaims(c,e,q),
    recheck:async(scope)=>(await snapshot()).snapshot_hash===scope.generationId
  });
  return {...result,capturedAt:active?.knowledge_as_of?.toISOString()??null,modelUsage:{inputTokens:provider?.usage.inputTokens??0,outputTokens:provider?.usage.outputTokens??0}};
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
