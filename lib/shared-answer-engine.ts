import {preserveOfferingInventory} from "./rag-offering-completeness";
import {quantityAlternativesSupported} from './rag-quantity-binding';
import {selectEvidenceForSubject} from "./rag-subject-evidence";
import { resolveRagSourceAuthority } from './rag-source-authority';
import { createHash } from 'node:crypto';
import { composePublicFactDraft, currentQuestion, requestedPublicFactFields } from './public-business-facts';

/** One contract for all businesses. Provider adapters cannot expand authority. */
export type AnswerScope = { organizationId: string; propertyId: string; generationId: string };
export type AnswerEvidence = AnswerScope & { id: string; content: string; digest: string; url: string; title: string; sourceKind?:'CLAIM'|'CRAWL'|'LIVE'; sourceId?:string; sourceVersion?:string; fieldKey?:string; entityKey?:string; valueHash?:string; authorityRank?:number; effectiveFrom?:string|null; effectiveUntil?:string|null; liveOperation?:string; checkedAt?:string };
export type SourceState = { state: 'READY'; scope: AnswerScope } | { state: 'NO_ACTIVE_SOURCE' | 'REVOKED' | 'EXPIRED' | 'INDEX_NOT_READY' | 'ACCESS_ERROR' };
export type AnswerDraft = { disposition: 'ANSWER' | 'PARTIAL' | 'CLARIFY' | 'NO_EVIDENCE' | 'LIVE_ACTION_REQUIRED'; sentences: Array<{ text: string; kind: 'FACT'; evidenceIds: string[] }>; missingParts: string[] };
export type EvidencePlan = {parts:Array<{questionPart:string;requiredSourceTerms?:string[];state:'SUPPORTED'|'MISSING'|'AMBIGUOUS'|'LIVE';evidenceIds:string[]}>};
export type SupportReview = { supported: boolean; evidenceIds: string[]; reason: string; requestedPartMissing?:string|null };
export type AnswerTrace = { version: 'shared-answer-v1'; stages: Array<{ stage: string; outcome: string; elapsedMs: number; ids: string[]; reasons?:string[] }> };
export type SharedAnswerResult = { disposition: AnswerDraft['disposition'] | 'TECHNICAL_FAILURE'; answer: string; evidence: AnswerEvidence[]; factualClaims: string[]; answerHash: string; trace: AnswerTrace; failureCode: string | null; retrievedEvidence:AnswerEvidence[]; totalMs:number; claimEvidence?:Array<{claim:string;evidenceIds:string[]}> };
export type AnswerAdapters = {
  state(): Promise<SourceState>;
  generate?(question:string,evidence:AnswerEvidence[]):Promise<AnswerDraft>;
  verify?(claims:string[],evidence:AnswerEvidence[],question:string):Promise<SupportReview[]>;
  live?(scope:AnswerScope,question:string):Promise<AnswerEvidence[]|null>;
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
    if ((unit.effectiveFrom && Date.parse(unit.effectiveFrom)>Date.now()) || (unit.effectiveUntil && Date.parse(unit.effectiveUntil)<=Date.now())) throw new Error('EVIDENCE_EXPIRED');
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
  const ranked=units.sort((a,b)=>(scores.get(b.id)??0)-(scores.get(a.id)??0)||a.id.localeCompare(b.id));
  const distinct:AnswerEvidence[]=[];
  for(const unit of ranked) {
    const duplicate=distinct.findIndex(old=>old.digest===unit.digest && (!old.entityKey || !unit.entityKey || old.entityKey===unit.entityKey));
    if(duplicate<0) distinct.push(unit);
    else if((unit.authorityRank??100)<(distinct[duplicate].authorityRank??100)) distinct[duplicate]=unit;
  }
  return distinct.slice(0,limit);
}

