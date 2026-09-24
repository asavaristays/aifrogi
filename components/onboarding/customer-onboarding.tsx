"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { BotConnectorView } from "@/components/bot-profile/bot-connector-plan";
import { LogoutButton } from "@/components/layout/logout-button";
import { OnboardingWorkbookImport } from "@/components/onboarding/onboarding-workbook-import";
import { BotReviewSubmission } from "@/components/setup/bot-review-submission";
import { Button } from "@/components/ui/button";

type BotProfile = {
  category: string; operatingMode: string; channels: string[]; capabilities: string[];
  humanHandoffEnabled: boolean; actionApprovalNeeded: boolean; personaName?: string | null;
  businessObjective?: string | null; tone?: string | null; languages?: string[];
  prohibitedClaims?: string[]; escalationTriggers?: string[]; responseSlaMinutes?: number;
  reminderPercent?: number; fallbackEnabled?: boolean; safeFallbackMessage?: string | null;
  status?: string; installationKey?: string | null; installationDetectedAt?: string | Date | null;
  liveAt?: string | Date | null;
};

export type CustomerOnboardingOrganization = {
  id: string; name: string; industry: string | null; website: string | null; country: string;
  timezone: string; businessAddress: string | null; ownerName: string; ownerEmail: string;
  ownerMobile: string | null; publicPhone: string | null; publicEmail: string | null;
  publicAddress: string | null; publicBusinessHours: string | null; botProfile: BotProfile | null;
  botConnectors: BotConnectorView[]; properties: Array<{ id: string; name: string; slug: string }>;
};

export function CustomerOnboarding({ initialOrganization, accountEmail, reviewReadiness }: {
  initialOrganization: CustomerOnboardingOrganization | null; accountEmail: string;
  reviewReadiness?: { knowledgeReady: boolean; tested: boolean; certified: boolean; canManage: boolean; evidence?: { pageCount: number; published: number; coveragePercent: number; freshnessRate: number; conflicts: number; unsigned: number; openFlags: number; previewPending: number; missingEssentials: string[] } };
}) {
  const router = useRouter();
  const [organization, setOrganization] = useState(initialOrganization);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initialOrganization?.name || "", industry: initialOrganization?.industry || "",
    website: initialOrganization?.website || "", country: initialOrganization?.country || "India",
    timezone: initialOrganization?.timezone || "Asia/Kolkata", businessAddress: initialOrganization?.businessAddress || "",
    ownerName: initialOrganization?.ownerName || "", ownerMobile: initialOrganization?.ownerMobile || "",
    publicPhone: initialOrganization?.publicPhone || "", publicEmail: initialOrganization?.publicEmail || "",
    publicAddress: initialOrganization?.publicAddress || "", publicBusinessHours: initialOrganization?.publicBusinessHours || ""
  });

  const status = organization?.botProfile?.status || "DRAFT";
  const submittedOrLive = ["REVIEW_PENDING", "LIVE", "PAUSED"].includes(status);
  const knowledgeConfirmed = Boolean(reviewReadiness?.knowledgeReady);
  const checks = [Boolean(organization), knowledgeConfirmed, submittedOrLive];
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const [step, setStep] = useState(submittedOrLive ? 4 : knowledgeConfirmed ? 3 : 1);

  async function saveBusiness() {
    setSaving(true); setError(null); setNotice(null);
    const response = await fetch("/api/onboarding", {
      method: organization ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(organization ? { step: 1 } : {}), ...form })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) { setError(payload?.error || "We could not save your business details. Please try again."); return false; }
    setOrganization(payload.organization);
    setNotice("Business details saved. Continue with intelligence and bot setup below.");
    router.refresh();
    return true;
  }

  return <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
    <header className="border-b border-black bg-[var(--ink-950)] px-5 py-4 text-white sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <Image src="/brand/aifrogi-logo-white.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[158px] grayscale contrast-125" />
      <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-bold text-white/55">Signed in as</p><p className="mt-1 text-sm font-semibold">{accountEmail}</p></div><LogoutButton variant="sidebar" className="min-h-9 w-auto rounded-md border border-white/14 px-3 text-xs" /></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="product-eyebrow">Simple AI Bot onboarding</p><h1 className="mt-2 text-3xl font-black">Share and confirm your business information.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">You provide the business details and approved answers. AiFrogi completes testing, certification and activation after submission.</p></div><strong className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm text-[var(--primary-strong)]">{progress}% ready</strong></div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full bg-[var(--gold-600)]" style={{ width: `${progress}%` }} /></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{["Business details", "Upload and confirm", "Submit to AiFrogi"].map((label, index) => <div key={label} className="rounded-md border border-black/7 bg-[#fbfcfb] p-4"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${checks[index] ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>{checks[index] ? "✓" : index + 1}</span><strong className="mt-3 block text-sm">{label}</strong></div>)}</div>
      </section>
      {step === 1 ? <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
        <p className="product-eyebrow">Step 1 · business basics</p><h2 className="mt-2 text-2xl font-black">Information your bot may use</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Only add public business information that customers may safely receive.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Business name" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} /><Field label="Industry" value={form.industry} onChange={(value) => setForm({ ...form, industry: value })} />
          <Field label="Website (optional)" value={form.website} placeholder="https://yourbusiness.com" onChange={(value) => setForm({ ...form, website: value })} /><Field label="Owner name" value={form.ownerName} required onChange={(value) => setForm({ ...form, ownerName: value })} />
          <Field label="Owner mobile" value={form.ownerMobile} onChange={(value) => setForm({ ...form, ownerMobile: value })} /><Field label="Public customer phone" value={form.publicPhone} onChange={(value) => setForm({ ...form, publicPhone: value })} />
          <Field label="Public customer email" value={form.publicEmail} onChange={(value) => setForm({ ...form, publicEmail: value })} /><Field label="Business hours" value={form.publicBusinessHours} onChange={(value) => setForm({ ...form, publicBusinessHours: value })} />
          <Field label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} /><Field label="Timezone" value={form.timezone} onChange={(value) => setForm({ ...form, timezone: value })} />
          <div className="md:col-span-2"><Field label="Public address" value={form.publicAddress || form.businessAddress} onChange={(value) => setForm({ ...form, publicAddress: value, businessAddress: value })} /></div>
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}{notice ? <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}
        <Button className="mt-5" disabled={saving || !form.name || !form.ownerName} onClick={async () => { if (await saveBusiness()) setStep(2); }}>{saving ? "Saving" : "Save and continue"}</Button>
      </section> : null}
      {step === 2 ? <div><OnboardingWorkbookImport hotelTemplate={organization?.botProfile?.category === "STAY"} onImported={() => window.location.reload()} /><button type="button" className="mt-4 text-sm font-semibold text-[var(--primary-strong)]" onClick={() => setStep(1)}>← Back to business details</button></div> : null}
      {step >= 3 && organization?.botProfile ? <BotReviewSubmission intakeOnly status={status} ready={reviewReadiness?.knowledgeReady ?? false} tested={false} certified={false} canManage={reviewReadiness?.canManage ?? false} evidence={reviewReadiness?.evidence} /> : null}
    </main>
  </div>;
}

function Field({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold">{label}{required ? " *" : ""}<input className="mt-2 min-h-11 w-full rounded-md border border-black/10 bg-white px-3 font-normal outline-none focus:border-[var(--gold-600)]" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}
