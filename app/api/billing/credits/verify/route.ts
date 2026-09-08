import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { activatePaidAiCredits } from "@/lib/ai-credits";
import { findAiCreditPack, type AiCreditPackCode } from "@/lib/ai-credit-catalog";
import { fetchRazorpayOrder, fetchVerifiedRazorpayPayment, verifyRazorpayCheckoutSignature } from "@/lib/razorpay-billing";
import { notifyBillingEvent } from "@/lib/services/billing-notification";

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in to verify payment." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { packCode?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string } | null;
  const packCode = String(payload?.packCode || "") as AiCreditPackCode;
  const pack = findAiCreditPack(packCode);
  const orderId = String(payload?.razorpay_order_id || "");
  const paymentId = String(payload?.razorpay_payment_id || "");
  const signature = String(payload?.razorpay_signature || "");
  if (!pack || !orderId || !paymentId || !signature) return NextResponse.json({ error: "Incomplete payment confirmation." }, { status: 400 });
  try {
    if (!verifyRazorpayCheckoutSignature({ orderId, paymentId, signature })) return NextResponse.json({ error: "Payment signature is invalid." }, { status: 400 });
    const [order, payment] = await Promise.all([fetchRazorpayOrder(orderId), fetchVerifiedRazorpayPayment(paymentId)]);
    const valid = order.notes?.organizationId === access.organization.id && order.notes?.packCode === pack.code && payment.order_id === orderId && payment.amount === pack.amountPaisa && order.amount === pack.amountPaisa && payment.currency === "INR" && order.currency === "INR" && payment.status === "captured" && payment.captured;
    if (!valid) return NextResponse.json({ error: "Payment is not captured or does not match this credit pack." }, { status: 400 });
    const credit = await activatePaidAiCredits({ organizationId: access.organization.id, actorEmail: access.user.username, packCode, orderId, paymentId, amountPaisa: payment.amount, currency: payment.currency });
    const notification = await notifyBillingEvent({ organizationId: access.organization.id, targetId: credit.id, actorEmail: access.user.username, event: "CREDITS_PURCHASED", description: `${credit.credits.toLocaleString("en-IN")} AI reply credits`, value: `₹${(payment.amount / 100).toLocaleString("en-IN")} paid`, reference: paymentId, validity: credit.expiresAt });
    return NextResponse.json({ ok: true, creditId: credit.id, credits: credit.credits, allocatedImmediately: true, notification });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Credit payment verification failed." }, { status: 502 });
  }
}
