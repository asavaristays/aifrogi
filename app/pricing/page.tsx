import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsAppCostCalculator } from "@/components/marketing/whatsapp-cost-calculator";

export default function PricingPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="product-eyebrow">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">Platform fee and Meta usage stay separate.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#70697d]">Use the calculator first. Plans and commercial packaging can be refined as you narrate the final pricing story.</p>
        </div>
      </section>
      <WhatsAppCostCalculator />
      <SiteFooter />
    </main>
  );
}
