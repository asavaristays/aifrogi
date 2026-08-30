"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type BotConnectorView = { connectorKey: string; name: string; provider?: string | null; requiredFor: string; required: boolean; enabled: boolean; lifecycle: string; readOperations: string[]; writeOperations: string[]; unavailableBehavior: string; lastVerifiedAt?: string | Date | null };

const lifecycleValues = ["REQUESTED", "AUTHORISED", "CONNECTED", "MAPPED", "SANDBOX_TESTED", "VERIFIED", "LIVE", "MONITORED", "SUSPENDED", "RETIRED"];

export function BotConnectorPlan({ connectors, organizationId }: { connectors: BotConnectorView[]; organizationId?: string }) {
  const router = useRouter();
  const [items, setItems] = useState(connectors);
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const editable = Boolean(organizationId);

  async function save(item: BotConnectorView) {
    if (!organizationId) return;
    setSavingKey(item.connectorKey); setMessage("");
    const response = await fetch(`/api/admin/customers/${organizationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "UPDATE_BOT_CONNECTOR", connectorKey: item.connectorKey, provider: item.provider, lifecycle: item.lifecycle, enabled: item.enabled }) });
    const payload = await response.json().catch(() => null);
    setSavingKey(""); setMessage(response.ok ? `${item.name} updated.` : payload?.error || "Connector could not be updated.");
    if (response.ok) router.refresh();
  }

  if (!items.length) return null;
  return <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm sm:p-8">
    <p className="product-eyebrow">Connector plan</p><h2 className="mt-2 text-xl font-black">Systems required by this persona</h2><p className="mt-2 text-sm leading-6 text-[#68645c]">The category pack defines reads, writes, and safe failure behavior once. SuperAdmin advances a connector only after authorisation, mapping, sandbox testing, and verification.</p>
    <div className="mt-6 space-y-4">{items.map((item, index) => <article key={item.connectorKey} className="rounded-lg border border-black/8 bg-[#fbfcfb] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.name}</h3><span className={`status-pill ${item.required ? "status-warning" : "status-info"}`}>{item.required ? "required" : "optional"}</span><span className={`status-pill ${item.enabled ? "status-success" : "status-info"}`}>{item.lifecycle.toLowerCase().replaceAll("_", " ")}</span></div><p className="mt-1 font-mono text-[11px] text-[#8a6a16]">{item.connectorKey}</p></div>{item.lastVerifiedAt ? <small className="text-xs text-[#68645c]">Verified {new Date(item.lastVerifiedAt).toLocaleString("en-IN")}</small> : null}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="field-label">Reads</p><p className="mt-2 text-xs leading-5 text-[#68645c]">{item.readOperations.join(" · ") || "No reads approved"}</p></div><div><p className="field-label">Writes</p><p className="mt-2 text-xs leading-5 text-[#68645c]">{item.writeOperations.join(" · ") || "No writes approved"}</p></div></div>
      <div className="mt-4 rounded-md border border-[#ded8cb] bg-[#f8f0d8] p-3"><p className="field-label">If unavailable</p><p className="mt-1 text-xs leading-5 text-[#5e594f]">{item.unavailableBehavior}</p></div>
      {editable ? <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"><label><span className="field-label">Provider</span><input className="product-input mt-2" value={item.provider || ""} onChange={(event) => setItems((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, provider: event.target.value } : candidate))} placeholder="Google, Zoho, PMS vendor…" /></label><label><span className="field-label">Lifecycle</span><select className="product-input mt-2" value={item.lifecycle} onChange={(event) => setItems((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, lifecycle: event.target.value, enabled: ["LIVE", "MONITORED"].includes(event.target.value) ? candidate.enabled : false } : candidate))}>{lifecycleValues.map((value)=><option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="flex h-11 items-center gap-2 rounded-md border border-black/8 px-3 text-sm font-semibold"><input type="checkbox" checked={item.enabled} disabled={!(["LIVE", "MONITORED"].includes(item.lifecycle))} onChange={(event)=>setItems((current)=>current.map((candidate,candidateIndex)=>candidateIndex===index?{...candidate,enabled:event.target.checked}:candidate))}/>Enabled</label><Button disabled={savingKey === item.connectorKey} onClick={()=>save(item)}>{savingKey === item.connectorKey ? "Saving" : "Save"}</Button></div> : null}
    </article>)}</div>
    {message ? <p className={`mt-4 text-sm font-semibold ${message.includes("updated") ? "text-[#16794a]" : "text-[#a3342b]"}`}>{message}</p> : null}
  </section>;
}

