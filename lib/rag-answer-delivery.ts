import {withCanonicalRole,type CanonicalIdentity} from './canonical-db-context';
import {assertSharedAnswerDelivery,type SharedAnswerResult} from './shared-answer-engine';

/** Binding for grounded paraphrases, including a mixture of source kinds. */
export async function recordDeliveredRagAnswer(input:{identity:CanonicalIdentity;conversationId:string;sessionHash:string;expiresAt:Date;deliveryKey:string;question:string;answer:string;proof:SharedAnswerResult}) {
  assertSharedAnswerDelivery(input.proof,input.answer,input.identity.organizationId,input.identity.propertyId);
  const evidence=input.proof.evidence.map(e=>({id:e.id,kind:e.sourceKind,sourceId:e.sourceId,sourceVersion:e.sourceVersion,digest:e.digest,content:e.sourceKind==='LIVE'?e.content:undefined,checkedAt:e.checkedAt,operation:e.liveOperation}));
  if(evidence.some(e=>!e.kind||!e.sourceId||!e.sourceVersion)||!input.proof.claimEvidence?.length) throw new Error('RAG_DELIVERY_BINDING_INVALID');
  const claims=input.proof.claimEvidence.map(c=>({...c,supported:true}));
  return withCanonicalRole('aifrogi_web',input.identity,async tx=>{
    await tx.$executeRaw`SELECT aifrogi_security.ensure_guest_session(${input.identity.propertyId},${input.conversationId},${input.sessionHash},${input.expiresAt.toISOString()}::timestamptz,${input.identity.principal})`;
    const rows=await tx.$queryRaw<Array<{id:string}>>`SELECT aifrogi_security.record_rag_answer(${input.identity.propertyId},${input.conversationId},${input.deliveryKey},${input.proof.evidence[0].generationId},${input.question},${input.answer},${JSON.stringify(evidence)}::jsonb,${JSON.stringify(claims)}::jsonb,${JSON.stringify(input.proof.trace)}::jsonb) AS id`;
    if(!rows[0]?.id) throw new Error('RAG_RECEIPT_MISSING');
    return rows[0].id;
  });
}
