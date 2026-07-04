import Link from "next/link";
import { Icon } from "@/components/icons";
import { IntegrationLogo } from "@/components/marketing/integration-logo";

const integrations = [
  { name: "Shopify", src: "/integrations/shopify.svg", status: "Ready" },
  { name: "Razorpay", src: "/integrations/razorpay.svg", status: "Ready" },
  { name: "WooCommerce", src: "/integrations/woocommerce.svg", status: "Assisted" },
  { name: "Zoho CRM", src: "/integrations/zoho.svg", status: "Assisted" },
  { name: "HubSpot", src: "/integrations/hubspot.svg", status: "Assisted" },
  { name: "Google Sheets", src: "/integrations/google-sheets.svg", status: "Assisted" }
];

export function IntegrationLogoStrip() {
  return (
    <section aria-labelledby="homepage-integrations-title" className="mt-12 border-y border-white/10 py-7 text-left text-white">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-xs shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#ff8af1]">Connected operations</p>
            <h2 id="homepage-integrations-title" className="mt-2 text-lg font-semibold tracking-[-.02em]">Works with the tools that run your business.</h2>
          </div>

          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 xl:overflow-visible">
            <div className="flex min-w-max items-center gap-7 xl:min-w-0 xl:gap-8">
              {integrations.map((integration) => (
                <div key={integration.name} className="group flex items-center gap-2.5" title={`${integration.name} — ${integration.status}`}>
                  <IntegrationLogo src={integration.src} name={integration.name} size="sm" />
                  <span>
                    <strong className="block whitespace-nowrap text-xs font-bold text-white/82">{integration.name}</strong>
                    <small className={`block text-[10px] font-semibold ${integration.status === "Ready" ? "text-[#6fe0b8]" : "text-white/45"}`}>{integration.status}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/integration" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-[#ff8af1] transition hover:text-white">
            Explore integrations <Icon name="arrow-right" />
          </Link>
      </div>
    </section>
  );
}
