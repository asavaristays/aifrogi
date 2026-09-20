"use client";

import { useEffect, useState } from "react";

type Client = { id: string; label: string; scopes: string[]; enabled: boolean; lastUsedAt: string | null; expiresAt: string | null; revokedAt: string | null; createdAt: string };

export function AgentGatewaySettings({ slug, canManage, live }: { slug: string; canManage: boolean; live: boolean }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/agent-gateway/clients", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (response.ok) setClients(payload.clients || []); else setNotice(payload?.error || "Could not load Agent Gateway credentials.");
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    setNotice(null); setSecret(null);
    const response = await fetch("/api/agent-gateway/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) { setNotice(payload?.error || "Credential could not be created."); return; }
    setSecret(payload.token); setLabel(""); setNotice("Credential created. Copy it now; AiFrogi will not display it again."); await load();
  }
  async function toggle(client: Client) {
    setNotice(null);
    const response = await fetch("/api/agent-gateway/clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, enabled: !client.enabled }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) { setNotice(payload?.error || "Credential could not be updated."); return; }
    setNotice(client.enabled ? "Credential revoked. Live agent access stopped immediately." : "Credential enabled."); await load();
  }
  const profileUrl = typeof window === "undefined" ? "" : `${window.location.origin}/api/agent/v1/${slug}/profile`;
  return <section id="agent-gateway" className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
    <p className="product-eyebrow">Agent Gateway · read-only pilot</p>
    <h2 className="mt-1 text-xl font-semibold">Let verified AI agents discover your business safely</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">This release shares tenant-approved facts publicly and permits live availability only through a revocable, tenant-scoped credential. It cannot create bookings, payments, quotes or customer records.</p>
    {!live ? <p className="mt-4 rounded-lg border border-[#e4c77a] bg-[#fff9e8] px-4 py-3 text-sm text-[#6d5310]">Make the Website Bot live first. That same approval boundary protects Agent Gateway discovery.</p> : null}
    {live ? <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><label><span className="field-label">External agent credential name</span><input className="product-input mt-2" disabled={!canManage} value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Example: Travel planner sandbox" /></label><button type="button" disabled={!canManage || !label.trim()} onClick={create} className="min-h-11 rounded-full bg-[#101010] px-5 text-sm font-semibold text-white disabled:opacity-50">Create read-only credential</button></div> : null}
    {secret ? <div className="mt-4 rounded-xl border border-[#b99530] bg-[#fff9e8] p-4"><p className="text-sm font-bold">Copy this credential now. It will not be displayed again.</p><code className="mt-3 block overflow-x-auto rounded-lg bg-[#171717] p-3 text-xs text-white">{secret}</code><button type="button" onClick={() => navigator.clipboard.writeText(secret)} className="mt-3 text-sm font-semibold text-[#6d5310]">Copy credential</button></div> : null}
    {live ? <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#fbfaf7] p-4"><p className="text-sm font-semibold">Public discovery profile</p><code className="mt-2 block break-all text-xs text-[var(--text-muted)]">{profileUrl}</code><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">Availability endpoint: <code>/api/agent/v1/{slug}/availability</code> · POST · Bearer credential · ISO dates required.</p></div> : null}
    <div className="mt-5 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">{loading ? <p className="p-4 text-sm text-[var(--text-muted)]">Loading credentials…</p> : clients.length ? clients.map((client) => <div key={client.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{client.label}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{client.enabled && !client.revokedAt ? "Active" : "Revoked"} · {client.scopes.join(", ")} · Last used {client.lastUsedAt ? new Date(client.lastUsedAt).toLocaleString() : "never"}</p></div><button type="button" disabled={!canManage} onClick={() => toggle(client)} className={`min-h-10 rounded-full px-4 text-xs font-bold disabled:opacity-50 ${client.enabled && !client.revokedAt ? "border border-[#c94c43] text-[#a6322a]" : "bg-[#101010] text-white"}`}>{client.enabled && !client.revokedAt ? "Revoke" : "Enable"}</button></div>) : <p className="p-4 text-sm text-[var(--text-muted)]">No external agent credential exists. Discovery is disabled until you create one.</p>}</div>
    {notice ? <p role="status" className="mt-4 rounded-lg bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</p> : null}
  </section>;
}
