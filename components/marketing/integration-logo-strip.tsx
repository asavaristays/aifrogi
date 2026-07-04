import Link from "next/link";
import { Icon } from "@/components/icons";
import { IntegrationLogo } from "@/components/marketing/integration-logo";

const integrations = [
  { name: "Shopify", src: "/integrations/shopify.svg", status: "Available" },
  { name: "Razorpay", src: "/integrations/razorpay.svg", status: "Available" },
  { name: "WooCommerce", src: "/integrations/woocommerce.svg", status: "Custom" },
  { name: "Zoho CRM", src: "/integrations/zoho.svg", status: "Custom" },
  { name: "HubSpot", src: "/integrations/hubspot.svg", status: "Custom" },
  { name: "Google Sheets", src: "/integrations/google-sheets.svg", status: "Custom" }
];

export function IntegrationLogoStrip() {
  return (
    <section aria-labelledby="homepage-integrations-title" className="border-y border-black/8 bg-white px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-sm shrink-0">
            <p className="product-eyebrow">Connected operations</p>
            <h2 id="homepage-integrations-title" className="mt-2 text-xl font-semibold tracking-[-.02em]">Works with the tools that run your business.</h2>
          </div>

          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex min-w-max items-center gap-7 lg:min-w-0 lg:gap-8">
              {integrations.map((integration) => (
                <div key={integration.name} className="group flex items-center gap-2.5" title={`${integration.name} — ${integration.status}`}>
                  <IntegrationLogo src={integration.src} name={integration.name} size="sm" />
                  <span>
                    <strong className="block whitespace-nowrap text-xs font-bold text-[#40364b]">{integration.name}</strong>
                    <small className={`block text-[10px] font-semibold ${integration.status === "Available" ? "text-[#178665]" : "text-[#8a8290]"}`}>{integration.status}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/integration" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-[#a21c98] transition hover:text-[#d92bcb]">
            Explore integrations <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
