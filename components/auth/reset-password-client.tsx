"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type ResetInfo = {
  email: string;
  organizationName?: string;
  expiresAt?: string;
};

export function ResetPasswordClient({ token }: { token?: string }) {
  const [info, setInfo] = useState<ResetInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completeEmail, setCompleteEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This password reset link is incomplete.");
      setLoading(false);
      return;
    }
    fetch(`/api/auth/password-reset?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as ResetInfo & { error?: string } | null;
        if (!response.ok || !payload?.email) throw new Error(payload?.error || "This reset link is unavailable.");
        setInfo(payload);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "This reset link is unavailable."))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const result = await response.json().catch(() => null) as { email?: string; error?: string } | null;
      if (!response.ok || !result?.email) throw new Error(result?.error || "Could not reset this password.");
      setCompleteEmail(result.email);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reset this password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f0d8] px-5 py-10 text-[#101010]">
      <section className="w-full max-w-lg rounded-lg border border-[#ded8cb] bg-white p-7 shadow-[0_18px_55px_rgba(16,16,16,0.08)] sm:p-9">
        <Image src="/brand/aifrogi-logo-black.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[170px] grayscale contrast-125" />
        {loading ? (
          <p className="mt-10 text-sm text-[#68645c]">Checking your secure reset link...</p>
        ) : completeEmail ? (
          <div className="mt-10">
            <span className="status-pill status-success">Password updated</span>
            <h1 className="mt-4 text-3xl font-semibold">You can sign in now.</h1>
            <p className="mt-3 text-sm leading-6 text-[#68645c]">Your password for <strong>{completeEmail}</strong> has been reset.</p>
            <Link href="/login" className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#8a6a16] text-sm font-semibold text-white">Continue to sign in</Link>
          </div>
        ) : info ? (
          <div className="mt-9">
            <p className="text-sm font-semibold text-[#8a6a16]">{info.organizationName || "AiFrogi account"}</p>
            <h1 className="mt-2 text-3xl font-semibold">Create a new password</h1>
            <p className="mt-3 text-sm leading-6 text-[#68645c]">Reset password for <strong>{info.email}</strong>. {info.expiresAt ? `This link expires at ${new Date(info.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.` : ""}</p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">New password</span>
                <input className="product-input min-h-12" type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Confirm password</span>
                <input className="product-input min-h-12" type="password" autoComplete="new-password" minLength={10} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </label>
              {error ? <p role="alert" className="rounded-md border border-[#b23a32]/20 bg-[#fff0ee] px-4 py-3 text-sm text-[#9b2f28]">{error}</p> : null}
              <button disabled={saving} className="flex min-h-12 w-full items-center justify-center rounded-md bg-[#8a6a16] px-5 text-sm font-bold text-white hover:bg-[#b28728] disabled:cursor-wait disabled:opacity-60">
                {saving ? "Saving password..." : "Reset password"}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-10">
            <span className="status-pill status-error">Reset link unavailable</span>
            <h1 className="mt-4 text-2xl font-semibold">This link cannot be used.</h1>
            <p className="mt-3 text-sm text-[#68645c]">{error}</p>
            <Link href="/forgot-password" className="mt-6 inline-flex text-sm font-semibold text-[#6d5310]">Request a new reset link</Link>
          </div>
        )}
      </section>
    </main>
  );
}
