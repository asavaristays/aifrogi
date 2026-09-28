// Existing billing owns provider credentials/invoices. Never import Readiness
// application code or connect to its database from here.
import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { createRazorpayOrder, fetchRazorpayOrder, fetchVerifiedRazorpayPayment } from "@/lib/razorpay-billing";
import { assertReadinessCapturedPayment, signedReadinessEvent, verifyReadinessPaymentTicket, type ReadinessPaymentTicket } from "@/lib/readiness-billing-contract";

function config() {
  const secret=process.env.READINESS_BILLING_BRIDGE_SECRET || "";
  const approvedTerms=process.env.READINESS_BILLING_TERMS_APPROVAL_REF || "";
  const taxText=process.env.READINESS_BILLING_TAX_MINOR;
  const tax=Number(taxText);
  if(process.env.READINESS_BILLING_ENABLED!=="true" || secret.length<32 || !approvedTerms ||
    taxText===undefined || !/^\d+$/.test(taxText) || !Number.isSafeInteger(tax) || tax<0 || tax>99900) {
    throw new Error("Readiness checkout is disabled pending approved commercial terms and billing configuration.");
  }
  return {secret,tax,approvedTerms};
}
const invoiceNumber=(ref:string)=>`AIR-${createHash("sha256").update(ref).digest("hex").slice(0,32)}`;
type Notes={ticket:ReadinessPaymentTicket; providerOrderId?:string; termsApprovalRef:string};
function notes(value:string|null):Notes {if(!value)throw new Error("Readiness invoice metadata missing.");return JSON.parse(value) as Notes;}

export async function createReadinessBillingOrder(input:{token:string;organizationId:string;propertyIds:string[];actor:string}) {
  const settings=config(),ticket=verifyReadinessPaymentTicket(input.token,settings.secret);
  if(ticket.organizationRef!==input.organizationId || !input.propertyIds.includes(ticket.propertyRef))throw new Error("Readiness quote does not belong to your property.");
  const db=getDb();if(!db)throw new Error("Billing unavailable.");
  const number=invoiceNumber(ticket.quoteRef);
  // Commit a unique intent before calling the provider. An uncertain create
  // never silently creates another payable order; reconciliation is required.
  const existing=await db.billingInvoice.findUnique({where:{invoiceNumber:number}});
  if(existing){
    const prior=notes(existing.notes);
    if(prior.ticket.quoteHash!==ticket.quoteHash || existing.organizationId!==input.organizationId)throw new Error("Quote changed.");
    if(!prior.providerOrderId || existing.status==="PAID")throw new Error("This quote is already paid or requires billing reconciliation.");
    return {orderId:prior.providerOrderId,keyId:process.env.RAZORPAY_KEY_ID,amount:99900,currency:"INR"};
  }
  const invoice=await db.billingInvoice.create({data:{organizationId:input.organizationId,invoiceNumber:number,status:"READINESS_CREATING",currency:"INR",
    periodStart:new Date(),periodEnd:new Date(ticket.expiresAt),servicesPaisa:99900-settings.tax,taxPaisa:settings.tax,totalPaisa:99900,
    createdBy:input.actor,notes:JSON.stringify({ticket,termsApprovalRef:settings.approvedTerms})}});
  try{
    const {keyId,order}=await createRazorpayOrder({amountPaisa:99900,currency:"INR",receipt:number,notes:{product:"AI_READINESS",quoteRef:ticket.quoteRef,
      quoteHash:ticket.quoteHash,organizationId:input.organizationId,propertyRef:ticket.propertyRef,invoiceId:invoice.id}});
    if(order.amount!==99900 || order.currency!=="INR")throw new Error("Provider returned mismatching order.");
    await db.billingInvoice.update({where:{id:invoice.id},data:{status:"DRAFT",notes:JSON.stringify({ticket,providerOrderId:order.id,termsApprovalRef:settings.approvedTerms})}});
    return {keyId,orderId:order.id,amount:99900,currency:"INR"};
  }catch{
    // Invoice remains READINESS_CREATING: do not retry order creation blindly.
    throw new Error("Order creation needs billing reconciliation before retrying. No second order was created automatically.");
  }
}

