import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function IntegrationPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="product-eyebrow">Integration</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">Official WhatsApp API, connected to your operations.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#70697d]">We will build this page around Meta setup, webhooks, billing readiness, CRM/e-commerce links, and operational handoff as you narrate the final content.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
