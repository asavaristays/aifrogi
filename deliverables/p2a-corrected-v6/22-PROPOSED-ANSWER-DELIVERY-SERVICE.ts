// Review copy. The executable implementation is lib/canonical-answer-delivery.ts.
// The pending audit commits first; failures are appended in a separate transaction.
import {createHash} from "node:crypto";
import {withCanonicalRole,type CanonicalIdentity} from "./16-PROPOSED-DB-CONTEXT";

type ManifestEntry={entryId:string;answerText:string};
type ProviderResult={accepted:boolean;providerDeliveryId?:string;detail?:unknown};

function exactBinding(answer:string,manifest:unknown){
 if(!Array.isArray(manifest)||!manifest.length||manifest.some(x=>!x||typeof x!=="object"||typeof x.answerText!=="string")) throw new Error("ANSWER_MANIFEST_INVALID");
 const entries=manifest as ManifestEntry[];
 if(answer!==entries.map(x=>x.answerText).join("\n")) throw new Error("ANSWER_NOT_EXACTLY_COVERED");
 return {answerText:answer,answerSha256:createHash("sha256").update(answer,"utf8").digest("hex"),manifestEntryIds:entries.map(x=>x.entryId)};
}

export async function deliverCanonicalAnswer(args:{
 identity:CanonicalIdentity;answerAuditId:string;finalAnswer:string;deliveryKey:string;timeoutMs:number;
 send:(manifest:ManifestEntry[],signal:AbortSignal)=>Promise<ProviderResult>;
}){
 let providerAccepted=false;
 try{
  return await withCanonicalRole("aifrogi_web",args.identity,async tx=>{
   const rows=await tx.$queryRaw<Array<{manifest:unknown}>>`SELECT aifrogi_security.answer_delivery_manifest(${args.identity.propertyId},${args.answerAuditId}) manifest`;
   if(!rows[0]) throw new Error("ANSWER_AUDIT_NOT_FOUND");
   const answerBinding=exactBinding(args.finalAnswer,rows[0].manifest);
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),args.timeoutMs);
   try{
    const result=await args.send(rows[0].manifest as ManifestEntry[],controller.signal);
    providerAccepted=result.accepted;
    await tx.$executeRaw`SELECT aifrogi_security.record_answer_outcome(${args.identity.propertyId},${args.answerAuditId},${args.deliveryKey},${result.accepted?"DELIVERED":"FAILED"}::"AnswerDeliveryState",${JSON.stringify({...result,answerBinding})}::jsonb)`;
    return result;
   }finally{clearTimeout(timer);}
  });
 }catch(error){
  await withCanonicalRole("aifrogi_web",args.identity,tx=>tx.$executeRaw`SELECT aifrogi_security.record_answer_outcome(${args.identity.propertyId},${args.answerAuditId},${args.deliveryKey},'FAILED'::"AnswerDeliveryState",${JSON.stringify({deliveryUncertain:true,providerAccepted,error:error instanceof Error?error.message:"unknown"})}::jsonb)`);
  throw error;
 }
}
