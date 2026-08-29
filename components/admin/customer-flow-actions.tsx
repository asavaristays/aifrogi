"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const metaBillingOptions = [
  { value: "NOT_CONFIRMED", label: "Not confirmed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "BLOCKED", label: "Blocked" }
];

const templateOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "PENDING", label: "Pending with Meta" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" }
];

const firstMessageOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "READY", label: "Ready to test" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" }
];

export function CustomerFlowActions({
  organizationId,
  metaBillingStatus,
  templateStatus,
  firstMessageStatus
}: {
  organizationId: string;
  metaBillingStatus?: string | null;
  templateStatus?: string | null;
  firstMessageStatus?: string | null;
}) {
  const router = useRouter();
  const [billing, setBilling] = useState(metaBillingStatus || "NOT_CONFIRMED");
  const [template, setTemplate] = useState(templateStatus || "NOT_STARTED");
  const [firstMessage, setFirstMessage] = useState(firstMessageStatus || "NOT_STARTED");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/customers/${organizationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_FLOW_STATUS",
        metaBillingStatus: billing,
        templateStatus: template,
        firstMessageStatus: firstMessage,
        note
      })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error || "Flow status could not be saved");
      return;
    }
    setNote("");
    setMessage("Operating flow updated.");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <div>
        <p className="product-eyebrow">Super Admin proof</p>
        <h2 className="mt-2 text-lg font-black">External flow status</h2>
        <p className="mt-2 text-sm leading-6 text-[#68645c]">Use this to keep the customer dashboard honest when Meta, billing, or first-message testing happens outside the app.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SelectField label="Meta billing" value={billing} onChange={setBilling} options={metaBillingOptions} />
        <SelectField label="Template" value={template} onChange={setTemplate} options={templateOptions} />
        <SelectField label="First message" value={firstMessage} onChange={setFirstMessage} options={firstMessageOptions} />
      </div>
      <textarea
        className="mt-4 min-h-20 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional internal note, e.g. Template approved and test sent to client number"
      />
      {error ? <p className="mt-3 text-sm font-semibold text-[#a3342b]">{error}</p> : null}
      {message ? <p className="mt-3 text-sm font-semibold text-[#167759]">{message}</p> : null}
      <div className="mt-4">
        <Button disabled={saving} onClick={save}>{saving ? "Saving..." : "Save flow status"}</Button>
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-[#68645c]">{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-semibold outline-none focus:border-[#8a6a16]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
