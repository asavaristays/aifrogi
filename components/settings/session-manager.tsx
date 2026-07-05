"use client";

import { useEffect, useState } from "react";

type Session = {
  sessionId: string;
  authSource: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/auth/sessions", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (response.ok) { setSessions(payload.sessions || []); setCurrentSessionId(payload.currentSessionId || null); }
  }

  useEffect(() => { void load(); }, []);

  async function revoke(sessionId: string) {
    setMessage("");
    const response = await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    if (!response.ok) { setMessage("Session could not be revoked."); return; }
    if (sessionId === currentSessionId) { window.location.assign("/login"); return; }
    setMessage("Session revoked.");
    await load();
  }

  return <div>
    <div className="space-y-3">{sessions.map((session) => <div key={session.sessionId} className={`border p-4 ${session.revokedAt ? "border-black/7 bg-black/[.02] opacity-60" : "border-black/8 bg-white"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><strong className="text-sm">{session.sessionId === currentSessionId ? "Current session" : session.authSource === "local" ? "AiFrogi sign-in" : "Connected sign-in"}</strong><p className="mt-1 max-w-2xl truncate text-xs text-[var(--text-muted)]">{session.userAgent || "Device details unavailable"}</p><p className="mt-1 text-xs text-[var(--text-muted)]">IP {session.ipAddress || "Unavailable"} · Expires {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.expiresAt))}</p></div>{!session.revokedAt ? <button type="button" onClick={() => revoke(session.sessionId)} className="text-left text-xs font-bold text-[#a3342b] underline underline-offset-2">{session.sessionId === currentSessionId ? "Sign out this device" : "Revoke session"}</button> : <span className="text-xs font-bold text-[var(--text-muted)]">Revoked</span>}</div></div>)}</div>
    {!sessions.length ? <p className="text-sm text-[var(--text-muted)]">No active sessions are registered.</p> : null}
    {message ? <p className="mt-3 text-sm font-bold text-[#178665]">{message}</p> : null}
  </div>;
}
