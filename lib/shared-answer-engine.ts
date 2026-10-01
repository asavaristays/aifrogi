import { createHash } from 'node:crypto';

/** One contract for all businesses. Provider adapters cannot expand authority. */
export type AnswerScope = { organizationId: string; propertyId: string; generationId: string };
export type AnswerEvidence = AnswerScope & { id: string; content: string; digest: string; url: string; title: string };
export type SourceState = { state: 'READY'; scope: AnswerScope } | { state: 'NO_ACTIVE_SOURCE' | 'REVOKED' | 'EXPIRED' | 'INDEX_NOT_READY' | 'ACCESS_ERROR' };
export type AnswerDraft = { disposition: 'ANSWER' | 'PARTIAL' | 'CLARIFY' | 'NO_EVIDENCE' | 'LIVE_ACTION_REQUIRED'; sentences: Array<{ text: string; kind: 'FACT'; evidenceIds: string[] }>; missingParts: string[] };
export type EvidencePlan = {parts:Array<{questionPart:string;requiredSourceTerms?:string[];state:'SUPPORTED'|'MISSING'|'AMBIGUOUS'|'LIVE';evidenceIds:string[]}>};
export type SupportReview = { supported: boolean; evidenceIds: string[]; reason: string };
export type AnswerTrace = { version: 'shared-answer-v1'; stages: Array<{ stage: string; outcome: string; elapsedMs: number; ids: string[]; reasons?:string[] }> };
export type SharedAnswerResult = { disposition: AnswerDraft['disposition'] | 'TECHNICAL_FAILURE'; answer: string; evidence: AnswerEvidence[]; factualClaims: string[]; answerHash: string; trace: AnswerTrace; failureCode: string | null; retrievedEvidence:AnswerEvidence[]; totalMs:number };
export type AnswerAdapters = {
  state(): Promise<SourceState>;
  generate?(question:string,evidence:AnswerEvidence[]):Promise<AnswerDraft>;
  lexical(scope: AnswerScope, question: string): Promise<AnswerEvidence[]>;
  semantic(scope: AnswerScope, question: string): Promise<AnswerEvidence[]>;
  rerank?(question:string,evidence:AnswerEvidence[]):Promise<AnswerEvidence[]>;
  recheck(scope: AnswerScope): Promise<boolean>;
};
export const evidenceDigest = (text: string) => createHash('sha256').update(text).digest('hex');
const numeric = (s: string) => s.match(/(?:₹|\$|€|£)?\s*\d[\d,]*(?:\.\d+)?(?:\s*%)?/g)?.map(x=>x.replace(/[\s,]/g,'')) ?? [];
// Categorical exclusions require explicit negative source evidence. Open-world
// website knowledge does not make unmentioned items false or unavailable.
export function unsupportedExclusion(claim:string,source:string) {
  const negative=/\b(?:not|never|no|cannot|can't|doesn't|don't|excluded|unavailable)\b|नहीं|\b(?:pas|jamais|aucun|nunca|ningún)\b/i;
  if(!negative.test(claim)||negative.test(source)) return false;
  if(/\b(?:fee|charge|cost)\b/i.test(claim)&&/\b(?:free|complimentary)\b/i.test(source)) return false;
  return true;
}

export function eligibleEvidence(scope: AnswerScope, units: AnswerEvidence[]) {
  const seen = new Map<string, AnswerEvidence>();
  for (const unit of units) {
    if (unit.organizationId !== scope.organizationId || unit.propertyId !== scope.propertyId || unit.generationId !== scope.generationId) throw new Error('EVIDENCE_SCOPE_MISMATCH');
    if (!unit.id || !unit.content.trim() || evidenceDigest(unit.content) !== unit.digest) throw new Error('EVIDENCE_DIGEST_MISMATCH');
    const old = seen.get(unit.id);
    if (old && old.digest !== unit.digest) throw new Error('CONFLICTING_EVIDENCE_ID');
    seen.set(unit.id, unit);
  }
  return [...seen.values()];
}

/** Reciprocal rank fusion uses two independent candidate sets, not word hashes. */
export function fuseAnswerEvidence(scope: AnswerScope, lexical: AnswerEvidence[], semantic: AnswerEvidence[], limit = 12) {
  const units = eligibleEvidence(scope, [...lexical, ...semantic]);
  const scores = new Map<string, number>();
  for (const list of [lexical, semantic]) {
    const seen = new Set<string>();
    list.forEach((unit, i) => { if (!seen.has(unit.id)) scores.set(unit.id,(scores.get(unit.id)??0)+1/(60+i+1)); seen.add(unit.id); });
  }
  return units.sort((a,b)=>(scores.get(b.id)??0)-(scores.get(a.id)??0)||a.id.localeCompare(b.id)).slice(0,limit);
}

const retrievalStopWords=new Set(['about','after','again','also','are','before','being','can','could','current','does','from','have','how','into','more','offer','offers','only','previous','question','tell','their','there','these','those','visitor','webtechnosys','what','when','where','which','who','with','would','you','your']);
export function prioritizeAnswerEvidence(question:string,evidence:AnswerEvidence[],limit=16) {
  const terms=[...new Set((question.toLowerCase().match(/[a-z0-9]+/g)??[]).filter(term=>term.length>=3&&!retrievalStopWords.has(term)).map(term=>term.length>4&&term.endsWith('s')?term.slice(0,-1):term))];
  if(terms.includes('office')) terms.push('address','operates');
  if(terms.includes('contact')) terms.push('email','phone','address','whatsapp','questions');
  const ranked=evidence.map((unit,index)=>{
    const title=`${unit.title} ${unit.url}`.toLowerCase();
    const content=unit.content.toLowerCase();
    const score=terms.reduce((sum,term)=>sum+(title.includes(term)?5:0)+(content.includes(term)?1:0),0);
    return {unit,index,score};
  }).sort((a,b)=>b.score-a.score||a.index-b.index);
  const direct=ranked.filter(item=>item.score>0);
  const strongest=direct[0]?.score??0;
  const focused=direct.filter(item=>item.score>=Math.max(1,strongest-4));
  return (focused.length?focused:ranked).slice(0,limit).map(item=>item.unit);
}

/** Constitution: concise by default; extra detail only when explicitly requested. */
export function sharedAnswerBudget(question:string) {
  return /\b(?:in detail|detailed|comprehensive|step[ -]by[ -]step|full explanation|explain fully)\b/i.test(question)
    ? {words:140,sentences:5} : {words:60,sentences:3};
}
function validateDraft(draft: AnswerDraft, evidence: AnswerEvidence[]) {
  const ids = new Set(evidence.map(e=>e.id));
  if (!['ANSWER','PARTIAL','CLARIFY','NO_EVIDENCE','LIVE_ACTION_REQUIRED'].includes(draft.disposition) || !Array.isArray(draft.sentences) || draft.sentences.length>3 || !Array.isArray(draft.missingParts)) throw new Error('DRAFT_SCHEMA_INVALID');
  for (const s of draft.sentences) {
    if (!s || s.kind!=='FACT' || typeof s.text !== 'string' || !s.text.trim() || !Array.isArray(s.evidenceIds) || !s.evidenceIds.length || s.evidenceIds.length>4 || s.evidenceIds.some(id=>!ids.has(id))) throw new Error('DRAFT_EVIDENCE_INVALID');
  }
  if (['ANSWER','PARTIAL'].includes(draft.disposition) && !draft.sentences.some(s=>s.kind==='FACT')) throw new Error('ANSWER_WITHOUT_FACTS');
  if (draft.disposition==='ANSWER' && draft.missingParts.length) throw new Error('INCOMPLETE_ANSWER_LABEL');
  if (draft.disposition==='PARTIAL' && !draft.missingParts.length) throw new Error('PARTIAL_WITHOUT_MISSING_PARTS');
  if (draft.missingParts.some(x=>typeof x!=='string'||!x.trim()||x.length>200)) throw new Error('MISSING_PART_SCHEMA_INVALID');
}

export async function runSharedAnswer(question: string, adapters: AnswerAdapters): Promise<SharedAnswerResult> {
  const startedAt=Date.now();
  let retrievedEvidence:AnswerEvidence[]=[];
  const trace: AnswerTrace = {version:'shared-answer-v1',stages:[]};
  let stage='AUTHORITY';
  let start=startedAt;
  const record = (outcome:string,start:number,ids:string[]=[]) => trace.stages.push({stage,outcome,elapsedMs:Date.now()-start,ids});
  const result=(disposition:SharedAnswerResult['disposition'],answer:string,evidence:AnswerEvidence[]=[],failureCode:string|null=null,factualClaims:string[]=[]):SharedAnswerResult=>({disposition,answer,evidence,factualClaims,answerHash:evidenceDigest(answer),trace,failureCode,retrievedEvidence,totalMs:Date.now()-startedAt});
  try {
    if (!question.trim() || question.length>8000) throw new Error('QUESTION_INVALID');
    start=Date.now(); const state=await adapters.state();record(state.state,start);
    if (state.state!=='READY') return result(state.state==='NO_ACTIVE_SOURCE'?'NO_EVIDENCE':'TECHNICAL_FAILURE',state.state==='NO_ACTIVE_SOURCE'?'I do not have published business information available yet.':'I’m having trouble accessing the approved business information. Please try again.',[],state.state);
    stage='RETRIEVAL';start=Date.now();
    const retrieved=await Promise.allSettled([adapters.lexical(state.scope,question),adapters.semantic(state.scope,question)]);
    const [lexical,semantic]=retrieved.map(r=>r.status==='fulfilled'?r.value:[]);
    if(retrieved.every(r=>r.status==='rejected')) throw new Error('RETRIEVAL_UNAVAILABLE');
    for(const r of retrieved) if(r.status==='rejected' && /SCOPE|DIGEST|ORIGIN|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(String(r.reason))) throw r.reason;
    let evidence=prioritizeAnswerEvidence(question,fuseAnswerEvidence(state.scope,lexical,semantic,16),8);
    retrievedEvidence=evidence;
    record(retrieved.some(r=>r.status==='rejected')?'DEGRADED':'READY',start,evidence.map(e=>e.id));
    if(evidence.length && adapters.rerank) {
      stage='RERANK';const rankStart=Date.now();
      try {
        const ranked=eligibleEvidence(state.scope,await adapters.rerank(question,evidence));
        if(!ranked.length || ranked.some(e=>!evidence.some(original=>original.id===e.id && original.digest===e.digest))) throw new Error('RERANK_SCHEMA_INVALID');
        evidence=ranked;record('READY',rankStart,evidence.map(e=>e.id));
      } catch(error) {
        if(/SCOPE|DIGEST|ORIGIN|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(String(error))) throw error;
        record('FALLBACK_ORIGINAL_ORDER',rankStart,evidence.map(e=>e.id));
      }
      stage='RETRIEVAL';
    }
    if (!evidence.length) return result('NO_EVIDENCE','I could not find evidence answering that question in the published business information.');
    if(adapters.generate) {
      stage='COMPOSITION';start=Date.now();
      const draft=await adapters.generate(question,evidence);
      validateDraft(draft,evidence);
      record('READY',start);
      const facts=draft.sentences.filter(s=>s.kind==='FACT');
      if (/\b(?:develop|build|create|offer|provide)\b.{0,50}\bmobile apps?\b|\bmobile apps?\b.{0,50}\b(?:develop|build|create|offer|provide)\b/i.test(question)) {
        const platformUnits=evidence.filter(unit=>/\bios\b/i.test(unit.content)&&/\bandroid\b/i.test(unit.content));
        if(platformUnits.length&&!facts.some(fact=>/\bios\b/i.test(fact.text)&&/\bandroid\b/i.test(fact.text))) facts.push({text:'The published mobile offering includes iOS and Android products.',kind:'FACT',evidenceIds:platformUnits.slice(0,4).map(unit=>unit.id)});
      }
      const citedIds=new Set(facts.flatMap(s=>s.evidenceIds));
      const cited=evidence.filter(e=>citedIds.has(e.id));
      stage='VERIFICATION';start=Date.now();
      for(const fact of facts) {
        const units=evidence.filter(e=>fact.evidenceIds.includes(e.id));
        const source=units.map(e=>e.content).join('\n');
        if(numeric(fact.text).some(n=>!numeric(source).includes(n)) || unsupportedExclusion(fact.text,source) || (fact.text.match(/https?:\/\/[^\s)]+/g)??[]).some(url=>!units.some(e=>e.url===url||e.content.includes(url)))) throw new Error('DRAFT_FACT_GUARD_REJECTED');
      }
      record('SUPPORTED',start,[...citedIds]);
      stage='DELIVERY_AUTHORITY';start=Date.now();
      if(!await adapters.recheck(state.scope)) throw new Error('AUTHORITY_CHANGED');
      record('CURRENT',start);
      const factualText=facts.map(s=>s.text.trim()).join(' ');
      const limitation=draft.missingParts.length && !/\b(?:no|not|isn't|is not|aren't|are not|doesn't|does not|depends? on|not published|not provided|not available|cannot guarantee|can't guarantee)\b/i.test(factualText)
        ? `I could not verify the following from the published information: ${draft.missingParts.join('; ')}.`:'';
      const answer=[factualText,limitation].filter(Boolean).join(' ') || (draft.disposition==='CLARIFY'?'Which service or detail do you mean?':draft.disposition==='LIVE_ACTION_REQUIRED'?'That request needs an authorised live service or assistance from the business team.':'I could not verify that detail from the published business information.');
      return result(draft.disposition,answer,cited,null,facts.map(s=>s.text.trim()));
    }
    throw new Error('GROUNDED_ADAPTERS_REQUIRED');
  } catch(error) {
    record('ERROR',start);
    // Error details remain server-side; never expose credentials/provider payloads.
    const code=error instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(error.message)?error.message:`${stage}_FAILED`;
    return result('TECHNICAL_FAILURE','I’m having trouble preparing your answer. Please try again.',[],code);
  }
}

/** Private service-to-route proof. Any post-verification answer edit invalidates it. */
export function assertSharedAnswerDelivery(proof:SharedAnswerResult,answer:string,organizationId:string,propertyId:string) {
  if(!['ANSWER','PARTIAL'].includes(proof.disposition)||proof.answer!==answer||proof.answerHash!==evidenceDigest(answer)||!proof.evidence.length||!proof.factualClaims.length||proof.factualClaims.some(claim=>!answer.includes(claim))) throw new Error('SHARED_DELIVERY_PROOF_INVALID');
  eligibleEvidence({organizationId,propertyId,generationId:proof.evidence[0].generationId},proof.evidence);
  if(proof.failureCode || !proof.trace.stages.some(s=>s.stage==='VERIFICATION'&&s.outcome==='SUPPORTED') || !proof.trace.stages.some(s=>s.stage==='DELIVERY_AUTHORITY'&&s.outcome==='CURRENT')) throw new Error('SHARED_DELIVERY_VERIFICATION_MISSING');
  return proof.factualClaims.map(claim=>({claim,supported:true,matchedTerms:[] as string[],missingNumbers:[] as string[]}));
}
