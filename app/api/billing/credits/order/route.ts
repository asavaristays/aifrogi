import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { findAiCreditPack } from "@/lib/ai-credit-catalog";
import { createRazorpayOrder } from "@/lib/razorpay-billing";

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { packCode?: string } | null;
  const pack = findAiCreditPack(String(payload?.packCode || ""));
  if (!pack) return NextResponse.json({ error: "Select a valid credit pack." }, { status: 400 });
  try {
    const { keyId, order } = await createRazorpayOrder({ amountPaisa: pack.amountPaisa, currency: "INR", receipt: `credit-${access.organization.id.slice(-8)}-${Date.now().toString().slice(-8)}`, notes: { organizationId: access.organization.id, packCode: pack.code, product: "AI_REPLY_CREDITS" } });
    return NextResponse.json({ keyId, orderId: order.id, amount: order.amount, currency: order.currency, packName: `${pack.credits.toLocaleString("en-IN")} AI reply credits`, ownerName: access.organization.ownerName, ownerEmail: access.organization.ownerEmail });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Credit checkout could not be started." }, { status: 502 });
  }
}
