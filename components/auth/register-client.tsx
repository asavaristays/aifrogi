"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const industries = ["Hospitality", "Travel", "Retail", "Healthcare", "Education", "Real estate", "Professional services", "Other"];
const botOptions = [
  ["BUSINESS_AI", "BusinessGPT — services, leads and support"], ["STAY", "HotelGPT — stays and guest enquiries"], ["PINGBOOK", "ClinicGPT — appointments and confirmations"], ["RESTAURANT", "DineGPT — dining and reservations"], ["REAL_ESTATE", "PropertyGPT — discovery and site visits"], ["FLOWCART", "FlowCart — products, orders and payments"], ["CUSTOM", "Custom Business Bot — configured workflow"]
];

export function RegisterClient() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completeEmail, setCompleteEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.source = new URLSearchParams(window.location.search).get("source") || "direct";
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null) as { error?: string; email?: string } | null;
      if (!response.ok || !result?.email) throw new Error(result?.error || "Registration could not be completed.");
      setCompleteEmail(result.email);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration could not be completed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#101010]">
      <header className="border-b border-[#ded8cb] bg-white px-5 sm:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <Link href="https://aifrogi.com"><Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[118px] grayscale contrast-125 sm:w-[150px]" /></Link>
          <nav aria-label="Registration navigation" className="flex items-center gap-3 text-xs font-semibold sm:gap-4 sm:text-sm">
            <Link href="https://aifrogi.com" className="text-[#68645c] transition hover:text-[#101010]"><span className="sm:hidden">Main website</span><span className="hidden sm:inline">Back to main website</span></Link>
            <Link href="/login" className="text-[#6d5310]"><span className="hidden sm:inline">Already have an account? </span>Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:py-14">
        <section className="order-2 lg:order-1 lg:pt-7">
          <p className="product-eyebrow">30-day working trial</p>
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">Create your business workspace.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-muted)]">Choose the AI Bot that matches your first business outcome. After email verification, AiFrogi prepares its intelligence, installation code and controlled go-live journey.</p>
          <div className="mt-9 divide-y divide-[#ded8cb] border-y border-[#ded8cb]">
            <FlowRow number="1" title="Verify ownership" copy="A private 24-hour link is sent to your work email." />
            <FlowRow number="2" title="Prepare business intelligence" copy="Approve trusted sources, persona, customer journey and human handover rules." />
            <FlowRow number="3" title="Install and verify" copy="Copy JavaScript, iFrame or WordPress code; AiFrogi detects it before Super Admin enables live traffic." />
          </div>
          <p className="mt-7 text-xs leading-5 text-[var(--text-muted)]"><strong>30 days only:</strong> after the trial, messaging, campaigns, and automation pause automatically until a paid plan is activated. Your data remains preserved. No Facebook password, email password, permanent token, or OTP is requested.</p>
        </section>

        <section className="order-1 rounded-lg border border-[#ded8cb] bg-white p-6 shadow-[0_18px_55px_rgba(16,16,16,0.08)] sm:p-8 lg:order-2">
          {completeEmail ? (
            <div className="flex min-h-[520px] flex-col justify-center">
              <span className="status-pill status-success w-fit">Workspace reserved</span>
              <h2 className="mt-5 text-3xl font-semibold">Check your email.</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--text-muted)]">We sent a private activation link to <strong className="text-[var(--text)]">{completeEmail}</strong>. It expires after 24 hours.</p>
              <div className="mt-7 rounded-md border border-[#ded8cb] bg-[#fbfaf7] p-4 text-sm leading-6 text-[var(--text-muted)]">Open the link, create your personal password, then sign in to continue onboarding. Check spam if it does not arrive within a few minutes.</div>
              <Link href="/login" className="mt-7 inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-[var(--primary-strong)] px-5 text-sm font-semibold text-white">Continue to sign in</Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#8a6a16]">Business registration</p>
              <h2 className="mt-2 text-2xl font-semibold">Tell us who owns this workspace</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Business verification details and Meta connection come after secure account activation.</p>
              <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <Field label="Company name"><input name="companyName" className="product-input mt-2" autoComplete="organization" required /></Field>
                <Field label="Owner name"><input name="ownerName" className="product-input mt-2" autoComplete="name" required /></Field>
                <Field label="Work email"><input name="ownerEmail" className="product-input mt-2" type="email" autoComplete="email" required /></Field>
                <Field label="Mobile"><input name="ownerMobile" className="product-input mt-2" type="tel" autoComplete="tel" placeholder="+91" /></Field>
                <Field label="Business website" wide><input name="website" className="product-input mt-2" type="text" inputMode="url" autoComplete="url" placeholder="https://example.com" required /></Field>
                <Field label="Select your AI Bot" wide><select name="botCategory" className="product-input mt-2" defaultValue="BUSINESS_AI">{botOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                <Field label="Industry"><select name="industry" className="product-input mt-2" defaultValue="Hospitality">{industries.map((industry) => <option key={industry}>{industry}</option>)}</select></Field>
                <Field label="Country"><select name="country" className="product-input mt-2" defaultValue="India"><option>India</option><option>United Arab Emirates</option><option>United Kingdom</option><option>United States</option><option>Other</option></select></Field>
                <Field label="Time zone" wide><select name="timezone" className="product-input mt-2" defaultValue="Asia/Kolkata"><option value="Asia/Kolkata">India Standard Time</option><option value="Asia/Dubai">Gulf Standard Time</option><option value="Europe/London">United Kingdom</option><option value="America/New_York">US Eastern Time</option><option value="America/Los_Angeles">US Pacific Time</option></select></Field>
                <input name="fax" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                {error ? <p role="alert" className="rounded-md border border-[#b23a32]/20 bg-[#fff0ee] px-4 py-3 text-sm text-[#9b2f28] sm:col-span-2">{error}</p> : null}
                <button disabled={saving} className="min-h-12 rounded-md bg-[#8a6a16] px-5 text-sm font-bold text-white hover:bg-[#b28728] disabled:cursor-wait disabled:opacity-60 sm:col-span-2">{saving ? "Reserving workspace..." : "Create trial workspace"}</button>
                <p className="text-xs leading-5 text-[var(--text-muted)] sm:col-span-2">The trial lasts 30 days and then pauses automatically; it is not a free-forever plan. By continuing, you agree to the <Link href="/terms-of-service" className="font-semibold text-[#6d5310]">Terms</Link> and acknowledge the <Link href="/privacy-policy" className="font-semibold text-[#6d5310]">Privacy Policy</Link>.</p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function FlowRow({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className="grid grid-cols-[32px_1fr] gap-4 py-5"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f8f0d8] text-xs font-semibold text-[#6d5310]">{number}</span><div><strong className="text-sm">{title}</strong><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div></div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "block sm:col-span-2" : "block"}><span className="field-label">{label}</span>{children}</label>;
}
