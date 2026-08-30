import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { OnboardingJourney } from "@/components/marketing/onboarding-journey";
import { ClinicGPTPricingSection } from "@/components/marketing/clinicgpt-pricing-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsAppCostCalculator } from "@/components/marketing/whatsapp-cost-calculator";
import { WhatsAppProductsShell } from "@/components/marketing/whatsapp-products-shell";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "WhatsApp Business API, Meta Onboarding and Automation | AiFrogi",
  description: "Connect WhatsApp Business API to AiFrogi with guided Meta onboarding, governed automation, transparent message-cost planning, signed webhooks, and human operations.",
  path: "/whatsapp-api"
});

export default function WhatsAppApiPage() {
  return (
    <main className="bg-white text-[var(--ink-900)]">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[var(--ink-950)] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:72px_72px]" aria-hidden="true" />
        <div className="absolute right-[10%] top-[10%] h-96 w-96 rounded-full bg-[var(--gold-600)]/20 blur-[110px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="product-eyebrow text-[var(--gold-300)]">WhatsApp Business Platform</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-7xl">Connect your AI Bot to WhatsApp API.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">WhatsApp is an optional customer channel. AiFrogi guides Meta access, secures the connection and routes conversations through the same business-owned intelligence and human operations inbox.</p>
            <a href="https://app.aifrogi.com/register?source=whatsapp-api" className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-[var(--ink-600)]">Start WhatsApp API setup <Icon name="arrow-right" /></a>
          </div>
          <div className="border-y border-white/14">
            {["Meta business and number approval", "Signed webhook connection", "Template and delivery monitoring", "AI response with human takeover"].map((item, index) => <div key={item} className="grid grid-cols-[44px_1fr] border-b border-white/14 py-5 last:border-b-0"><span className="font-mono text-xs text-[var(--gold-300)]">0{index + 1}</span><span className="text-lg font-medium">{item}</span></div>)}
          </div>
        </div>
      </section>
      <div id="onboarding"><OnboardingJourney /></div>
      <WhatsAppProductsShell eyebrow="AI Bot workflows on WhatsApp" />
      <WhatsAppCostCalculator />
      <ClinicGPTPricingSection />
      <section className="bg-[var(--ink-950)] px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="product-eyebrow text-[var(--gold-300)]">Meta connection controls</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.04em]">Operational evidence, not vague trust claims.</h2></div>
          <div className="border-t border-white/14">{[
            ["Access", "Customer approves Meta permissions; passwords are never requested."],
            ["Webhooks", "Meta webhook traffic is signature-verified before processing."],
            ["Workspace", "Every connection is routed to its owning tenant and bot profile."],
            ["Fallback", "Human takeover and legacy fallback remain available when automation cannot act safely."]
          ].map(([title, copy]) => <div key={title} className="grid gap-2 border-b border-white/14 py-6 sm:grid-cols-[130px_1fr]"><strong className="text-[var(--gold-300)]">{title}</strong><p className="leading-7 text-white/62">{copy}</p></div>)}</div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
