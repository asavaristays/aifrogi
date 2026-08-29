import { Icon } from "@/components/icons";

const options = [
  {
    name: "Standard connector",
    price: "₹2,500",
    billing: "one-time / connector",
    copy: "Shopify, Razorpay, or Google Sheets activation, field mapping, webhook validation, and go-live testing."
  },
  {
    name: "Assisted connector",
    price: "₹7,500",
    billing: "one-time / connector",
    copy: "WooCommerce, Zoho CRM, HubSpot, booking tools, or similar supported APIs configured with agreed fields and tests.",
    featured: true
  },
  {
    name: "Custom API connector",
    price: "From ₹15,000",
    billing: "one-time after scope review",
    copy: "Internal software, complex multi-step operations, private APIs, or systems that need custom middleware."
  }
];

export function IntegrationPricing() {
  return (
    <section id="integration-pricing" className="border-y border-black/8 bg-white px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="product-eyebrow">Integration pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Know the connection cost before setup.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--text-muted)]">Integration work is separate from the AiFrogi subscription and any fee charged by the connected provider.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {options.map((option) => <article key={option.name} className={`border-t-2 pt-6 ${option.featured ? "border-[#8a6a16]" : "border-black/12"}`}><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{option.name}</h3>{option.featured ? <span className="rounded-full bg-[#f8f0d8] px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#6d5310]">Best value</span> : null}</div><p className="mt-6 text-3xl font-semibold tracking-[-.04em]">{option.price}</p><p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">{option.billing}</p><p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">{option.copy}</p></article>)}
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-black/10 pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <div className="grid gap-2 text-[var(--text-muted)] sm:grid-cols-2 sm:gap-8"><p><strong className="text-[#101010]">Optional maintenance:</strong> from ₹1,500/month.</p><p><strong className="text-[#101010]">UAE projects:</strong> quoted and invoiced in AED.</p></div>
          <a href="mailto:info@aifrogi.com?subject=Integration%20cost%20estimate" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-[#6d5310]">Request cost estimate <Icon name="arrow-right" /></a>
        </div>
      </div>
    </section>
  );
}
