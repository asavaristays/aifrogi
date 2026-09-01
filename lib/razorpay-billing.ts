import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.razorpay.com/v1";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("Razorpay billing is not configured.");
  return { keyId, keySecret };
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  const body = await response.json().catch(() => null) as (T & { error?: { description?: string } }) | null;
  if (!response.ok) throw new Error(body?.error?.description || "Razorpay request failed.");
  return body as T;
}

export async function createRazorpayOrder(input: { amountPaisa: number; currency: string; receipt: string; notes: Record<string, string> }) {
  const { keyId } = credentials();
  const order = await razorpayRequest<{ id: string; amount: number; currency: string; status: string }>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: input.amountPaisa, currency: input.currency, receipt: input.receipt.slice(0, 40), notes: input.notes })
  });
  return { keyId, order };
}

export function verifyRazorpayCheckoutSignature(input: { orderId: string; paymentId: string; signature: string }) {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  const actual = input.signature.trim();
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function fetchVerifiedRazorpayPayment(paymentId: string) {
  return razorpayRequest<{ id: string; order_id: string; amount: number; currency: string; status: string; captured: boolean; email?: string; contact?: string }>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function fetchRazorpayOrder(orderId: string) {
  return razorpayRequest<{ id: string; amount: number; amount_paid: number; currency: string; status: string; notes?: Record<string, string> }>(`/orders/${encodeURIComponent(orderId)}`);
}
