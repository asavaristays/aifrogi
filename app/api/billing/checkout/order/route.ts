import { NextResponse } from "next/server";
import { getCurrentClientAccess, canManageWorkspace } from "@/lib/client-access";
import { ensureBillingPlans } from "@/lib/billing-super-admin";
import { createRazorpayOrder } from "@/lib/razorpay-billing";

const CLIENT_PLAN_CODES = new Set(["AI_STARTER_MONTHLY", "AI_STARTER_YEARLY"]);

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in to activate a plan." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { planCode?: string } | null;
  const planCode = String(payload?.planCode || "").toUpperCase();
  if (!CLIENT_PLAN_CODES.has(planCode)) return NextResponse.json({ error: "Select a valid paid plan." }, { status: 400 });

  try {
    const plans = await ensureBillingPlans();
    const plan = plans.find((item) => item.code === planCode);
    if (!plan || !plan.amountPaisa) return NextResponse.json({ error: "Selected plan is unavailable." }, { status: 400 });
    const receipt = `aif-${access.organization.id.slice(-10)}-${Date.now().toString().slice(-10)}`;
    const { keyId, order } = await createRazorpayOrder({
      amountPaisa: plan.amountPaisa,
      currency: plan.currency,
      receipt,
      notes: { organizationId: access.organization.id, planCode }
    });
    return NextResponse.json({ keyId, orderId: order.id, amount: order.amount, currency: order.currency, planName: plan.name, ownerName: access.organization.ownerName, ownerEmail: access.organization.ownerEmail });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout could not be started." }, { status: 502 });
  }
}
