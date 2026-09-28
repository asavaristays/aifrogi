import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type ReadinessPaymentTicket = {
  product: "AI_READINESS"; quoteRef: string; quoteHash: string;
  organizationRef: string; propertyRef: string; amountMinor: number;
  currency: "INR"; expiresAt: string;
};
export function verifyReadinessPaymentTicket(token: string, secret: string, now = Date.now()): ReadinessPaymentTicket {
  if (secret.length < 32 || typeof token !== "string" || token.length > 4096) throw new Error("Invalid Readiness payment ticket.");
  const pieces = token.split(".");
  if (pieces.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(pieces[0]) || !/^[a-f0-9]{64}$/.test(pieces[1])) throw new Error("Invalid Readiness payment ticket.");
  const expected = createHmac("sha256", secret).update(`readiness-quote-v1\n${pieces[0]}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(pieces[1], "hex"))) throw new Error("Invalid Readiness quote signature.");
  const ticket = JSON.parse(Buffer.from(pieces[0], "base64url").toString("utf8")) as ReadinessPaymentTicket;
  if (ticket.product !== "AI_READINESS" || ticket.amountMinor !== 99900 || ticket.currency !== "INR" ||
      !/^[a-f0-9]{64}$/.test(ticket.quoteHash) || !Number.isFinite(Date.parse(ticket.expiresAt)) || Date.parse(ticket.expiresAt) <= now ||
      ![ticket.quoteRef,ticket.organizationRef,ticket.propertyRef].every(value => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/.test(value))) {
    throw new Error("Readiness quote is invalid or expired.");
  }
  return ticket;
}

export function assertReadinessCapturedPayment(ticket: ReadinessPaymentTicket,
  order: {id: string; amount: number; amount_paid: number; currency: string; notes?: Record<string,string>},
  payment: {id: string; order_id: string; amount: number; currency: string; status: string; captured: boolean}) {
  if (!payment.id || payment.order_id !== order.id || payment.status !== "captured" || payment.captured !== true ||
    order.amount !== ticket.amountMinor || order.amount_paid !== ticket.amountMinor || payment.amount !== ticket.amountMinor ||
    order.currency !== ticket.currency || payment.currency !== ticket.currency || order.notes?.product !== "AI_READINESS" ||
    order.notes?.quoteRef !== ticket.quoteRef || order.notes?.quoteHash !== ticket.quoteHash ||
    order.notes?.organizationId !== ticket.organizationRef || order.notes?.propertyRef !== ticket.propertyRef) {
    throw new Error("Captured payment does not match the approved Readiness quote.");
  }
}

export function signedReadinessEvent(body: string, secret: string) {
  if(secret.length<32) throw new Error("Readiness billing bridge not configured.");
  const path = "/internal/v1/billing-entitlements", timestamp = String(Date.now()), nonce = randomUUID();
  const hash = createHash("sha256").update(body).digest("hex");
  return {path,headers:{"content-type":"application/json","x-aifrogi-timestamp":timestamp,"x-aifrogi-nonce":nonce,
    "x-aifrogi-signature":createHmac("sha256",secret).update(`POST\n${path}\n${timestamp}\n${nonce}\n${hash}`).digest("hex")}};
}
