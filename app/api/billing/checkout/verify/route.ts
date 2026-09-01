import { NextResponse } from "next/server";
import { getCurrentClientAccess, canManageWorkspace } from "@/lib/client-access";
import { activateRazorpaySubscription, ensureBillingPlans } from "@/lib/billing-super-admin";
import { fetchRazorpayOrder, fetchVerifiedRazorpayPayment, verifyRazorpayCheckoutSignature } from "@/lib/razorpay-billing";

const CLIENT_PLAN_CODES = new Set(["AI_STARTER_MONTHLY", "AI_STARTER_YEARLY"]);

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in to verify payment." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { planCode?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string } | null;
  const planCode = String(payload?.planCode || "").toUpperCase() as "AI_STARTER_MONTHLY" | "AI_STARTER_YEARLY";
  const orderId = String(payload?.razorpay_order_id || "");
  const paymentId = String(payload?.razorpay_payment_id || "");
  const signature = String(payload?.razorpay_signature || "");
  if (!CLIENT_PLAN_CODES.has(planCode) || !orderId || !paymentId || !signature) return NextResponse.json({ error: "Incomplete payment confirmation." }, { status: 400 });

  try {
    if (!verifyRazorpayCheckoutSignature({ orderId, paymentId, signature })) return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    const [payment, order, plans] = await Promise.all([fetchVerifiedRazorpayPayment(paymentId), fetchRazorpayOrder(orderId), ensureBillingPlans()]);
    const plan = plans.find((item) => item.code === planCode);
    const orderBelongsToWorkspace = order.notes?.organizationId === access.organization.id && order.notes?.planCode === planCode;
    if (!plan || !orderBelongsToWorkspace || payment.order_id !== orderId || order.id !== orderId || payment.amount !== plan.amountPaisa || order.amount !== plan.amountPaisa || payment.currency !== plan.currency || order.currency !== plan.currency || payment.status !== "captured" || !payment.captured || order.amount_paid !== plan.amountPaisa) {
      return NextResponse.json({ error: "Payment is not captured or does not match the selected plan." }, { status: 400 });
    }
    const invoice = await activateRazorpaySubscription({ organizationId: access.organization.id, actorEmail: access.user.username, planCode, orderId, paymentId, amountPaisa: payment.amount, currency: payment.currency });
    return NextResponse.json({ ok: true, invoiceId: invoice.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status: 502 });
  }
}
