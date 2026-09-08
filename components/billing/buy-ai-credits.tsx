"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AI_CREDIT_PACKS, type AiCreditPackCode } from "@/lib/ai-credit-catalog";

type CheckoutResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCheckout = { open(): void; on(event: string, callback: (response: { error?: { description?: string } }) => void): void };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout } }

async function loadCheckout() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("Secure checkout could not be loaded.")), { once: true }); return; }
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error("Secure checkout could not be loaded.")); document.head.appendChild(script);
  });
}

async function readCheckoutResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error("Payment service returned an unexpected response. Please refresh and try again, or contact support.");
  return response.json() as Promise<{ error?: string; orderId?: string; keyId?: string; amount?: number; currency?: string; packName?: string; ownerName?: string; ownerEmail?: string }>;
}

export function BuyAiCredits() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AiCreditPackCode>("AI_CREDITS_500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pack = AI_CREDIT_PACKS.find(item => item.code === selected)!;
  async function pay() {
    setBusy(true); setError("");
    try {
      await loadCheckout();
      const response = await fetch("/api/billing/credits/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packCode: selected }) });
      const order = await readCheckoutResponse(response);
      if (!response.ok || !order.orderId || !window.Razorpay) throw new Error(order.error || "Credit checkout could not be started.");
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "AiFrogi", description: order.packName, order_id: order.orderId, prefill: { name: order.ownerName, email: order.ownerEmail }, theme: { color: "#8a6a16" }, modal: { ondismiss: () => setBusy(false) }, handler: async (result: CheckoutResult) => {
        const verifiedResponse = await fetch("/api/billing/credits/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packCode: selected, ...result }) });
        const verified = await readCheckoutResponse(verifiedResponse);
        if (!verifiedResponse.ok) { setError(verified.error || "Payment requires review."); setBusy(false); return; }
        setOpen(false); setBusy(false); router.refresh();
      }});
      checkout.on("payment.failed", result => { setError(result.error?.description || "Payment failed. No credits were added."); setBusy(false); });
      checkout.open();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Credit checkout could not be started."); setBusy(false); }
  }
  return <><button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg bg-[#101010] px-5 text-sm font-bold text-white">Buy AI reply credits</button>{open ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-2xl bg-white p-6"><p className="product-eyebrow">Prepaid · no automatic overage</p><h2 className="mt-2 text-2xl font-semibold">Add AI reply credits</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Credits remain valid for 90 days. Human replies, blocked answers and failed requests do not consume them.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{AI_CREDIT_PACKS.map(item => <button key={item.code} onClick={() => setSelected(item.code)} className={`rounded-xl border p-4 text-left ${selected === item.code ? "border-[#8a6a16] bg-[#fff8e3]" : "border-black/10"}`}><strong>{item.credits.toLocaleString("en-IN")}</strong><span className="mt-1 block text-xs">AI replies</span><span className="mt-3 block font-bold">₹{(item.amountPaisa / 100).toLocaleString("en-IN")}</span></button>)}</div>{error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setOpen(false)} className="min-h-11 px-5">Cancel</button><button disabled={busy} onClick={() => void pay()} className="min-h-11 rounded-lg bg-[#8a6a16] px-6 font-bold text-white">{busy ? "Opening checkout…" : `Pay ₹${(pack.amountPaisa / 100).toLocaleString("en-IN")}`}</button></div></div></div> : null}</>;
}
