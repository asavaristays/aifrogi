"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type OperationMapping = { health?: string; availability?: string; quote?: string; create?: string; status?: string; cancel?: string; paymentVerification?: string };
export type BotConnectorView = { connectorKey: string; name: string; provider?: string | null; requiredFor: string; required: boolean; enabled: boolean; lifecycle: string; readOperations: string[]; writeOperations: string[]; unavailableBehavior: string; lastVerifiedAt?: string | Date | null; apiBaseUrl?: string | null; authType?: string; operationMapping?: unknown; lastHealthStatus?: string | null; lastHealthCode?: number | null; lastHealthAt?: string | Date | null; lastError?: string | null };

const lifecycleValues = ["REQUESTED", "AUTHORISED", "CONNECTED", "MAPPED", "SANDBOX_TESTED", "VERIFIED", "LIVE", "MONITORED", "SUSPENDED", "RETIRED"];

export function BotConnectorPlan({ connectors, organizationId, management = "admin", canManage = true }: { connectors: BotConnectorView[]; organizationId?: string; management?: "admin" | "customer"; canManage?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(connectors);
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [secretByKey, setSecretByKey] = useState<Record<string, string>>({});
  const adminManaged = Boolean(organizationId) && management === "admin";
  const customerManaged = management === "customer" && canManage;

  async function save(item: BotConnectorView) {
    if (!adminManaged) return;
    setSavingKey(item.connectorKey); setMessage("");
    const response = await fetch(`/api/admin/customers/${organizationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "UPDATE_BOT_CONNECTOR", connectorKey: item.connectorKey, provider: item.provider, lifecycle: item.lifecycle, enabled: item.enabled }) });
    const payload = await response.json().catch(() => null);
    setSavingKey(""); setMessage(response.ok ? `${item.name} updated.` : payload?.error || "Connector could not be updated.");
    if (response.ok) router.refresh();
  }

  function update(index: number, changes: Partial<BotConnectorView>) { setItems((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, ...changes } : candidate)); }
  function mapping(item: BotConnectorView): OperationMapping { return item.operationMapping && typeof item.operationMapping === "object" && !Array.isArray(item.operationMapping) ? item.operationMapping as OperationMapping : {}; }

  async function apiAction(item: BotConnectorView, action: "SAVE_CONNECTOR_API" | "TEST_CONNECTOR_API") {
    if (!customerManaged) return;
    setSavingKey(`${item.connectorKey}:${action}`); setMessage("");
    const response = await fetch("/api/setup/connectors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, connectorKey: item.connectorKey, apiBaseUrl: item.apiBaseUrl, authType: item.authType || "BEARER", secret: secretByKey[item.connectorKey] || undefined, operationMapping: mapping(item) }) });
    const payload = await response.json().catch(() => null);
    setSavingKey("");
    if (response.ok) { setSecretByKey((current) => ({ ...current, [item.connectorKey]: "" })); setMessage(payload?.test?.message || `${item.name} API configuration saved.`); router.refresh(); }
    else setMessage(payload?.error || payload?.test?.message || "Connector API operation failed.");
  }

  if (!items.length) return null;
  return <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm sm:p-8">
    <p className="product-eyebrow">Connector control</p><h2 className="mt-2 text-xl font-black">{management === "customer" ? "Connect your business systems" : "Review customer connector evidence"}</h2><p className="mt-2 text-sm leading-6 text-[#68645c]">{management === "customer" ? "Configure and test your API here. Secrets are encrypted and never shown again. AiFrogi Super Admin reviews the connection before any booking or external action can become live." : "Customers configure and test their own APIs. Super Admin reviews the evidence, advances the governed lifecycle and enables a connector only after mapping, sandbox testing and verification."}</p>
    <div className="mt-6 space-y-4">{items.map((item, index) => <article key={item.connectorKey} className="rounded-lg border border-black/8 bg-[#fbfcfb] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.name}</h3><span className={`status-pill ${item.required ? "status-warning" : "status-info"}`}>{item.required ? "required" : "optional"}</span><span className={`status-pill ${item.enabled ? "status-success" : "status-info"}`}>{item.lifecycle.toLowerCase().replaceAll("_", " ")}</span></div><p className="mt-1 font-mono text-[11px] text-[#8a6a16]">{item.connectorKey}</p></div>{item.lastVerifiedAt ? <small className="text-xs text-[#68645c]">Verified {new Date(item.lastVerifiedAt).toLocaleString("en-IN")}</small> : null}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="field-label">Reads</p><p className="mt-2 text-xs leading-5 text-[#68645c]">{item.readOperations.join(" · ") || "No reads approved"}</p></div><div><p className="field-label">Writes</p><p className="mt-2 text-xs leading-5 text-[#68645c]">{item.writeOperations.join(" · ") || "No writes approved"}</p></div></div>
      <div className="mt-4 rounded-md border border-[#ded8cb] bg-[#f8f0d8] p-3"><p className="field-label">If unavailable</p><p className="mt-1 text-xs leading-5 text-[#5e594f]">{item.unavailableBehavior}</p></div>
      <div className="mt-4 rounded-lg border border-black/8 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="field-label">API integration</p><p className="mt-1 text-xs text-[#68645c]">{management === "customer" ? "Configure a public HTTPS provider endpoint. Credentials stay server-side." : "Customer configuration and authenticated test evidence."}</p></div><span className={`status-pill ${item.lastHealthStatus === "HEALTHY" ? "status-success" : item.lastHealthStatus === "FAILED" ? "status-warning" : "status-info"}`}>{item.lastHealthStatus === "HEALTHY" ? `healthy · HTTP ${item.lastHealthCode}` : item.lastHealthStatus === "FAILED" ? "test failed" : "not tested"}</span></div>
        {customerManaged ? <>
        <div className="mt-4 grid gap-3 md:grid-cols-2"><label><span className="field-label">API base URL</span><input className="product-input mt-2" type="url" value={item.apiBaseUrl || ""} onChange={(event)=>update(index,{apiBaseUrl:event.target.value})} placeholder="https://booking.example.com/api/aifrogi" /></label><label><span className="field-label">Authentication</span><select className="product-input mt-2" value={item.authType || "BEARER"} onChange={(event)=>update(index,{authType:event.target.value})}><option value="BEARER">Bearer token</option><option value="API_KEY">X-API-Key</option><option value="NONE">No authentication</option></select></label></div>
        {(item.authType || "BEARER") !== "NONE" ? <label className="mt-3 block"><span className="field-label">API secret</span><input className="product-input mt-2" type="password" autoComplete="new-password" value={secretByKey[item.connectorKey] || ""} onChange={(event)=>setSecretByKey((current)=>({...current,[item.connectorKey]:event.target.value}))} placeholder={item.apiBaseUrl ? "Leave blank to retain saved secret" : "Paste once; it will not be displayed"}/></label> : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{([['health','Health check'],['availability','Availability'],['quote','Quote'],['create','Create booking'],['status','Booking status'],['cancel','Cancel booking'],['paymentVerification','Payment verification']] as const).map(([key,label])=><label key={key}><span className="field-label">{label} path</span><input className="product-input mt-2" value={mapping(item)[key] || (key === "health" ? "/health" : "")} onChange={(event)=>update(index,{operationMapping:{...mapping(item),[key]:event.target.value}})} placeholder={key === "paymentVerification" ? "/v1/payments/{paymentId}/verify" : `/v1/${key}`} /></label>)}</div>
        {item.lastError ? <p className="mt-3 text-xs font-semibold text-[#a3342b]">{item.lastError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3"><Button disabled={savingKey.startsWith(item.connectorKey)} onClick={()=>apiAction(item,"SAVE_CONNECTOR_API")}>{savingKey === `${item.connectorKey}:SAVE_CONNECTOR_API` ? "Saving" : "Save API securely"}</Button><Button tone="surface" disabled={savingKey.startsWith(item.connectorKey) || !item.apiBaseUrl} onClick={()=>apiAction(item,"TEST_CONNECTOR_API")}>{savingKey === `${item.connectorKey}:TEST_CONNECTOR_API` ? "Testing" : "Test connection"}</Button></div>
        </> : <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><span className="field-label block">API host</span><span className="mt-1 block break-all">{item.apiBaseUrl || "Not configured by customer"}</span></p><p><span className="field-label block">Last test</span><span className="mt-1 block">{item.lastHealthAt ? new Date(item.lastHealthAt).toLocaleString("en-IN") : "Not tested"}</span></p></div>}
      </div>
      {adminManaged ? <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"><label><span className="field-label">Provider</span><input className="product-input mt-2" value={item.provider || ""} onChange={(event) => setItems((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, provider: event.target.value } : candidate))} placeholder="Google, Zoho, PMS vendor…" /></label><label><span className="field-label">Lifecycle</span><select className="product-input mt-2" value={item.lifecycle} onChange={(event) => setItems((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, lifecycle: event.target.value, enabled: ["LIVE", "MONITORED"].includes(event.target.value) ? candidate.enabled : false } : candidate))}>{lifecycleValues.map((value)=><option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="flex h-11 items-center gap-2 rounded-md border border-black/8 px-3 text-sm font-semibold"><input type="checkbox" checked={item.enabled} disabled={!(["LIVE", "MONITORED"].includes(item.lifecycle))} onChange={(event)=>setItems((current)=>current.map((candidate,candidateIndex)=>candidateIndex===index?{...candidate,enabled:event.target.checked}:candidate))}/>Enabled</label><Button disabled={savingKey === item.connectorKey} onClick={()=>save(item)}>{savingKey === item.connectorKey ? "Saving" : "Save review"}</Button></div> : null}
    </article>)}</div>
    {message ? <p className={`mt-4 text-sm font-semibold ${message.includes("updated") ? "text-[#16794a]" : "text-[#a3342b]"}`}>{message}</p> : null}
  </section>;
}
