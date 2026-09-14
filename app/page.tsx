import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { IntegrationLogoStrip } from "@/components/marketing/integration-logo-strip";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { SovereignHero } from "@/components/marketing/sovereign-hero";
import { marketingMetadata } from "@/lib/seo";
import { PRODUCT_RELEASE } from "@/lib/product-release";

const registerUrl = "https://app.aifrogi.com/register?source=homepage";

export const metadata: Metadata = marketingMetadata({
  title: "Intelligent AI Bot for Business | AiFrogi",
  description: "Give your business an intelligent AI bot that answers customers, drives follow-ups, automates workflows, and keeps your team in control.",
  path: "/"
});

metadata.other = {
  "aifrogi-homepage-release": PRODUCT_RELEASE.version
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-[var(--ink-900)]" data-aifrogi-homepage-release={PRODUCT_RELEASE.version}>
      <span hidden>AiFrogi homepage canary {PRODUCT_RELEASE.version}</span>
      <SiteHeader />

      <section className="relative overflow-hidden bg-black px-5 pb-0 pt-14 text-white sm:px-8 sm:pt-24">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[var(--gold-600)]/18 blur-[130px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <SovereignHero registerUrl={registerUrl} />

          <IntegrationLogoStrip />

          <FeatureShowcase />
        </div>
      </section>

      <section aria-labelledby="security-by-design" className="bg-[#f4f1e8] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="product-eyebrow text-[#8a6a16]">Security & control</p><h2 id="security-by-design" className="mt-4 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-5xl">Secure by design.<br />Governed for every business.</h2></div>
            <p className="max-w-2xl text-lg leading-8 text-black/62 lg:justify-self-end">Each business operates in its own controlled workspace. AiFrogi protects credentials, verifies sensitive actions and keeps accountable human authority in the loop.</p>
          </div>

          <div className="grid border-b border-black/15 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["01", "Tenant isolation", "Business data and connector access remain scoped to the correct workspace."],
              ["02", "Encrypted credentials", "API and connector secrets are encrypted, rotatable and never displayed after saving."],
              ["03", "Verified actions", "Payment and connected actions must pass provider and tenant checks before confirmation."],
              ["04", "Accountable access", "Role controls, audit records and emergency connector shutdown keep teams in control."],
              ["05", "Release safeguards", "Automated security and cross-tenant checks can block an unsafe production release."]
            ].map(([number, title, copy]) => <article key={number} className="border-t border-black/15 py-7 sm:px-6 sm:first:pl-0 lg:border-l lg:border-t-0 lg:first:border-l-0 lg:first:pl-0"><span className="font-mono text-xs text-[#8a6a16]">{number}</span><h3 className="mt-5 text-lg font-semibold tracking-[-.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-black/55">{copy}</p></article>)}
          </div>

          <div className="mt-8 flex flex-col gap-5 rounded-2xl bg-black px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between"><p className="max-w-3xl text-sm leading-6 text-white/65"><strong className="text-white">Safer payments.</strong> Payment details stay with the approved payment provider. AiFrogi verifies payment status and never asks customers to share card numbers, UPI PINs or OTPs in chat.</p><Link href="/security-compliance" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#e8cb7b]">Review security controls <Icon name="arrow-right" /></Link></div>
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
            <p className="mt-7 text-base leading-8 text-white/64">Our intelligent AI Bots are trained on the business’s approved knowledge, aligned with its customer journey and connected to the required systems. They can answer enquiries, qualify opportunities, support business actions and involve the human team whenever judgment is required.</p>
            <p className="mt-7 text-lg font-medium leading-8 text-[var(--gold-100)]">With built-in security controls, approved access and responsible human handover, AiFrogi keeps business intelligence and customer data under the organisation’s control.</p>
          </div>

          <div className="flex flex-col justify-between gap-10">
            <div className="border-t border-white/14 pt-5"><span className="font-mono text-xs text-[var(--gold-300)]">01</span><h3 className="mt-3 text-xl font-semibold">Intelligent AI Bots</h3><p className="mt-2 text-sm leading-6 text-white/48">Knowledge-led automation designed around the business outcome.</p></div>
            <div className="border-t border-white/14 pt-5"><span className="font-mono text-xs text-[var(--gold-300)]">02</span><h3 className="mt-3 text-xl font-semibold">Website delivery</h3><p className="mt-2 text-sm leading-6 text-white/48">A governed website assistant connected to approved business intelligence.</p></div>
            <div className="border-t border-white/14 pt-5"><span className="font-mono text-xs text-[var(--gold-300)]">03</span><h3 className="mt-3 text-xl font-semibold">Sovereign by design</h3><p className="mt-2 text-sm leading-6 text-white/48">Approved knowledge, controlled access and accountable human authority.</p></div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
