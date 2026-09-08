import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchRazorpayOrder, fetchVerifiedRazorpayPayment } from "@/lib/razorpay-billing";
import { ensureBillingPlans, activateRazorpaySubscription } from "@/lib/billing-super-admin";
import { activatePaidAiCredits } from "@/lib/ai-credits";
import { findAiCreditPack, type AiCreditPackCode } from "@/lib/ai-credit-catalog";
import { notifyBillingEvent } from "@/lib/services/billing-notification";

export const dynamic = "force-dynamic";
const SYSTEM = "razorpay-webhook@aifrogi.com";
function validSignature(raw:string, received:string|null) { const secret=process.env.RAZORPAY_BILLING_WEBHOOK_SECRET?.trim(); if(!secret||!received)return false; const expected=createHmac("sha256",secret).update(raw).digest("hex"); const a=Buffer.from(expected),b=Buffer.from(received.trim()); return a.length===b.length&&timingSafeEqual(a,b); }
const entity=(payload:Record<string,unknown>,key:string)=>((payload.payload as Record<string,unknown>|undefined)?.[key] as {entity?:Record<string,unknown>}|undefined)?.entity;
export async function POST(request:Request){
 const raw=await request.text(),signature=request.headers.get("x-razorpay-signature"),eventId=request.headers.get("x-razorpay-event-id")?.trim();
 if(!validSignature(raw,signature))return NextResponse.json({error:"Invalid webhook signature."},{status:401});
 if(!eventId)return NextResponse.json({error:"Missing Razorpay event id."},{status:400});
 const payload=JSON.parse(raw) as Record<string,unknown>,event=String(payload.event||""); const db=getDb(); if(!db)return NextResponse.json({error:"Billing database unavailable."},{status:503});
 if(await db.platformAuditLog.findFirst({where:{action:"RAZORPAY_WEBHOOK_PROCESSED",targetId:eventId}}))return NextResponse.json({ok:true,duplicate:true});
 const paymentEntity=entity(payload,"payment"),refundEntity=entity(payload,"refund"); const paymentId=String(paymentEntity?.id||refundEntity?.payment_id||""); const orderId=String(paymentEntity?.order_id||"");
 let organizationId:string|null=null,targetId=paymentId||eventId;
 if(event==="payment.captured"){
  if(!paymentId||!orderId)return NextResponse.json({error:"Payment identifiers missing."},{status:400});
  const [payment,order]=await Promise.all([fetchVerifiedRazorpayPayment(paymentId),fetchRazorpayOrder(orderId)]); organizationId=order.notes?.organizationId||null;
  if(!organizationId||payment.status!=="captured"||!payment.captured||payment.order_id!==orderId||payment.amount!==order.amount||payment.currency!==order.currency)return NextResponse.json({error:"Verified payment mismatch."},{status:400});
  if(order.notes?.packCode){const pack=findAiCreditPack(order.notes.packCode);if(!pack||pack.amountPaisa!==payment.amount)return NextResponse.json({error:"Credit pack mismatch."},{status:400});const credit=await activatePaidAiCredits({organizationId,actorEmail:SYSTEM,packCode:pack.code as AiCreditPackCode,orderId,paymentId,amountPaisa:payment.amount,currency:payment.currency});targetId=credit.id;await notifyBillingEvent({organizationId,targetId:credit.id,actorEmail:SYSTEM,event:"CREDITS_PURCHASED",description:`${credit.credits} AI reply credits`,value:`₹${(payment.amount/100).toLocaleString("en-IN")} paid`,reference:paymentId,validity:credit.expiresAt});}
  else if(order.notes?.planCode){const plans=await ensureBillingPlans(),plan=plans.find(item=>item.code===order.notes?.planCode);if(!plan||plan.amountPaisa!==payment.amount)return NextResponse.json({error:"Plan mismatch."},{status:400});const invoice=await activateRazorpaySubscription({organizationId,actorEmail:SYSTEM,planCode:order.notes.planCode as "AI_STARTER_MONTHLY"|"AI_STARTER_YEARLY",orderId,paymentId,amountPaisa:payment.amount,currency:payment.currency});targetId=invoice.id;await notifyBillingEvent({organizationId,targetId:invoice.id,actorEmail:SYSTEM,event:"PLAN_ACTIVATED",description:plan.name,value:`₹${(payment.amount/100).toLocaleString("en-IN")} paid`,reference:paymentId,validity:invoice.periodEnd});}
  else return NextResponse.json({error:"Order is not an AiFrogi billing order."},{status:400});
 } else if(event==="payment.failed"||event==="refund.processed") { const order=orderId?await fetchRazorpayOrder(orderId).catch(()=>null):null; organizationId=order?.notes?.organizationId||null; }
 else return NextResponse.json({ok:true,ignored:true});
 await db.platformAuditLog.create({data:{organizationId,actorEmail:SYSTEM,actorRole:"SYSTEM",action:"RAZORPAY_WEBHOOK_PROCESSED",targetType:"RazorpayEvent",targetId:eventId,summary:`Razorpay ${event} processed`,metadata:{event,eventId,paymentId,targetId}}});
 return NextResponse.json({ok:true,event});
}
