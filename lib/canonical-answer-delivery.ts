import {createHash} from "node:crypto";
import { withCanonicalRole, type CanonicalIdentity } from "@/lib/canonical-db-context";

export type ProviderResult={accepted:boolean;providerDeliveryId?:string;detail?:unknown};
type DeliveryManifestEntry={entryId:string;answerText:string};
type DeliveryArgs={identity:CanonicalIdentity;conversationId:string;sessionHash:string;expiresAt:Date;entryIds:string[];finalAnswer:string;deliveryKey:string;timeoutMs:number;send:(manifest:DeliveryManifestEntry[],signal:AbortSignal)=>Promise<ProviderResult>};

function bindExactAnswer(finalAnswer:string,manifest:unknown){
  if(!Array.isArray(manifest)||!manifest.length||manifest.some(item=>!item||typeof item!=="object"||typeof item.answerText!=="string")) throw new Error("ANSWER_MANIFEST_INVALID");
  const entries=manifest as DeliveryManifestEntry[];
  const canonicalAnswer=entries.map(item=>item.answerText).join("\n");
  if(finalAnswer!==canonicalAnswer) throw new Error("ANSWER_NOT_EXACTLY_COVERED");
  return {answerText:finalAnswer,answerSha256:createHash("sha256").update(finalAnswer,"utf8").digest("hex"),manifestEntryIds:entries.map(item=>item.entryId)};
}

export class CanonicalDeliveryUncertainError extends Error {
  constructor(readonly answerAuditId:string, readonly causeDetail:unknown) {
    super("CANONICAL_DELIVERY_UNCERTAIN");
    this.name="CanonicalDeliveryUncertainError";
  }
}

async function createPendingAudit(args:DeliveryArgs) {
  return withCanonicalRole("aifrogi_web",args.identity,async tx=>{
    await tx.$executeRaw`SELECT aifrogi_security.ensure_guest_session(${args.identity.propertyId},${args.conversationId},${args.sessionHash},${args.expiresAt.toISOString()}::timestamptz,${args.identity.principal})`;
    const rows=await tx.$queryRaw<Array<{answer_audit_id:string}>>`SELECT aifrogi_security.record_answer_pending(${args.identity.propertyId},${args.conversationId},${args.sessionHash},${args.entryIds}::text[]) AS answer_audit_id`;
    if(!rows[0]?.answer_audit_id) throw new Error("ANSWER_AUDIT_NOT_CREATED");
    return rows[0].answer_audit_id;
  });
}

async function persistFailure(args:DeliveryArgs,answerAuditId:string,error:unknown,providerAccepted:boolean) {
  return withCanonicalRole("aifrogi_web",args.identity,async tx=>{
    const detail=JSON.stringify({deliveryUncertain:true,providerAccepted,error:error instanceof Error?error.message:"unknown"});
    await tx.$executeRaw`SELECT aifrogi_security.record_answer_outcome(${args.identity.propertyId},${answerAuditId},${args.deliveryKey},'FAILED'::"AnswerDeliveryState",${detail}::jsonb)`;
    const rows=await tx.$queryRaw<Array<{state:"DELIVERED"|"FAILED"|"SUPPRESSED"|"HANDOVER"}>>`SELECT aifrogi_security.answer_outcome_state(${args.identity.propertyId},${answerAuditId},${args.deliveryKey}) AS state`;
    return rows[0]?.state;
  });
}

export async function deliverCanonicalAnswer(args:DeliveryArgs) {
  const answerAuditId=await createPendingAudit(args);
  let providerAccepted=false;
  let acceptedResult:ProviderResult|undefined;
  try {
    return await withCanonicalRole("aifrogi_web",args.identity,async tx=>{
      const rows=await tx.$queryRaw<Array<{manifest:unknown}>>`SELECT aifrogi_security.answer_delivery_manifest(${args.identity.propertyId},${answerAuditId}) AS manifest`;
      if(!rows[0]) throw new Error("ANSWER_AUDIT_NOT_FOUND");
      const answerBinding=bindExactAnswer(args.finalAnswer,rows[0].manifest);
      const controller=new AbortController();
      let timer:ReturnType<typeof setTimeout>|undefined;
      try {
        const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error("PROVIDER_TIMEOUT"));},args.timeoutMs);});
        acceptedResult=await Promise.race([args.send(rows[0].manifest as DeliveryManifestEntry[],controller.signal),timeout]);
        providerAccepted=acceptedResult.accepted;
        const outcomeDetail={...acceptedResult,answerBinding};
        await tx.$executeRaw`SELECT aifrogi_security.record_answer_outcome(${args.identity.propertyId},${answerAuditId},${args.deliveryKey},${acceptedResult.accepted?"DELIVERED":"FAILED"}::"AnswerDeliveryState",${JSON.stringify(outcomeDetail)}::jsonb)`;
        return {...acceptedResult,answerAuditId};
      } finally {
        if(timer) clearTimeout(timer);
      }
    });
  } catch(error) {
    const durableState=await persistFailure(args,answerAuditId,error,providerAccepted);
    if(durableState==="DELIVERED" && acceptedResult) return {...acceptedResult,answerAuditId};
    throw new CanonicalDeliveryUncertainError(answerAuditId,error);
  }
}
