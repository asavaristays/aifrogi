"use client";

import { useState } from "react";

type Grant = {
  id: string;
  scopes: string[];
  reason: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  active: boolean;
};

type Event = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

const scopes = [
  { value: "CONVERSATIONS", label: "Support conversations" },
  { value: "DOCUMENTS", label: "Uploaded documents" },
  { value: "KNOWLEDGE", label: "Knowledge base" },
  { value: "INTEGRATIONS", label: "Integration settings" }
];

const durations = [
  { value: 30, label: "30 minutes" },
  { value: 120, label: "2 hours" },
  { value: 1440, label: "24 hours" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function SupportAccessPanel({ initialGrants, initialEvents, canManage }: { initialGrants: Grant[]; initialEvents: Event[]; canManage: boolean }) {
  const [grants, setGrants] = useState(initialGrants);
  const [events, setEvents] = useState(initialEvents);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["CONVERSATIONS"]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState("Support requested access to troubleshoot my issue.");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const activeGrants = grants.filter((grant) => grant.active);

  async function submit(action: "GRANT" | "REVOKE", grantId?: string) {
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/support/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "GRANT" ? { action, scopes: selectedScopes, durationMinutes, reason } : { action, grantId })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error || "Could not update support access.");
      return;
    }
    setGrants(payload.grants || []);
    setEvents(payload.events || []);
    setNotice(action === "GRANT" ? "Support access granted and logged." : "Support access revoked and logged.");
  }

  function toggleScope(scope: string) {
    setSelectedScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="product-eyebrow">Customer-controlled access</p>
          <h2 className="mt-2 text-xl font-bold">AiFrogi support cannot read private data by default.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Grant temporary access only when you want support to inspect conversations, files, knowledge, or integrations. Every grant, revoke, and support view is logged here.</p>
        </div>
        <span className={`status-pill ${activeGrants.length ? "status-warning" : "status-success"}`}>{activeGrants.length ? `${activeGrants.length} active` : "No active access"}</span>
      </div>

      {canManage ? (
        <div className="mt-6 grid gap-4 border-y border-black/8 py-5 lg:grid-cols-[1fr_180px]">
          <div>
            <p className="field-label">Access scope</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {scopes.map((scope) => (
                <label key={scope.value} className="flex items-center gap-3 rounded-md border border-black/8 px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" checked={selectedScopes.includes(scope.value)} onChange={() => toggleScope(scope.value)} />
                  {scope.label}
                </label>
              ))}
            </div>
            <label className="mt-4 block"><span className="field-label">Reason shown in audit log</span><input className="product-input mt-2" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          </div>
          <div>
            <label><span className="field-label">Duration</span><select className="product-input mt-2" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>{durations.map((duration) => <option key={duration.value} value={duration.value}>{duration.label}</option>)}</select></label>
            <button type="button" disabled={saving} onClick={() => submit("GRANT")} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#d92bcb] px-4 text-sm font-bold text-white disabled:opacity-60">Grant access</button>
          </div>
        </div>
      ) : <p className="mt-5 rounded-md bg-[#fbf8fc] px-4 py-3 text-sm text-[var(--text-muted)]">Only workspace owners and admins can grant support access.</p>}

      {error ? <p className="mt-4 rounded-md bg-[#fff2f0] px-4 py-3 text-sm font-semibold text-[#a8322d]">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-md bg-[#edf9f3] px-4 py-3 text-sm font-semibold text-[#146b58]">{notice}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold">Active grants</h3>
          <div className="mt-3 space-y-3">
            {activeGrants.length ? activeGrants.map((grant) => (
              <div key={grant.id} className="rounded-lg border border-[#f0d8ed] bg-[#fff7fe] p-4">
                <p className="text-sm font-bold">{grant.scopes.join(", ")}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Expires {formatDate(grant.expiresAt)} · granted by {grant.grantedBy}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{grant.reason}</p>
                {canManage ? <button type="button" disabled={saving} onClick={() => submit("REVOKE", grant.id)} className="mt-3 text-xs font-bold text-[#a8322d]">Revoke now</button> : null}
              </div>
            )) : <p className="rounded-md border border-dashed border-black/10 p-4 text-sm text-[var(--text-muted)]">No active support access.</p>}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold">Access audit</h3>
          <div className="mt-3 max-h-72 space-y-3 overflow-auto pr-2">
            {events.length ? events.map((event) => (
              <div key={event.id} className="border-l-2 border-[#d92bcb] pl-3">
                <p className="text-sm font-semibold">{event.summary}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{event.actorEmail} · {event.action.replaceAll("_", " ")} · {formatDate(event.createdAt)}</p>
              </div>
            )) : <p className="rounded-md border border-dashed border-black/10 p-4 text-sm text-[var(--text-muted)]">No access events yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
