import type { Metadata } from "next";
import { IntegrationPricing } from "@/components/marketing/integration-pricing";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsAppCostCalculator } from "@/components/marketing/whatsapp-cost-calculator";
import { marketingMetadata } from "@/lib/seo";

const registerUrl = "https://app.aifrogi.com/register?source=pricing";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Pricing | AiFrogi",
  description: "Compare AiFrogi plans for intelligent customer conversations, workflow automation, AI knowledge, campaigns, and follow-ups. Start with a 30-day trial.",
  path: "/pricing"
});

const plans = [
  {
    name: "30-Day Trial",
    price: "₹0",
    billing: "30 days only · pauses automatically",
    bestFor: "Prove the WhatsApp workflow before choosing a paid plan.",
    cta: "Start 30-day trial",
    features: ["1 WhatsApp number", "2 users", "Shared team inbox", "Contacts and template sync", "Manual customer replies", "Basic support"]
  },
  {
    name: "Starter",
    price: "₹1,650",
    billing: "₹4,950 billed quarterly",
    bestFor: "Small teams starting campaigns and customer follow-up.",
    cta: "Start 30-day trial",
    features: ["Everything in Trial", "Basic broadcasts", "Campaign history", "Contact segmentation", "Basic performance analytics", "Guided onboarding support"]
  },
  {
    name: "Growth",
    price: "₹3,550",
    billing: "₹10,650 billed quarterly",
    bestFor: "Growing teams that need campaigns, automation, and conversion workflows.",
    cta: "Start 30-day trial",
    featured: true,
    features: ["Everything in Starter", "Multi-agent operations", "E-commerce retargeting", "Reminders and follow-ups", "Payment and form collection", "5 automation workflows", "Priority support"]
  },
  {
    name: "AI Operations",
    price: "₹5,500",
    billing: "₹16,500 billed quarterly",
    bestFor: "Teams ready for AI-led answers, qualification, and assisted automation.",
    cta: "Start 30-day trial",
    features: ["Everything in Growth", "AI chatbot", "Approved knowledge answers", "AI lead qualification", "Advanced workflow design", "Human handover controls", "Advanced analytics"]
  }
];

export default function PricingPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />
      <section className="bg-[#101010] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Clear pricing</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">Platform fee and Meta usage stay separate.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">Start with a 30-day trial. Choose a paid plan to continue after the trial; Meta template-message charges remain visible and separate.</p>
        </div>
      </section>

      <section id="plans" className="bg-[#fbfaf7] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="product-eyebrow">Choose your workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">A simple plan for every stage.</h2>
            <p className="mt-4 leading-7 text-[var(--text-muted)]">The trial is available for 30 days only. When it ends, messaging, campaigns, and automation pause automatically while your data remains preserved.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => <PricingPlan key={plan.name} {...plan} />)}
          </div>

          <div className="mt-12 grid gap-6 border-y border-black/10 py-8 text-sm leading-6 md:grid-cols-3">
            <p><strong className="block text-[#101010]">Meta charges</strong><span className="text-[var(--text-muted)]">Based on message category and the customer&apos;s country.</span></p>
            <p><strong className="block text-[#101010]">Always included</strong><span className="text-[var(--text-muted)]">Official API connection, secure access, and human handover.</span></p>
            <p><strong className="block text-[#101010]">Quoted separately</strong><span className="text-[var(--text-muted)]">Taxes, custom integrations, and unusually high AI usage.</span></p>
          </div>
        </div>
      </section>

      <IntegrationPricing />

      <WhatsAppCostCalculator />
      <SiteFooter />
    </main>
  );
}

function PricingPlan({ name, price, billing, bestFor, cta, features, featured }: (typeof plans)[number]) {
  return (
    <article className={`flex h-full flex-col rounded-xl border bg-white p-6 ${featured ? "border-[#8a6a16] shadow-[0_18px_50px_rgba(138,106,22,.12)]" : "border-black/8"}`}>
      <div className="flex min-h-7 items-start justify-between gap-3">
        <h3 className="text-xl font-bold">{name}</h3>
        {featured ? <span className="rounded-full bg-[#f8f0d8] px-3 py-1 text-[11px] font-bold text-[#6d5310]">Recommended</span> : null}
      </div>
      <p className="mt-4 min-h-18 text-sm leading-6 text-[var(--text-muted)]">{bestFor}</p>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">{price}<small className="ml-1 text-sm font-medium text-[var(--text-muted)]">/ month</small></p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{billing}</p>
      <ul className="mt-6 flex-1 space-y-3 border-t border-black/8 pt-6 text-sm">
        {features.map((feature) => <li key={feature} className="flex gap-2.5"><span className="font-bold text-[#8a6a16]" aria-hidden="true">✓</span><span>{feature}</span></li>)}
      </ul>
      <a href={registerUrl} className={`mt-7 inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold transition ${featured ? "bg-[#8a6a16] text-white hover:bg-[#8a6a16]" : "border border-black/12 text-[#101010] hover:border-[#8a6a16] hover:text-[#6d5310]"}`}>{cta}</a>
    </article>
  );
}
