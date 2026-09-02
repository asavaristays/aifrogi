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
type AddonOption = { id: string; name: string; category: string; provisioningStatus: string; paymentStatus: string; setupFeePaisa: number; recurringFeePaisa: number };

export function BillingControls({
  organizationId,
  plans,
  initialPlan,
  invoices
  ,addons
}: {
  organizationId: string;
  plans: PlanOption[];
  initialPlan: string;
  invoices: InvoiceOption[];
  addons: AddonOption[];
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
  const [complimentaryEndsAt, setComplimentaryEndsAt] = useState("");
  const [complimentaryReason, setComplimentaryReason] = useState("");
  const [complimentaryPlanCode, setComplimentaryPlanCode] = useState(() => plans.find((plan) => plan.code !== "TRIAL")?.code || "");
  const [connectorCategory, setConnectorCategory] = useState("GOOGLE_SHEETS_CALENDAR");
  const [connectorName, setConnectorName] = useState("");
  const [setupFeeRupees, setSetupFeeRupees] = useState("");
  const [recurringFeeRupees, setRecurringFeeRupees] = useState("");
  const [connectorInterval, setConnectorInterval] = useState("ONE_TIME");
  const [externalFeeNote, setExternalFeeNote] = useState("");
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

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-[#d8c278] bg-[#fff9e8] p-5"><p className="field-label text-[#6d5310]">Complimentary access</p><p className="mt-2 text-xs leading-5 text-[#68645c]">Grant paid-plan entitlements without collecting payment. Expiry and reason are mandatory and audited.</p><select className="product-input mt-3" value={complimentaryPlanCode} onChange={(event) => setComplimentaryPlanCode(event.target.value)}>{plans.filter((plan) => plan.code !== "TRIAL").map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select><input className="product-input mt-2" type="date" value={complimentaryEndsAt} onChange={(event) => setComplimentaryEndsAt(event.target.value)} /><textarea className="product-input mt-2 min-h-20" placeholder="Business reason and approval reference" value={complimentaryReason} onChange={(event) => setComplimentaryReason(event.target.value)} /><Button className="mt-3 w-full" disabled={saving || !complimentaryPlanCode || !complimentaryEndsAt || !complimentaryReason.trim()} onClick={() => run({ action: "GRANT_COMPLIMENTARY", planCode: complimentaryPlanCode, endsAt: complimentaryEndsAt, reason: complimentaryReason }, "Complimentary access granted.")}>Grant complimentary access</Button></div>
        <div className="rounded-lg border border-black/6 bg-[#fbfcfb] p-5"><p className="field-label">Connector add-on</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><select className="product-input" value={connectorCategory} onChange={(event) => setConnectorCategory(event.target.value)}><option value="GOOGLE_SHEETS_CALENDAR">Google Sheets / Calendar</option><option value="CRM">CRM</option><option value="ECOMMERCE">E-commerce</option><option value="PMS_CHANNEL_MANAGER">PMS / Channel Manager</option><option value="CUSTOM_API">Custom API</option></select><input className="product-input" placeholder="Connector name" value={connectorName} onChange={(event) => setConnectorName(event.target.value)} /><input className="product-input" inputMode="decimal" placeholder="One-time setup ₹" value={setupFeeRupees} onChange={(event) => setSetupFeeRupees(event.target.value)} /><input className="product-input" inputMode="decimal" placeholder="Recurring ₹" value={recurringFeeRupees} onChange={(event) => setRecurringFeeRupees(event.target.value)} /><select className="product-input" value={connectorInterval} onChange={(event) => setConnectorInterval(event.target.value)}><option value="ONE_TIME">One time</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select><input className="product-input" placeholder="External/API fees" value={externalFeeNote} onChange={(event) => setExternalFeeNote(event.target.value)} /></div><Button className="mt-3 w-full" disabled={saving || !connectorName.trim()} onClick={() => run({ action: "ADD_CONNECTOR", category: connectorCategory, name: connectorName, setupFeeRupees, recurringFeeRupees, billingInterval: connectorInterval, externalFeeNote }, "Connector billing added.")}>Add connector charge</Button>{addons.length ? <div className="mt-4 divide-y divide-black/6">{addons.map((addon) => <div key={addon.id} className="flex items-center justify-between gap-3 py-3 text-xs"><span><strong className="block">{addon.name}</strong><small className="text-[#68645c]">{addon.category.replaceAll("_", " ")} · {addon.provisioningStatus}</small></span><span className="font-bold">₹{((addon.setupFeePaisa + addon.recurringFeePaisa) / 100).toLocaleString("en-IN")}</span></div>)}</div> : null}</div>
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
