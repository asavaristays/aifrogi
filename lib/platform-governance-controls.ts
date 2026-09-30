import { createHash, randomUUID } from "node:crypto";
import { canonicalJson } from "@/lib/bot-machine-policy";

export const NON_WAIVABLE_CONTROLS = new Set(["TENANT_ISOLATION","CURRENT_AUTHORIZATION","NO_FACTUAL_FALLBACK","SECRET_HANDLING","TRANSACTION_AUTHORITY","EXACT_ANSWER_BINDING","TRUTHFUL_DELIVERY"]);
export type GovernanceRecord = { id:string; kind:"AMENDMENT"|"EXCEPTION"; owner:string; approver:string; affectedControls:string[]; rationale:string; compatibilityImpact:string; expiresAt:string|null; remediationAt:string|null; evidence:string[]; digest:string };

export function approveGovernanceRecord(input: Omit<GovernanceRecord,"id"|"digest">,now=new Date()):GovernanceRecord {
  if(!input.owner.trim()||!input.approver.trim()||input.owner===input.approver) throw new Error("INDEPENDENT_GOVERNANCE_APPROVER_REQUIRED");
  if(!input.rationale.trim()||!input.compatibilityImpact.trim()||!input.evidence.length) throw new Error("GOVERNANCE_EVIDENCE_INCOMPLETE");
  if(input.kind==="EXCEPTION") {
    if(input.affectedControls.some(control=>NON_WAIVABLE_CONTROLS.has(control))) throw new Error("NON_WAIVABLE_CONTROL");
    if(!input.expiresAt||!input.remediationAt||Date.parse(input.expiresAt)<=now.getTime()||Date.parse(input.remediationAt)>Date.parse(input.expiresAt)) throw new Error("EXCEPTION_EXPIRY_INVALID");
  }
  const id=randomUUID(); const payload={...input,id};
  return {...payload,digest:createHash("sha256").update(canonicalJson(payload)).digest("hex")};
}

export type MaterialApproval={id:string;action:string;target:string;payloadHash:string;requestedBy:string;approvedBy?:string;expiresAt:string;state:"PENDING"|"APPROVED"|"EXECUTED"};
export function approveMaterialAction(request:MaterialApproval,approver:string,now=new Date()):MaterialApproval {
  if(request.state!=="PENDING")throw new Error("APPROVAL_NOT_PENDING"); if(request.requestedBy===approver)throw new Error("TWO_PERSON_APPROVAL_REQUIRED"); if(Date.parse(request.expiresAt)<=now.getTime())throw new Error("APPROVAL_EXPIRED");
  return {...request,approvedBy:approver,state:"APPROVED"};
}
export function consumeMaterialApproval(request:MaterialApproval,payload:unknown,now=new Date()):MaterialApproval {
  if(request.state!=="APPROVED"||!request.approvedBy||Date.parse(request.expiresAt)<=now.getTime())throw new Error("MATERIAL_APPROVAL_INVALID");
  const hash=createHash("sha256").update(canonicalJson(payload)).digest("hex"); if(hash!==request.payloadHash)throw new Error("APPROVED_PAYLOAD_CHANGED"); return {...request,state:"EXECUTED"};
}

export type RepairCommand={idempotencyKey:string;propertyId:string;command:"RECRAWL"|"REINDEX"|"VALIDATE"|"RECONCILE_DELIVERY";expectedVersion:number;reason:string;payload:unknown};
export function executeRepairCommand(input:{command:RepairCommand;actualVersion:number;seen:Map<string,{digest:string;result:unknown}>;run:()=>unknown}) {
  const digest=createHash("sha256").update(canonicalJson(input.command)).digest("hex"), prior=input.seen.get(input.command.idempotencyKey);
  if(prior){if(prior.digest!==digest)throw new Error("IDEMPOTENCY_PAYLOAD_MISMATCH");return prior.result;}
  if(!input.command.reason.trim())throw new Error("REPAIR_REASON_REQUIRED"); if(input.command.expectedVersion!==input.actualVersion)throw new Error("REPAIR_VERSION_STALE");
  const result=input.run(); input.seen.set(input.command.idempotencyKey,{digest,result}); return result;
}

export type BreakGlassGrant={incidentId:string;actor:string;scopes:string[];reason:string;issuedAt:string;expiresAt:string;reviewedBy?:string};
export function issueBreakGlass(input:Omit<BreakGlassGrant,"issuedAt">,now=new Date()):BreakGlassGrant {
  if(!/^INC-[A-Z0-9-]{4,}$/.test(input.incidentId)||!input.reason.trim()||!input.scopes.length)throw new Error("BREAK_GLASS_JUSTIFICATION_REQUIRED");
  const expiry=Date.parse(input.expiresAt); if(expiry<=now.getTime()||expiry-now.getTime()>60*60_000)throw new Error("BREAK_GLASS_EXPIRY_INVALID");
  return {...input,issuedAt:now.toISOString()};
}
export function authorizeBreakGlass(grant:BreakGlassGrant,scope:string,actor:string,now=new Date()){if(grant.actor!==actor||!grant.scopes.includes(scope)||Date.parse(grant.expiresAt)<=now.getTime())throw new Error("BREAK_GLASS_DENIED");return true;}
export function reviewBreakGlass(grant:BreakGlassGrant,reviewer:string){if(reviewer===grant.actor)throw new Error("INDEPENDENT_BREAK_GLASS_REVIEW_REQUIRED");return {...grant,reviewedBy:reviewer};}
