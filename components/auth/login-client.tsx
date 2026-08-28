"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginClient({ returnTo }: { returnTo?: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const otpStep = Boolean(otpChallengeId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, returnTo, otpChallengeId, otpCode })
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
    <main className="grid min-h-screen bg-white text-[#2c243b] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex items-center bg-[#2c243b] px-7 py-12 text-white sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-xl">
          <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[210px]" />
          <p className="mt-16 text-sm font-semibold text-[#ff8af1]">AI messaging platform for business</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">One calm place for customer conversations.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/68">Manage WhatsApp messages, campaigns, automation, and human handoffs without exposing technical complexity to your team.</p>
          <div className="mt-12 grid gap-5 border-t border-white/12 pt-7 text-sm text-white/72 sm:grid-cols-3">
            <span>Secure access</span><span>Client workspaces</span><span>Human control</span>
          </div>
        </div>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <p className="text-sm font-semibold text-[#c725ba]">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold">Sign in to AiFrogi</h2>
          <p className="mt-3 text-sm leading-6 text-[#70697d]">{otpStep ? "Enter the email code to finish secure sign-in." : "Use the email and password assigned to your workspace."}</p>

          <form className="mt-9 space-y-5" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Email</span>
              <input className="product-input min-h-12" type="email" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus disabled={otpStep || submitting} />
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
            {notice ? <p className="rounded-md border border-[#d92bcb]/20 bg-[#fff5fe] px-4 py-3 text-sm text-[#73346f]">{notice}</p> : null}
            {error ? <p role="alert" className="rounded-md border border-[#b23a32]/20 bg-[#fff0ee] px-4 py-3 text-sm text-[#9b2f28]">{error}</p> : null}
            <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center rounded-md bg-[#d92bcb] px-5 text-sm font-bold text-white hover:bg-[#bb20af] disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Signing in..." : otpStep ? "Verify and sign in" : "Sign in"}
            </button>
            {otpStep ? (
              <button type="button" onClick={resetOtpStep} disabled={submitting} className="w-full text-sm font-semibold text-[#a21c98] disabled:opacity-60">
                Use a different email or resend code
              </button>
            ) : null}
          </form>
          <p className="mt-7 text-sm text-[#70697d]">New to AiFrogi? <Link href="/register" className="font-semibold text-[#a21c98]">Start a 30-day trial</Link></p>
          <p className="mt-5 text-xs leading-5 text-[#817789]">
            Need access or forgot your password?{" "}
            <Link href="/forgot-password" className="font-semibold text-[#a21c98]">Reset your password</Link>.
            {" "}Never share OTPs or Meta credentials.
          </p>
          <a href="https://aifrogi.com" className="mt-6 inline-flex text-sm font-semibold text-[#a21c98]">Back to aifrogi.com</a>
        </div>
      </section>
    </main>
  );
}
