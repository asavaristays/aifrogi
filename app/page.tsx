import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { IntegrationLogoStrip } from "@/components/marketing/integration-logo-strip";
import { OnboardingJourney } from "@/components/marketing/onboarding-journey";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsAppProductsShell } from "@/components/marketing/whatsapp-products-shell";
import { marketingMetadata } from "@/lib/seo";

const registerUrl = "https://app.aifrogi.com/register?source=homepage";

export const metadata: Metadata = marketingMetadata({
  title: "Intelligent AI Bot for Business | AiFrogi",
  description: "Give your business an intelligent AI bot that answers customers, drives follow-ups, automates workflows, and keeps your team in control. WhatsApp is one supported channel.",
  path: "/"
});

metadata.other = {
  "aifrogi-homepage-release": "2026-07-07-flowcart"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-[var(--ink-900)]" data-aifrogi-homepage-release="2026-07-07-flowcart">
      <span hidden>AiFrogi homepage canary 2026-07-07 flowcart</span>
      <SiteHeader />

      <section className="relative overflow-hidden bg-[var(--ink-950)] px-5 pb-0 pt-14 text-white sm:px-8 sm:pt-24">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[var(--gold-600)]/18 blur-[130px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl text-center">
          <a href="/security#meta-verification" className="group mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-[#ff8af1]/45 hover:bg-white/8 hover:text-white"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#178665] text-[10px] font-bold text-white">✓</span>Meta access verified for webtechnosys <span className="text-[#ff8af1] transition-transform group-hover:translate-x-0.5">→</span></a>
          <h1 className="mx-auto mt-7 max-w-5xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Give your business an intelligent AI bot that turns conversations into action.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">AI answers, follow-ups, workflows, payments, forms, reviews, and human handover in one controlled workspace. WhatsApp is one supported channel.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-white shadow-[0_12px_34px_rgba(138,106,22,.24)] transition hover:-translate-y-0.5 hover:bg-[var(--gold-500)] hover:text-[var(--ink-900)]">Start 30-day trial <Icon name="arrow-right" /></a></div>

          <IntegrationLogoStrip />

          <FeatureShowcase />
        </div>
      </section>

      <WhatsAppProductsShell />

      <OnboardingJourney />

      <section className="border-b border-black/8 bg-[#fbf8fc] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl"><p className="product-eyebrow">Security and compliance transparency</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Trust claims limited to controls we can prove.</h2><p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">AiFrogi publishes active safeguards, customer responsibilities, and certification status in plain language. We do not claim SOC 2 or ISO certification until an independent programme is completed.</p></div>
            <Link href="/security#compliance-status" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-[#2c243b] px-5 text-sm font-bold text-white">Review compliance status <Icon name="arrow-right" /></Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Workspace isolation", "Active"],
              ["Encrypted credentials", "Active"],
              ["Signed Meta webhooks", "Active"],
              ["Controlled support access", "Active"],
              ["SOC 2 / ISO", "Not yet claimed"]
            ].map(([control, status]) => <div key={control} className="rounded-lg border border-black/8 bg-white p-4"><p className="text-xs font-bold">{control}</p><p className={`mt-2 text-[10px] font-bold uppercase tracking-[.1em] ${status === "Active" ? "text-[#178665]" : "text-[#9a6719]"}`}>{status}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="product-eyebrow">Verified trust signals</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Verify the operator, the Meta status, and the security boundaries.</h2>
          </div>
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProofLink title="Meta access verification" copy="webtechnosys access evidence and platform responsibility notes." href="/security#meta-verification" icon="settings" />
            <ProofLink title="Company details" copy="AiFrogi is operated by webtechnosys from Goa, India." href="/about" icon="file-text" />
            <ProofLink title="Service status" copy="Public status page for platform availability and incidents." href="/status" icon="bar-chart-3" />
            <ProofLink title="Verified controls" copy="Support access, OTP, signed webhooks, and boundary tests." href="/security" icon="grid" />
          </div>
        </div>
      </section>

      <section id="security" className="relative overflow-hidden bg-[var(--ink-950)] px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[var(--gold-600)]/18 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff8af1]">Trust by design</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl">Security controls customers can understand and verify.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">AiFrogi protects WhatsApp workspaces with customer-approved support access, privileged login OTP, signed Meta webhooks, encrypted credentials, and repeatable boundary tests for covered routes.</p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["Meta webhook", "Signed traffic only"],
                ["Admin login", "Password + email OTP"],
                ["Boundary tests", "Verified refusal paths"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/12 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/38">{label}</p>
                  <p className="mt-2 text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
            <a href="/security" className="group mt-8 inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#d92bcb] px-6 text-sm font-bold text-white shadow-[0_0_38px_rgba(217,43,203,.3)] transition hover:-translate-y-0.5 hover:bg-[#e33bd4]">
              Review Data Security
              <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/45">
              <Link href="/help/protect-whatsapp-customer-data" className="transition hover:text-white">Plain-English security guide</Link>
              <a href="/about" className="transition hover:text-white">About webtechnosys</a>
              <a href="/privacy-policy" className="transition hover:text-white">Privacy policy</a>
              <a href="/data-deletion" className="transition hover:text-white">Data deletion</a>
              <a href="mailto:info@aifrogi.com" className="transition hover:text-white">Report a concern</a>
            </div>
          </div>

          <div className="border-y border-white/12">
            <SecurityControl icon="settings" title="Customer-approved support access" copy="Super admin cannot freely read private customer content. Owners/admins grant time-bound support access by scope." />
            <SecurityControl icon="phone" title="Privileged login OTP" copy="Platform admin and workspace owner/admin sign-in requires password plus email OTP before a session is created." />
            <SecurityControl icon="link" title="Signed Meta webhooks" copy="Meta webhook traffic is verified with the app secret. Unsigned or forged webhook requests are rejected." />
            <SecurityControl icon="grid" title="Verified workspace boundaries" copy="Temporary fixture tests confirm covered routes reject cross-workspace slugs and role-bypassing mutation attempts." />
            <SecurityControl icon="sparkles" title="AI stays controlled" copy="Approved knowledge, role-based access, confidence fallback, and human handover keep automation bounded." />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function ProofLink({ title, copy, href, icon }: { title: string; copy: string; href: string; icon: "settings" | "file-text" | "bar-chart-3" | "grid" }) { return <a href={href} className="group border-t border-black/10 pt-5"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fceafb] text-[#b923ae]"><Icon name={icon} /></span><h3 className="mt-5 flex items-center justify-between gap-3 text-lg font-bold">{title}<Icon name="arrow-right" className="text-[#d92bcb] transition-transform group-hover:translate-x-1" /></h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></a>; }
function SecurityControl({ icon, title, copy }: { icon: "settings" | "grid" | "sparkles" | "phone" | "link"; title: string; copy: string }) { return <div className="grid gap-4 border-b border-white/12 py-6 last:border-b-0 sm:grid-cols-[48px_1fr] sm:items-start"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-[#ff8af1]"><Icon name={icon} className="h-5 w-5" /></span><div><h3 className="text-base font-bold">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{copy}</p></div></div>; }
