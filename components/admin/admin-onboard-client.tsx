"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";

const bots = [
  ["BUSINESS_AI", "BusinessGPT", "Services, leads and support"], ["STAY", "HotelGPT", "Guest enquiries and stays"], ["PINGBOOK", "ClinicGPT", "Appointments and confirmations"], ["RESTAURANT", "DineGPT", "Dining and reservations"], ["EDUCATION", "eduGPT", "Admissions and student enquiries"], ["REAL_ESTATE", "PropertyGPT", "Discovery and site visits"], ["FLOWCART", "FlowCart", "Products, orders and payments"], ["CUSTOM", "Custom Bot", "A governed custom workflow"]
];

export function AdminOnboardClient() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completeEmail, setCompleteEmail] = useState("");
  const [botCategory, setBotCategory] = useState("BUSINESS_AI");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.botCategory = botCategory;
    payload.source = "super-admin-pilot";
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null) as { error?: string; email?: string } | null;
      if (!response.ok || !result?.email) throw new Error(result?.error || "Pilot workspace could not be created.");
      setCompleteEmail(result.email);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Pilot workspace could not be created."); }
    finally { setSaving(false); }
  }

  if (completeEmail) return <section className="mx-auto mt-8 max-w-3xl overflow-hidden border border-white/70 bg-white p-8 sm:p-12"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f7f1] text-[#178665]"><Icon name="sparkles" className="h-6 w-6" /></span><p className="product-eyebrow mt-7">Pilot workspace created</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">The owner activation is on its way.</h1><p className="mt-5 text-base leading-7 text-[#68645c]">AiFrogi sent the secure activation email to <strong className="text-[#101010]">{completeEmail}</strong>. The AI Bot track is ready for persona, knowledge and installation work after the owner verifies access.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/admin/customers" className="rounded-full bg-[#101010] px-6 py-3 text-sm font-bold text-white">Open customer queue</Link><button type="button" onClick={() => setCompleteEmail("")} className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold">Onboard another pilot</button></div></section>;

  return <form onSubmit={submit} className="grid gap-7 xl:grid-cols-[1.05fr_.95fr]">
    <section className="border border-white/70 bg-white p-6 sm:p-8">
      <p className="product-eyebrow">Step 1 · Choose intelligence</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Which bot will this client pilot?</h2><div className="mt-7 grid gap-3 sm:grid-cols-2">{bots.map(([value, name, copy]) => <button key={value} type="button" onClick={() => setBotCategory(value)} className={`rounded-[20px] border p-4 text-left transition ${botCategory === value ? "border-[#8a6a16] bg-[#101010] text-white shadow-[0_18px_45px_rgba(16,16,16,.18)]" : "border-black/7 bg-[#f7f4ed] hover:border-[#8a6a16]/40"}`}><strong className="block">{name}</strong><span className={`mt-1 block text-xs leading-5 ${botCategory === value ? "text-white/55" : "text-[#68645c]"}`}>{copy}</span></button>)}</div>
    </section>

    <section className="border border-white/70 bg-white p-6 sm:p-8">
      <p className="product-eyebrow">Step 2 · Create workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Add the pilot owner.</h2><p className="mt-3 text-sm leading-6 text-[#68645c]">This starts the AI Bot onboarding track. WhatsApp remains off unless deliberately enabled later.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="Company"><input name="companyName" className="product-input mt-2" required /></Field><Field label="Owner"><input name="ownerName" className="product-input mt-2" required /></Field><Field label="Work email" wide><input name="ownerEmail" type="email" className="product-input mt-2" required /></Field><Field label="Mobile"><input name="ownerMobile" type="tel" className="product-input mt-2" placeholder="+91" /></Field><Field label="Industry"><input name="industry" className="product-input mt-2" required /></Field><Field label="Website" wide><input name="website" className="product-input mt-2" placeholder="https://example.com" required /></Field><input type="hidden" name="country" value="India" /><input type="hidden" name="timezone" value="Asia/Kolkata" /><input name="fax" className="hidden" tabIndex={-1} aria-hidden="true" />{error ? <p role="alert" className="rounded-2xl bg-[#fff0f0] p-4 text-sm font-semibold text-[#a3342b] sm:col-span-2">{error}</p> : null}<button disabled={saving} className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#b28728] px-6 text-sm font-bold text-white shadow-[0_16px_36px_rgba(178,135,40,.22)] transition hover:bg-[#101010] disabled:opacity-55 sm:col-span-2">{saving ? "Creating pilot..." : "Create pilot and send activation"}<Icon name="arrow-right" /></button></div>
    </section>
  </form>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="field-label">{label}</span>{children}</label>; }
