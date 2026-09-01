"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCheckout = { open(): void; on(event: string, callback: (response: { error?: { description?: string } }) => void): void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const paidPlans = [
  { code: "AI_STARTER_MONTHLY", name: "Monthly", price: "₹499", note: "Billed every month" },
  { code: "AI_STARTER_YEARLY", name: "Yearly", price: "₹4,999", note: "Save ₹989 each year" }
] as const;

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Secure checkout could not be loaded.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Secure checkout could not be loaded."));
    document.head.appendChild(script);
  });
}

export function ActivatePlan({ activePlanCode }: { activePlanCode: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<"AI_STARTER_MONTHLY" | "AI_STARTER_YEARLY">("AI_STARTER_MONTHLY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      await loadCheckout();
      const orderResponse = await fetch("/api/billing/checkout/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planCode: selected }) });
      const order = await orderResponse.json() as { error?: string; keyId?: string; orderId?: string; amount?: number; currency?: string; planName?: string; ownerName?: string; ownerEmail?: string };
      if (!orderResponse.ok || !order.keyId || !order.orderId || !order.amount || !order.currency) throw new Error(order.error || "Checkout could not be started.");
      if (!window.Razorpay) throw new Error("Secure checkout is unavailable.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "AiFrogi",
        description: order.planName,
        order_id: order.orderId,
        prefill: { name: order.ownerName, email: order.ownerEmail },
        theme: { color: "#8a6a16" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (result: CheckoutResult) => {
          const verifyResponse = await fetch("/api/billing/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planCode: selected, ...result }) });
          const verified = await verifyResponse.json() as { error?: string };
          if (!verifyResponse.ok) {
            setError(verified.error || "Payment was received but activation requires review. Please contact support.");
            setBusy(false);
            return;
          }
          setOpen(false);
          setBusy(false);
          router.refresh();
        }
      });
      checkout.on("payment.failed", (response) => { setError(response.error?.description || "Payment failed. No plan was activated."); setBusy(false); });
      checkout.open();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not be started.");
      setBusy(false);
    }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#8a6a16] px-5 text-sm font-bold text-white">{activePlanCode.startsWith("AI_STARTER") ? "Change plan" : "Activate paid plan"}</button>
    {open ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="activate-plan-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-black/8 bg-[#101010] px-6 py-5 text-white"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e2c66d]">Secure plan activation</p><h2 id="activate-plan-title" className="mt-2 text-2xl font-semibold">Choose your AI Bot plan.</h2><p className="mt-2 text-sm text-white/60">Payment is completed securely on Razorpay. AiFrogi never receives your card, bank, or UPI credentials.</p></div>
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2">{paidPlans.map((plan) => <button key={plan.code} type="button" onClick={() => setSelected(plan.code)} className={`rounded-xl border p-5 text-left transition ${selected === plan.code ? "border-[#8a6a16] bg-[#fff8e3] ring-1 ring-[#8a6a16]" : "border-black/10 hover:border-[#8a6a16]/50"}`}><span className="text-sm font-bold">{plan.name}</span><strong className="mt-3 block text-3xl">{plan.price}</strong><span className="mt-1 block text-xs text-[var(--text-muted)]">{plan.note}</span></button>)}</div>
          <a href="mailto:info@aifrogi.com?subject=AiFrogi%20Custom%20Enterprise%20Plan" className="mt-3 flex items-center justify-between rounded-xl border border-black/10 p-4 text-sm"><span><strong className="block">Custom / Enterprise</strong><span className="mt-1 block text-xs text-[var(--text-muted)]">Connector, volume, governance, or multi-location requirements</span></span><span className="font-bold text-[#6d5310]">Contact us →</span></a>
          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-black/10 px-5 text-sm font-bold disabled:opacity-50">Cancel</button><button type="button" disabled={busy} onClick={() => void pay()} className="min-h-11 rounded-lg bg-[#8a6a16] px-6 text-sm font-bold text-white disabled:opacity-60">{busy ? "Opening secure checkout…" : `Pay ${selected === "AI_STARTER_YEARLY" ? "₹4,999 yearly" : "₹499 monthly"}`}</button></div>
        </div>
      </div>
    </div> : null}
  </>;
}
