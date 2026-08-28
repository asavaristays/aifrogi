"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setResetUrl("");
    setError("");
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const result = await response.json().catch(() => null) as { error?: string; emailSent?: boolean; resetUrl?: string } | null;
      if (!response.ok) throw new Error(result?.error || "Could not request a reset link.");
      setNotice(result?.emailSent
        ? "If this email has access, a password reset link has been sent."
        : "If this email has access, a reset link will be sent when mailbox delivery is available.");
      if (result?.resetUrl) setResetUrl(result.resetUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not request a reset link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-[#2c243b]">
      <section className="w-full max-w-md">
        <Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[170px]" />
        <p className="mt-10 text-sm font-semibold text-[#c725ba]">Password reset</p>
        <h1 className="mt-2 text-3xl font-semibold">Reset your AiFrogi password</h1>
        <p className="mt-3 text-sm leading-6 text-[#70697d]">Enter your account email. If it has access, AiFrogi will create a secure reset link.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input className="product-input min-h-12" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
          </label>
          {notice ? <p className="rounded-md border border-[#d92bcb]/20 bg-[#fff5fe] px-4 py-3 text-sm text-[#73346f]">{notice}</p> : null}
          {resetUrl ? (
            <div className="rounded-md border border-[#eadfed] bg-[#fbf8fc] p-3 text-xs leading-5 text-[#70697d]">
              <p className="font-semibold text-[#2c243b]">Temporary reset link</p>
              <Link className="mt-1 block break-all font-semibold text-[#a21c98]" href={resetUrl}>{resetUrl}</Link>
            </div>
          ) : null}
          {error ? <p role="alert" className="rounded-md border border-[#b23a32]/20 bg-[#fff0ee] px-4 py-3 text-sm text-[#9b2f28]">{error}</p> : null}
          <button disabled={saving} className="flex min-h-12 w-full items-center justify-center rounded-md bg-[#d92bcb] px-5 text-sm font-bold text-white hover:bg-[#bb20af] disabled:cursor-wait disabled:opacity-60">
            {saving ? "Requesting link..." : "Send reset link"}
          </button>
        </form>
        <Link href="/login" className="mt-7 inline-flex text-sm font-semibold text-[#2c243b]">Back to sign in</Link>
      </section>
    </main>
  );
}
