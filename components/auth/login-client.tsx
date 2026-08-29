"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginClient({ returnTo }: { returnTo?: string }) {
  const [accessType, setAccessType] = useState<"client" | "admin">("client");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const otpStep = Boolean(otpChallengeId);
  const accessCopy = accessType === "admin"
    ? "Use your approved AiFrogi administrator email and password."
    : "Use the email and password assigned to your client workspace.";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, returnTo, accountType: accessType, otpChallengeId, otpCode })
      });
      const result = (await response.json()) as {
        error?: string;
        redirectUrl?: string;
        otpRequired?: boolean;
        otpChallengeId?: string;
        expiresAt?: string;
        message?: string;
      };
      if (response.status === 202 && result.otpRequired && result.otpChallengeId) {
        setOtpChallengeId(result.otpChallengeId);
        setOtpExpiresAt(result.expiresAt || "");
        setOtpCode("");
        setNotice(result.message || "Enter the 6-digit code sent to your email.");
        return;
      }
      if (!response.ok || !result.redirectUrl) {
        setError(result.error || "Sign in could not be completed.");
        return;
      }
      window.location.replace(result.redirectUrl);
    } catch {
      setError("AiFrogi is temporarily unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetOtpStep() {
    setOtpChallengeId("");
    setOtpExpiresAt("");
    setOtpCode("");
    setError("");
    setNotice("");
  }

  return (
    <main className="grid min-h-screen bg-[var(--warm-50)] text-[var(--ink-900)] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex items-center bg-[var(--ink-950)] px-7 py-12 text-white sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-xl">
          <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[240px] grayscale contrast-125" />
          <p className="mt-16 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold-300)]">Sovereign business intelligence</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Your business intelligence. Under your control.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/68">Operate customer conversations, approved knowledge, automation, and human handoffs from one accountable workspace.</p>
          <div className="mt-12 grid gap-5 border-t border-white/12 pt-7 text-sm text-white/72 sm:grid-cols-3">
            <span>Secure access</span><span>Client workspaces</span><span>Human control</span>
          </div>
        </div>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--gold-700)]">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold">Sign in to AiFrogi</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{otpStep ? "Enter the email code to finish secure sign-in." : accessCopy}</p>

          {!otpStep ? (
            <div className="mt-7 grid grid-cols-2 gap-3" role="group" aria-label="Choose account type">
              <button
                type="button"
                onClick={() => setAccessType("client")}
                className={`rounded-md border p-4 text-left transition ${accessType === "client" ? "border-[var(--gold-600)] bg-[var(--primary-soft)] ring-1 ring-[var(--gold-600)]" : "border-[var(--border)] bg-white hover:border-[var(--gold-500)]"}`}
                aria-pressed={accessType === "client"}
              >
                <span className="block text-sm font-bold">Client login</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">Open your business workspace.</span>
              </button>
              <button
                type="button"
                onClick={() => setAccessType("admin")}
                className={`rounded-md border p-4 text-left transition ${accessType === "admin" ? "border-[var(--gold-600)] bg-[var(--primary-soft)] ring-1 ring-[var(--gold-600)]" : "border-[var(--border)] bg-white hover:border-[var(--gold-500)]"}`}
                aria-pressed={accessType === "admin"}
              >
                <span className="block text-sm font-bold">Admin login</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">Open the AiFrogi control center.</span>
              </button>
            </div>
          ) : null}

          <form className="mt-7 space-y-5" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">{accessType === "admin" ? "Admin email" : "Client email"}</span>
              <input className="product-input min-h-12" type="email" autoComplete="username" placeholder={accessType === "admin" ? "admin@aifrogi.com" : "you@yourbusiness.com"} value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus disabled={otpStep || submitting} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Password</span>
              <input className="product-input min-h-12" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={otpStep || submitting} />
            </label>
            {otpStep ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Email OTP</span>
                <input
                  className="product-input min-h-12 tracking-[.28em]"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  required
                />
                <span className="mt-2 block text-xs leading-5 text-[#817789]">
                  Code expires in 10 minutes{otpExpiresAt ? ` (${new Date(otpExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}.
                </span>
              </label>
            ) : null}
            {notice ? <p className="rounded-md border border-[var(--gold-600)]/25 bg-[var(--primary-soft)] px-4 py-3 text-sm text-[var(--gold-700)]">{notice}</p> : null}
            {error ? <p role="alert" className="rounded-md border border-[#b23a32]/20 bg-[#fff0ee] px-4 py-3 text-sm text-[#9b2f28]">{error}</p> : null}
            <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center rounded-md bg-[var(--gold-600)] px-5 text-sm font-bold text-[var(--ink-600)] shadow-sm hover:bg-[var(--gold-500)] hover:text-[var(--ink-600)] disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Signing in..." : otpStep ? "Verify and sign in" : "Sign in"}
            </button>
            {otpStep ? (
              <button type="button" onClick={resetOtpStep} disabled={submitting} className="w-full text-sm font-semibold text-[var(--gold-700)] disabled:opacity-60">
                Use a different email or resend code
              </button>
            ) : null}
          </form>
          <p className="mt-7 text-sm text-[var(--text-muted)]">New to AiFrogi? <Link href="/register" className="font-semibold text-[var(--gold-700)]">Start a 30-day trial</Link></p>
          <div className="mt-5 flex items-center justify-between gap-4 text-sm">
            <Link href="/forgot-password" className="font-semibold text-[var(--gold-700)]">Forgot password?</Link>
            <span className="text-xs text-[#817789]">Never share OTPs or credentials.</span>
          </div>
          <a href="https://aifrogi.com" className="mt-6 inline-flex text-sm font-semibold text-[var(--gold-700)]">Back to aifrogi.com</a>
        </div>
      </section>
    </main>
  );
}
