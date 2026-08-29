import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { IntegrationCatalog } from "@/components/marketing/integration-catalog";
import { IntegrationLogo } from "@/components/marketing/integration-logo";
import { IntegrationPricing } from "@/components/marketing/integration-pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Integrations | AiFrogi",
  description: "Connect AiFrogi with Shopify, WooCommerce, Razorpay, Stripe, HubSpot, Zoho, Google Sheets, calendars, WhatsApp, and your business systems.",
  path: "/integration"
});

const heroIntegrations = [
  { name: "Shopify", src: "/integrations/shopify.svg" },
  { name: "Razorpay", src: "/integrations/razorpay.svg" },
  { name: "WooCommerce", src: "/integrations/woocommerce.svg" },
  { name: "Zoho CRM", src: "/integrations/zoho.svg" },
  { name: "HubSpot", src: "/integrations/hubspot.svg" },
  { name: "Google Sheets", src: "/integrations/google-sheets.svg" }
];

export default function IntegrationPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[#101010] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#8a6a16]/15 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_.82fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Integration</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">WhatsApp connected to the tools that complete the job.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">Recover purchases, collect payments, update orders, and sync leads through official APIs and verified webhooks.</p>
            <a href="#catalog" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#8a6a16] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#b28728]">Explore integrations <Icon name="arrow-right" /></a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.055] p-5 backdrop-blur sm:p-7">
            <p className="text-center text-xs font-bold uppercase tracking-[.14em] text-white/45">Your business stack</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {heroIntegrations.map((integration) => <div key={integration.name} className="group flex min-h-24 flex-col items-center justify-center rounded-xl border border-white/10 bg-white p-3 text-center"><IntegrationLogo src={integration.src} name={integration.name} /><strong className="mt-2 text-xs text-[#40364b]">{integration.name}</strong></div>)}
            </div>
            <div className="mt-5 flex items-center justify-center gap-3 text-xs font-semibold text-white/50"><span>Business event</span><Icon name="arrow-right" className="text-[#e2c66d]" /><strong className="text-white">AiFrogi</strong><Icon name="arrow-right" className="text-[#e2c66d]" /><span>Customer action</span></div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="product-eyebrow">One connected journey</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-.03em] sm:text-4xl">From business event to the right WhatsApp action.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <JourneyStep number="01" title="Connect" copy="Approve access through the provider’s secure connection flow." />
            <JourneyStep number="02" title="Choose events" copy="Select the order, payment, lead, or booking changes that matter." />
            <JourneyStep number="03" title="Set the action" copy="Map each event to an approved message, workflow, or human task." />
            <JourneyStep number="04" title="Monitor" copy="See connection health, delivery status, and operational outcomes." />
          </div>
        </div>
      </section>

      <IntegrationCatalog />

      <IntegrationPricing />

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div><p className="product-eyebrow">Trust at every connection</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Know what connects before it goes live.</h2><p className="mt-4 max-w-xl leading-7 text-[var(--text-muted)]">Every integration documents its permissions, shared fields, subscribed events, and disconnect process.</p></div>
          <div className="grid gap-5 sm:grid-cols-2"><TrustPoint title="Official access" copy="OAuth, official APIs, and signed webhooks—never shared account passwords." /><TrustPoint title="Minimum permissions" copy="Only the scopes and fields required for the approved workflow." /><TrustPoint title="Verified events" copy="Signatures are checked before an external event can trigger an action." /><TrustPoint title="Visible control" copy="Test first, monitor health, review failures, and disconnect access." /></div>
        </div>
        <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-5 rounded-xl bg-[#101010] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><h2 className="text-2xl font-semibold">Need another business system?</h2><p className="mt-2 text-sm text-white/55">Tell us the event, data, and customer action you want to connect.</p></div><a href="mailto:info@aifrogi.com?subject=Integration%20request" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#8a6a16] px-5 text-sm font-bold">Request an integration <Icon name="arrow-right" /></a></div>
        <p className="mx-auto mt-5 max-w-7xl text-center text-[11px] leading-5 text-[var(--text-muted)]">Third-party names and logos belong to their respective owners. Integration availability does not imply endorsement or partnership.</p>
      </section>

      <SiteFooter />
    </main>
  );
}

function JourneyStep({ number, title, copy }: { number: string; title: string; copy: string }) { return <div className="border-t border-black/10 pt-5"><span className="text-xs font-bold text-[#8a6a16]">{number}</span><h3 className="mt-3 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div>; }
function TrustPoint({ title, copy }: { title: string; copy: string }) { return <div className="border-t border-black/10 pt-4"><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div>; }
