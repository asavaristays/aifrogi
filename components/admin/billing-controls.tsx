"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PlanOption = {
  code: string;
  name: string;
  amountPaisa: number;
};

type InvoiceOption = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalPaisa: number;
};

export function BillingControls({
  organizationId,
  plans,
  initialPlan,
  invoices
}: {
  organizationId: string;
  plans: PlanOption[];
  initialPlan: string;
  invoices: InvoiceOption[];
}) {
  const router = useRouter();
  const [planCode, setPlanCode] = useState(initialPlan);
  const [platformFeeRupees, setPlatformFeeRupees] = useState("");
  const [taxRupees, setTaxRupees] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceId, setInvoiceId] = useState(invoices.find((invoice) => invoice.status !== "PAID")?.id || "");
  const [paymentReference, setPaymentReference] = useState("");
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function run(payload: Record<string, unknown>, success: string) {
    setSaving(true);
    setNotice("");
    setError("");
    const response = await fetch(`/api/admin/billing/${organizationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(data?.error || "Billing action failed");
      return;
    }
    setNotice(success);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm lg:col-span-2">
      <div>
        <p className="product-eyebrow">Billing operations</p>
        <h2 className="mt-2 text-lg font-semibold">Manual control before Razorpay</h2>
        <p className="mt-1 text-sm leading-6 text-[#68645c]">Every action below writes to the platform audit trail.</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-black/6 bg-[#fbfcfb] p-4">
          <label className="field-label" htmlFor="billing-plan">Subscription plan</label>
          <select id="billing-plan" value={planCode} onChange={(event) => setPlanCode(event.target.value)} className="product-input mt-2">
            {plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}
          </select>
          <Button className="mt-4 w-full" disabled={saving} onClick={() => run({ action: "CHANGE_PLAN", planCode }, "Subscription plan updated.")}>Update plan</Button>
        </div>

        <div className="rounded-lg border border-black/6 bg-[#fbfcfb] p-4">
          <p className="field-label">Issue invoice</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input className="product-input" inputMode="decimal" placeholder="Platform fee ₹" value={platformFeeRupees} onChange={(event) => setPlatformFeeRupees(event.target.value)} />
            <input className="product-input" inputMode="decimal" placeholder="Tax ₹" value={taxRupees} onChange={(event) => setTaxRupees(event.target.value)} />
          </div>
          <input className="product-input mt-2" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          <textarea className="product-input mt-2 min-h-20" placeholder="Invoice note" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Button className="mt-3 w-full" disabled={saving || !platformFeeRupees} onClick={() => run({ action: "CREATE_INVOICE", platformFeeRupees, taxRupees, dueAt, notes }, "Invoice issued.")}>Issue invoice</Button>
        </div>

        <div className="rounded-lg border border-black/6 bg-[#fbfcfb] p-4">
          <p className="field-label">Confirm manual payment</p>
          <select className="product-input mt-2" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)}>
            <option value="">Select unpaid invoice</option>
            {invoices.filter((invoice) => invoice.status !== "PAID").map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber}</option>)}
          </select>
          <input className="product-input mt-2" placeholder="UTR / payment reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
          <Button tone="secondary" className="mt-3 w-full" disabled={saving || !invoiceId || !paymentReference.trim()} onClick={() => run({ action: "MARK_INVOICE_PAID", invoiceId, paymentReference }, "Payment recorded.")}>Mark paid</Button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4">
        <p className="field-label text-[#92400e]">Open customer incident</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[0.7fr_1.3fr_auto]">
          <input className="product-input" placeholder="Incident title" value={incidentTitle} onChange={(event) => setIncidentTitle(event.target.value)} />
          <input className="product-input" placeholder="What is failing and customer impact" value={incidentDescription} onChange={(event) => setIncidentDescription(event.target.value)} />
          <Button tone="danger" disabled={saving || !incidentTitle.trim() || !incidentDescription.trim()} onClick={() => run({ action: "OPEN_INCIDENT", severity: "HIGH", category: "CUSTOMER", title: incidentTitle, description: incidentDescription }, "Incident opened.")}>Open incident</Button>
        </div>
      </div>

      {notice ? <p className="mt-4 text-sm font-semibold text-[#6d5310]">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-[#b23a32]">{error}</p> : null}
    </section>
  );
}
