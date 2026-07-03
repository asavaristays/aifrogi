"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Invitation = { email: string; name?: string | null; role: string; organizationName: string; registration?: boolean };

export function ActivationClient({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setError("This invitation link is incomplete."); setLoading(false); return; }
    fetch(`/api/auth/invitation?token=${encodeURIComponent(token)}`, { cache: "no-store" }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "This invitation is unavailable.");
      setInvitation(payload);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "This invitation is unavailable.")).finally(() => setLoading(false));
  }, [token]);

  async function activate(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/auth/invitation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not activate this account.");
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not activate this account.");
    } finally { setSaving(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f4f8] px-5 py-10 text-[var(--text)]"><section className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-soft)] sm:p-9"><Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[170px]" />{loading ? <p className="mt-10 text-sm text-[var(--text-muted)]">Checking your secure link...</p> : complete ? <div className="mt-10"><span className="status-pill status-success">Account ready</span><h1 className="mt-4 text-3xl font-semibold">Welcome to AiFrogi.</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Your personal password is active. Sign in with {invitation?.email}{invitation?.registration ? " to continue your guided setup" : ""}.</p><Link href={invitation?.registration ? "/login?returnTo=%2Fonboarding" : "/login"} className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] text-sm font-semibold text-white">Continue to sign in</Link></div> : invitation ? <div className="mt-9"><p className="product-eyebrow">{invitation.registration ? "Verify workspace ownership" : "Team invitation"}</p><h1 className="mt-2 text-3xl font-semibold">{invitation.registration ? `Activate ${invitation.organizationName}` : `Join ${invitation.organizationName}`}</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Create a personal password for <strong>{invitation.email}</strong>. {invitation.registration ? "This confirms ownership and unlocks guided onboarding." : `Your access role is ${invitation.role.toLowerCase()}.`}</p><form onSubmit={activate} className="mt-7 space-y-4"><label className="block"><span className="field-label">Password</span><input className="product-input mt-2" type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label className="block"><span className="field-label">Confirm password</span><input className="product-input mt-2" type="password" autoComplete="new-password" minLength={10} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>{error ? <p className="rounded-md bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]">{error}</p> : null}<button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] text-sm font-semibold text-white disabled:opacity-55">{saving ? "Activating..." : invitation.registration ? "Activate trial workspace" : "Create account"}</button></form><p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">Use at least 10 characters. AiFrogi will never ask you to share this password, an OTP, or Meta credentials.</p></div> : <div className="mt-10"><span className="status-pill status-error">Secure link unavailable</span><h1 className="mt-4 text-2xl font-semibold">This link cannot be used.</h1><p className="mt-3 text-sm text-[var(--text-muted)]">{error}</p><Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-[var(--primary-strong)]">Return to sign in</Link></div>}</section></main>;
}
