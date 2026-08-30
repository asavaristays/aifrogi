import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { InboxOperationsVisual } from "@/components/marketing/inbox-operations-visual";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";
import { botProducts } from "@/lib/bot-products";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Automation Solutions | AiFrogi",
  description: "Explore sovereign AI Business Bots designed around approved knowledge, clear operating authority, measurable outcomes, human handover, and optional customer channels.",
  path: "/solutions"
});

export default function SolutionsPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />
      <section className="bg-[#101010] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="product-eyebrow text-[#e2c66d]">Solutions</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">One sovereign intelligence. Designed for your business outcome.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/64">Each AI Business Bot learns from approved first-party knowledge, operates within defined authority and keeps your team in control of every meaningful action.</p>
          </div>
          <InboxOperationsVisual />
        </div>
      </section>

      <section className="border-b border-black/8 bg-[var(--warm-25)] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="product-eyebrow">Sovereign bot categories</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.035em] sm:text-5xl">Dedicated intelligence for every business job.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">Each bot has its own outcome, approved knowledge and operating authority. Website and WhatsApp remain channels—not separate intelligence.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ...botProducts,
              { slug: "clinicgpt", name: "ClinicGPT", category: "Appointments", headline: "Verified appointment confirmation and follow-up." },
              { slug: "flowcart", name: "FlowCart", category: "Commerce", headline: "Product discovery, orders, payment links and updates." }
            ].map((product) => (
              <Link key={product.slug} href={`/solutions/${product.slug}`} className="group flex min-h-56 flex-col rounded-lg border border-black/8 bg-white p-6 transition hover:-translate-y-1 hover:border-[var(--gold-500)]/45 hover:shadow-[0_20px_55px_rgba(16,16,16,.1)]">
                <p className="product-eyebrow">{product.category}</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-.025em]">{product.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{product.headline}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[var(--gold-600)]">View dedicated page <Icon name="arrow-right" className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