export async function recordReadinessCapturedPayment(orderId:string,paymentId:string,organizationId?:string) {
  config();
  const db=getDb();if(!db)throw new Error("Billing unavailable.");
  const [order,payment]=await Promise.all([fetchRazorpayOrder(orderId),fetchVerifiedRazorpayPayment(paymentId)]);
  if(order.notes?.product!=="AI_READINESS" || !order.notes.quoteRef)throw new Error("Not a Readiness order.");
  const invoice=await db.billingInvoice.findUnique({where:{invoiceNumber:invoiceNumber(order.notes.quoteRef)}});
  if(!invoice || (organizationId && invoice.organizationId!==organizationId))throw new Error("Invoice unavailable for this workspace.");
  const source=notes(invoice.notes);
  if(source.providerOrderId!==orderId || source.ticket.organizationRef!==invoice.organizationId)throw new Error("Invoice order mismatch.");
  assertReadinessCapturedPayment(source.ticket,order,payment);
  if(Date.now()>Date.parse(source.ticket.expiresAt))throw new Error("Expired quote payment requires manual reconciliation.");
  const eventId=`readiness-paid:${invoice.id}`;
  await db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${eventId},0))`;
    const current=await tx.billingInvoice.findUnique({where:{id:invoice.id}});
    if(current?.status==="PAID" && current.paymentReference!==paymentId)throw new Error("Invoice already paid by another payment.");
    const prior=await tx.platformAuditLog.findUnique({where:{id:eventId}});
    if(prior)return;
    const entitlement={issuer:"aifrogi-billing",eventRef:eventId,entitlementRef:`readiness:${invoice.id}`,organizationRef:invoice.organizationId,
      propertyRef:source.ticket.propertyRef,product:"AI_READINESS",quoteRef:source.ticket.quoteRef,quoteHash:source.ticket.quoteHash,
      revision:1,state:"ACTIVE",confirmedAt:new Date().toISOString()};
    await tx.billingInvoice.update({where:{id:invoice.id},data:{status:"PAID",paidAt:new Date(),paymentReference:paymentId}});
    await tx.platformAuditLog.create({data:{id:eventId,organizationId:invoice.organizationId,actorEmail:"readiness-billing@aifrogi.com",actorRole:"SYSTEM",
      action:"READINESS_ENTITLEMENT_PENDING",targetType:"BillingInvoice",targetId:invoice.id,summary:"Captured Readiness payment queued for private entitlement delivery",metadata:entitlement}});
  });
  return {invoiceId:invoice.id,eventId};
}

export async function deliverReadinessBillingEvent(eventId:string) {
  const settings=config(),db=getDb();if(!db)throw new Error("Billing unavailable.");
  const event=await db.platformAuditLog.findUnique({where:{id:eventId}});
  if(event?.action!=="READINESS_ENTITLEMENT_PENDING" || !event.metadata)throw new Error("Readiness outbox event unavailable.");
  const deliveredId=`delivered:${eventId}`;
  if(await db.platformAuditLog.findUnique({where:{id:deliveredId}}))return;
  // Fixed private destination: no caller-supplied URL or provider secret crosses.
  const body=JSON.stringify(event.metadata),request=signedReadinessEvent(body,settings.secret);
  const response=await fetch(`http://10.89.0.2:3021${request.path}`,{method:"POST",headers:request.headers,body,redirect:"error",signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error("Readiness delivery pending; retry the durable billing outbox.");
  const receipt=await response.json() as {id?:string};
  if(receipt.id!==eventId)throw new Error("Unexpected Readiness receipt.");
  await db.platformAuditLog.upsert({where:{id:deliveredId},update:{},create:{id:deliveredId,organizationId:event.organizationId,
    actorEmail:"readiness-billing@aifrogi.com",actorRole:"SYSTEM",action:"READINESS_ENTITLEMENT_DELIVERED",targetType:"BillingInvoice",
    targetId:event.targetId,summary:"Private Readiness entitlement delivery acknowledged",metadata:{eventId}}});
}
