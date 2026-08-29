import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { IntegrationLogoStrip } from "@/components/marketing/integration-logo-strip";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { SovereignHero } from "@/components/marketing/sovereign-hero";
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
        <div className="relative mx-auto max-w-7xl">
          <SovereignHero registerUrl={registerUrl} />

          <IntegrationLogoStrip />

          <FeatureShowcase />
        </div>
      </section>

      <section id="about-aifrogi" className="relative overflow-hidden bg-black px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="absolute left-[8%] top-1/3 h-72 w-72 rounded-full bg-[var(--gold-600)]/12 blur-[110px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 border-y border-white/14 py-12 lg:grid-cols-[.72fr_1.45fr_.83fr] lg:gap-14 lg:py-16">
          <div>
            <p className="product-eyebrow text-[var(--gold-300)]">About AiFrogi</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-5xl">Business intelligence that stays under your control.</h2>
            <Link href="/about" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold-300)]">Our company and vision <Icon name="arrow-right" className="transition-transform group-hover:translate-x-1" /></Link>
          </div>

          <div className="border-white/14 lg:border-x lg:px-12">
            <p className="text-xl font-medium leading-8 tracking-[-.02em] text-white sm:text-2xl sm:leading-9">AiFrogi is the AI Business Automation vertical of Webtechnosys, created to help businesses manage customer conversations with greater speed, intelligence and control.</p>
            <p className="mt-7 text-base leading-8 text-white/64">Our portfolio brings together two focused solutions—intelligent AI Bots and WhatsApp API automation. Each bot is trained on the business’s approved knowledge, aligned with its customer journey and connected to the required channels and systems. It can answer enquiries, qualify opportunities, support business actions and involve the human team whenever judgment is required.</p>
            <p className="mt-7 text-lg font-medium leading-8 text-[var(--gold-100)]">With built-in security controls, approved access and responsible human handover, AiFrogi keeps business intelligence and customer data under the organisation’s control.</p>
          </div>

          <div className="flex flex-col justify-between gap-10">
            <div className="border-t border-white/14 pt-5"><span className="font-mono text-xs text-[var(--gold-300)]">01</span><h3 className="mt-3 text-xl font-semibold">Intelligent AI Bots</h3><p className="mt-2 text-sm leading-6 text-white/48">Knowledge-led automation designed around the business outcome.</p></div>
            <div className="border-t border-white/14 pt-5"><span className="font-mono text-xs text-[var(--gold-300)]">02</span><h3 className="mt-3 text-xl font-semibold">WhatsApp API</h3><p className="mt-2 text-sm leading-6 text-white/48">A governed customer channel connected to the same business intelligence.</p></div>
            <div className="border-t border-white/14 pt-5"><span className="font-mono text-xs text-[var(--gold-300)]">03</span><h3 className="mt-3 text-xl font-semibold">Sovereign by design</h3><p className="mt-2 text-sm leading-6 text-white/48">Approved knowledge, controlled access and accountable human authority.</p></div>
          </div>
        </div>
      </section>

      <section id="security" className="relative overflow-hidden bg-[var(--ink-950)] px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[var(--gold-600)]/18 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Trust by design</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl">Security controls customers can understand and verify.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">AiFrogi protects business workspaces with customer-approved support access, privileged login OTP, signed connector webhooks, encrypted credentials, and repeatable boundary tests for covered routes.</p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              {[["Connector webhook", "Signed traffic only"], ["Admin login", "Password + email OTP"], ["Boundary tests", "Verified refusal paths"]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/12 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/38">{label}</p><p className="mt-2 text-sm font-bold text-white">{value}</p></div>)}
            </div>
            <Link href="/security" className="group mt-8 inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#8a6a16] px-6 text-sm font-bold text-white shadow-[0_0_38px_rgba(138,106,22,.3)] transition hover:-translate-y-0.5 hover:bg-[#b28728]">Review Data Security <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/45"><Link href="/help/protect-whatsapp-customer-data" className="transition hover:text-white">Plain-English security guide</Link><Link href="/about" className="transition hover:text-white">About webtechnosys</Link><Link href="/privacy-policy" className="transition hover:text-white">Privacy policy</Link><Link href="/data-deletion" className="transition hover:text-white">Data deletion</Link><a href="mailto:info@aifrogi.com" className="transition hover:text-white">Report a concern</a></div>
          </div>
          <div className="border-y border-white/12">
            <SecurityControl icon="settings" title="Customer-approved support access" copy="Super admin cannot freely read private customer content. Owners/admins grant time-bound support access by scope." />
            <SecurityControl icon="phone" title="Privileged login OTP" copy="Platform admin and workspace owner/admin sign-in requires password plus email OTP before a session is created." />
            <SecurityControl icon="link" title="Signed connector webhooks" copy="Supported connector traffic is verified before processing. Unsigned or forged webhook requests are rejected." />
            <SecurityControl icon="grid" title="Verified workspace boundaries" copy="Temporary fixture tests confirm covered routes reject cross-workspace slugs and role-bypassing mutation attempts." />
            <SecurityControl icon="sparkles" title="AI stays controlled" copy="Approved knowledge, role-based access, confidence fallback, and human handover keep automation bounded." />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SecurityControl({ icon, title, copy }: { icon: "settings" | "grid" | "sparkles" | "phone" | "link"; title: string; copy: string }) { return <div className="grid gap-4 border-b border-white/12 py-6 last:border-b-0 sm:grid-cols-[48px_1fr] sm:items-start"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-[#e2c66d]"><Icon name={icon} className="h-5 w-5" /></span><div><h3 className="text-base font-bold">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{copy}</p></div></div>; }