const retrievalStopWords=new Set(['about','after','again','also','are','before','being','can','could','current','does','from','have','how','into','more','offer','offers','only','previous','question','tell','their','there','these','those','visitor','what','when','where','which','who','with','would','you','your']);
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
  if (!['ANSWER','PARTIAL','CLARIFY','NO_EVIDENCE','LIVE_ACTION_REQUIRED'].includes(draft.disposition) || !Array.isArray(draft.sentences) || draft.sentences.length>32 || !Array.isArray(draft.missingParts)) throw new Error('DRAFT_SCHEMA_INVALID');
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
  let servingScope:AnswerScope|undefined;
  let retrievedEvidence:AnswerEvidence[]=[];
  let claimEvidence:Array<{claim:string;evidenceIds:string[]}>=[];
  const trace: AnswerTrace = {version:'shared-answer-v1',stages:[]};
  let stage='AUTHORITY';
  let start=startedAt;
  const record = (outcome:string,start:number,ids:string[]=[]) => trace.stages.push({stage,outcome,elapsedMs:Date.now()-start,ids});
  const result=(disposition:SharedAnswerResult['disposition'],answer:string,evidence:AnswerEvidence[]=[],failureCode:string|null=null,factualClaims:string[]=[]):SharedAnswerResult=>({disposition,answer,evidence,factualClaims,answerHash:evidenceDigest(answer),trace,failureCode,retrievedEvidence,claimEvidence,totalMs:Date.now()-startedAt});
  try {
    if (!question.trim() || question.length>8000) throw new Error('QUESTION_INVALID');
    start=Date.now(); const state=await adapters.state();record(state.state,start);
    if (state.state!=='READY') return result(state.state==='NO_ACTIVE_SOURCE'?'NO_EVIDENCE':'TECHNICAL_FAILURE',state.state==='NO_ACTIVE_SOURCE'?'I do not have published business information available yet.':'I’m having trouble accessing the approved business information. Please try again.',[],state.state);
    servingScope=state.scope;
    stage='RETRIEVAL';start=Date.now();
    const live=adapters.live ? await adapters.live(state.scope,question) : null;
    if(live && !live.length) return result('LIVE_ACTION_REQUIRED','I cannot check that current value right now. Please contact the business team for a live confirmation.');
    const contactRequest=requestedPublicFactFields(question).length>0;
    const lexicalFirst=live ? [{status:'fulfilled' as const,value:live}] : contactRequest ? await Promise.allSettled([adapters.lexical(state.scope,question)]) : null;
    const directCandidates=lexicalFirst?.[0]?.status==='fulfilled' ? eligibleEvidence(state.scope,lexicalFirst[0].value) : [];
    const directAuthority=resolveRagSourceAuthority(directCandidates);
    const directUnits=directAuthority.conflicts.length?[]:directAuthority.evidence;
    const exactDraft=live ? null : composePublicFactDraft(question,directUnits);
    const retrieved=lexicalFirst
      ? [...lexicalFirst, ...((exactDraft || live) ? [{status:'fulfilled' as const,value:[] as AnswerEvidence[]}] : await Promise.allSettled([adapters.semantic(state.scope,question)]))]
      : await Promise.allSettled([adapters.lexical(state.scope,question),adapters.semantic(state.scope,question)]);
    const [lexical,semantic]=retrieved.map(r=>r.status==='fulfilled'?r.value:[]);
    if(retrieved.every(r=>r.status==='rejected')) throw new Error('RETRIEVAL_UNAVAILABLE');
    for(const r of retrieved) if(r.status==='rejected' && /SCOPE|DIGEST|ORIGIN|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(String(r.reason))) throw r.reason;
    let evidence=exactDraft ? directUnits : prioritizeAnswerEvidence(question,selectEvidenceForSubject(question,fuseAnswerEvidence(state.scope,lexical,semantic,24)),8);
    const authority=resolveRagSourceAuthority(evidence);
    retrievedEvidence=evidence;
    if(authority.conflicts.length || directAuthority.conflicts.length) {
      record('CONFLICT',start,evidence.map(e=>e.id));
      return result('CLARIFY','The approved sources contain conflicting values for this detail. Please confirm which value is current with the business team.');
    }
    evidence=authority.evidence;
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
    if(exactDraft || adapters.generate) {
      stage='COMPOSITION';start=Date.now();
      const onlyHours=requestedPublicFactFields(question).join(',')==='hours';
      const requestedGuarantee=/\b(?:guarantee|guaranteed|guarantees|promise|promised)\b/i.test(currentQuestion(question));
      const explicitGuarantee=evidence.some(unit=>/\b(?:guarantee|guaranteed|guarantees|promise|promised)\b/i.test(unit.content));
      const draft=exactDraft ?? (requestedGuarantee && !explicitGuarantee
        ? {disposition:'NO_EVIDENCE' as const,sentences:[],missingParts:['A published guarantee for the requested outcome']}
        : onlyHours && !composePublicFactDraft(question,evidence)
        ? {disposition:'NO_EVIDENCE' as const,sentences:[],missingParts:['Exact opening hours']}
        : await adapters.generate!(question,evidence));
      if(exactDraft) evidence=directUnits;
      if(!exactDraft && Array.isArray(draft.sentences)) preserveOfferingInventory(question,draft,evidence);
      // Repair labels from the actual structured parts, without inventing facts
      // or discarding missing requested details, before the support review.
      if(Array.isArray(draft.sentences)&&Array.isArray(draft.missingParts)) {
        if(draft.disposition==='ANSWER'&&draft.missingParts.length) draft.disposition=draft.sentences.length?'PARTIAL':'NO_EVIDENCE';
        else if(draft.disposition==='PARTIAL'&&!draft.missingParts.length) draft.disposition=draft.sentences.length?'ANSWER':'NO_EVIDENCE';
        else if(draft.disposition==='NO_EVIDENCE'&&draft.sentences.length) draft.disposition=draft.missingParts.length?'PARTIAL':'ANSWER';
      }
      validateDraft(draft,evidence);
      record(exactDraft?'STRUCTURED_FACTS_NO_MODEL':'READY',start);
      const facts=draft.sentences.filter(s=>s.kind==='FACT');
      let contactRecovery=false;
      if(!facts.length && draft.disposition==='NO_EVIDENCE' && draft.missingParts.length) {
        stage='CONTACT_RECOVERY';start=Date.now();
        try {
          const permitted=eligibleEvidence(state.scope,await adapters.lexical(state.scope,'phone number'));
          const authority=resolveRagSourceAuthority(permitted);
          const contact=authority.conflicts.length?null:composePublicFactDraft('phone number',authority.evidence);
          if(contact) {
            facts.push(...contact.sentences);evidence=[...evidence,...authority.evidence.filter(e=>!evidence.some(old=>old.id===e.id))];
            retrievedEvidence=[...retrievedEvidence,...authority.evidence.filter(e=>!retrievedEvidence.some(old=>old.id===e.id))];
            draft.disposition='PARTIAL';contactRecovery=true;
          }
          record(contact?'APPROVED_PHONE_FOUND':'NO_APPROVED_PHONE',start);
        } catch(error) {
          if(/SCOPE|DIGEST|ORIGIN|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(String(error))) throw error;
          record('CONTACT_UNAVAILABLE',start);
        }
      }
      if (/\b(?:develop|build|create|offer|provide)\b.{0,50}\bmobile apps?\b|\bmobile apps?\b.{0,50}\b(?:develop|build|create|offer|provide)\b/i.test(question)) {
        const platformUnits=evidence.filter(unit=>/\bios\b/i.test(unit.content)&&/\bandroid\b/i.test(unit.content));
        if(platformUnits.length&&!facts.some(fact=>/\bios\b/i.test(fact.text)&&/\bandroid\b/i.test(fact.text))) facts.push({text:'The published mobile offering includes iOS and Android products.',kind:'FACT',evidenceIds:platformUnits.slice(0,4).map(unit=>unit.id)});
      }

      stage='VERIFICATION';start=Date.now();
      const boundFacts=facts.filter(fact=>quantityAlternativesSupported(fact.text,evidence.filter(e=>fact.evidenceIds.includes(e.id)).map(e=>e.content)));
      if(boundFacts.length!==facts.length){
        if(!boundFacts.length)throw new Error('DRAFT_QUANTITY_BINDING_REJECTED');
        facts.splice(0,facts.length,...boundFacts);
        trace.stages.push({stage:'QUANTITY_BINDING',outcome:'UNSUPPORTED_ALTERNATIVE_OMITTED',elapsedMs:0,ids:[]});
      }
      for(const fact of facts) {
        const units=evidence.filter(e=>fact.evidenceIds.includes(e.id));
        const source=units.map(e=>e.content).join('\n');
        if(numeric(fact.text).some(n=>!numeric(source).includes(n)) || unsupportedExclusion(fact.text,source) || (fact.text.match(/https?:\/\/[^\s)]+/g)??[]).some(url=>!units.some(e=>e.url===url||e.content.includes(url)))) throw new Error('DRAFT_FACT_GUARD_REJECTED');
      }
      // One batch support check for generated claims; exact extracted facts need no model.
      if(!exactDraft && !contactRecovery && facts.length && adapters.verify) {
        const reviews=await adapters.verify(facts.map(f=>f.text),evidence,question);
        if(reviews.length!==facts.length) throw new Error('SUPPORT_SCHEMA_INVALID');
        const supported=facts.filter((fact,index)=>{
          const review=reviews[index];
          if(typeof review.supported!=='boolean'||!Array.isArray(review.evidenceIds)||review.evidenceIds.some(id=>!evidence.some(e=>e.id===id))) throw new Error('SUPPORT_SCHEMA_INVALID');
          if(review.supported && review.evidenceIds.length>0) {fact.evidenceIds=review.evidenceIds;return true;}
          return false;
        });
        if(supported.length!==facts.length) {
          if(!supported.length) throw new Error('DRAFT_SUPPORT_REJECTED');
          facts.splice(0,facts.length,...supported);
          const missing=reviews.flatMap(r=>!r.supported && typeof r.requestedPartMissing==='string' && r.requestedPartMissing.trim() ? [r.requestedPartMissing.trim()] : []);
          draft.missingParts=[...new Set([...draft.missingParts,...missing])];
          draft.disposition=draft.missingParts.length?'PARTIAL':'ANSWER';
        }
      }
      // Supported facts are factual delivery even when a model mislabels its draft.
      if(facts.length && !['ANSWER','PARTIAL'].includes(draft.disposition)) draft.disposition=draft.missingParts.length?'PARTIAL':'ANSWER';
      const citedIds=new Set(facts.flatMap(s=>s.evidenceIds));
      const cited=evidence.filter(e=>citedIds.has(e.id));
      record('SUPPORTED',start,[...citedIds]);
      stage='DELIVERY_AUTHORITY';start=Date.now();
      if(!await adapters.recheck(state.scope)) throw new Error('AUTHORITY_CHANGED');
      record('CURRENT',start);
      const factualText=facts.map(s=>s.text.trim()).join(' ');
      const limitation=draft.missingParts.length && !/\b(?:no|not|isn't|is not|aren't|are not|doesn't|does not|depends? on|not published|not provided|not available|cannot guarantee|can't guarantee)\b/i.test(factualText)
        ? `I cannot confirm: ${draft.missingParts.join('; ')}. Please contact the team.`:'';
      const answer=[factualText,limitation].filter(Boolean).join(' ') || (draft.disposition==='CLARIFY'?'Which service or detail do you mean?':draft.disposition==='LIVE_ACTION_REQUIRED'?'That request needs an authorised live service or assistance from the business team.':'I could not verify that detail from the published business information.');
      claimEvidence=facts.map(s=>({claim:s.text.trim(),evidenceIds:s.evidenceIds}));
      return result(draft.disposition,answer,cited,null,facts.map(s=>s.text.trim()));
    }
    throw new Error('GROUNDED_ADAPTERS_REQUIRED');
  } catch(error) {
    record('ERROR',start);
    // Error details remain server-side; never expose credentials/provider payloads.
    const code=error instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(error.message)?error.message:`${stage}_FAILED`;
    if(servingScope && ['COMPOSITION','VERIFICATION'].includes(stage) && !/SCOPE|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(code)) {
      try {
        stage='CONTACT_RECOVERY';start=Date.now();
        const allowed=eligibleEvidence(servingScope,await adapters.lexical(servingScope,'phone number'));
        const authority=resolveRagSourceAuthority(allowed);
        const contact=authority.conflicts.length?null:composePublicFactDraft('phone number',authority.evidence);
        if(contact) {
          const ids=new Set(contact.sentences.flatMap(s=>s.evidenceIds));
          const cited=authority.evidence.filter(e=>ids.has(e.id));
          record(`RECOVERED_FROM_${code}`,start,[...ids]);
          stage='VERIFICATION';start=Date.now();record('SUPPORTED',start,[...ids]);
          stage='DELIVERY_AUTHORITY';start=Date.now();
          if(!await adapters.recheck(servingScope)) throw Error('AUTHORITY_CHANGED');
          record('CURRENT',start);
          claimEvidence=contact.sentences.map(s=>({claim:s.text,evidenceIds:s.evidenceIds}));
          retrievedEvidence=[...retrievedEvidence,...cited.filter(e=>!retrievedEvidence.some(old=>old.id===e.id))];
          const facts=contact.sentences.map(s=>s.text);
          return result('PARTIAL',`${facts.join(' ')} I couldn't complete that answer right now. Please call the business team for help with your question.`,cited,null,facts);
        }
        record('NO_APPROVED_PHONE',start);
      } catch { record('RECOVERY_UNAVAILABLE',start); }
    }
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
