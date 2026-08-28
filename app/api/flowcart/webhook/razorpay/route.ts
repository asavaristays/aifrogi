import { NextResponse } from "next/server";
import {
  markFlowCartPaymentPaid,
  verifyRazorpayWebhookSignature
} from "@/lib/services/flowcart-service";

export const dynamic = "force-dynamic";

function getPaymentLinkId(payload: Record<string, unknown>) {
  const direct = payload.paymentLinkId || payload.payment_link_id || payload.razorpay_payment_link_id;
  if (typeof direct === "string") return direct;

  const eventPayload = payload.payload;
  if (!eventPayload || typeof eventPayload !== "object") return null;
  const paymentLink = (eventPayload as Record<string, unknown>).payment_link;
  if (!paymentLink || typeof paymentLink !== "object") return null;
  const entity = (paymentLink as Record<string, unknown>).entity;
  if (!entity || typeof entity !== "object") return null;
  const id = (entity as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

function getExternalPaymentId(payload: Record<string, unknown>) {
  const direct = payload.paymentId || payload.payment_id || payload.razorpay_payment_id;
  if (typeof direct === "string") return direct;

  const eventPayload = payload.payload;
  if (!eventPayload || typeof eventPayload !== "object") return null;
  const payment = (eventPayload as Record<string, unknown>).payment;
  if (!payment || typeof payment !== "object") return null;
  const entity = (payment as Record<string, unknown>).entity;
  if (!entity || typeof entity !== "object") return null;
  const id = (entity as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = verifyRazorpayWebhookSignature({
    rawBody,
    signatureHeader: request.headers.get("x-razorpay-signature"),
    secret: process.env.FLOWCART_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET
  });
  if (!signature.ok) return NextResponse.json({ error: signature.error }, { status: signature.status });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid Razorpay webhook JSON payload." }, { status: 400 });
  }

  const paymentLinkId = getPaymentLinkId(payload);
  if (!paymentLinkId) {
    return NextResponse.json({ error: "Payment link id not found in webhook payload." }, { status: 400 });
  }

  const result = await markFlowCartPaymentPaid({
    paymentLinkId,
    externalPaymentId: getExternalPaymentId(payload),
    rawPayload: payload
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, result: result.result });
}
