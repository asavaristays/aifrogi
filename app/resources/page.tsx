import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { helpArticles } from "@/lib/help-center";
import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "WhatsApp Business Guides & Resources | AiFrogi",
  description: "Practical guides for WhatsApp onboarding, messaging, compliant campaigns, AI knowledge, account access, security, and customer support.",
  path: "/resources"
});

const trustResources = [
  { title: "Data security", copy: "How access, credentials, customer data, and AI boundaries are protected.", href: "/security" },
  { title: "Privacy policy", copy: "What information is collected, why it is used, and how it is protected.", href: "/privacy-policy" },
  { title: "Terms of service", copy: "Platform responsibilities, acceptable use, billing, and service boundaries.", href: "/terms-of-service" },
  { title: "Data deletion", copy: "How to request removal of customer or account information.", href: "/data-deletion" }
];

export default function ResourcesPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#2c243b] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#d92bcb]/15 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff8af1]">Resources</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl">Practical guides. Clear answers.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">Set up WhatsApp, run compliant campaigns, control AI, protect access, and resolve issues without unnecessary reading.</p>
          <a href="#guides" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#d92bcb] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#e33bd4]">Browse guides <Icon name="arrow-right" /></a>
        </div>
      </section>

      <section className="border-b border-black/8 bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <Link href="/case-studies/asavari-stays" className="group mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="product-eyebrow">Customer story · Nupur Purohit</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] sm:text-4xl">From a beautiful stay to a booking conversation.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-muted)]">See how Asavari Stays connects visual storytelling, WhatsApp retargeting, and human follow-up.</p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#a21c98]">View case study <Icon name="arrow-right" className="transition-transform group-hover:translate-x-1" /></span>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-[#2c243b] p-7 text-white shadow-[0_24px_70px_rgba(44,36,59,.12)]">
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#d92bcb]/25 blur-3xl" aria-hidden="true" />
            <p className="relative text-xs font-bold uppercase tracking-[.14em] text-[#ff8af1]">Asavari Stays × HotelRadar</p>
            <div className="relative mt-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4"><div><span className="grid h-12 w-12 place-items-center rounded-full bg-white/10"><Icon name="image" /></span><p className="mt-4 text-lg font-semibold">Visual story</p><p className="mt-1 text-xs text-white/45">Creates desire</p></div><Icon name="arrow-right" className="text-[#ff8af1]" /><div><span className="grid h-12 w-12 place-items-center rounded-full bg-[#d92bcb]"><Icon name="message-circle" /></span><p className="mt-4 text-lg font-semibold">WhatsApp</p><p className="mt-1 text-xs text-white/45">Continues intent</p></div></div>
          </div>
        </Link>
      </section>

      <section id="guides" className="scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="product-eyebrow">Help guides</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Start with the task in front of you.</h2></div>
          <div className="mt-10 grid gap-x-10 md:grid-cols-2">
            {helpArticles.map((article) => <Link key={article.slug} href={`/help/${article.slug}`} className="group border-t border-black/10 py-6"><div className="flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-[.1em] text-[#a21c98]">{article.category} · {article.minutes} min</span><Icon name="arrow-right" className="text-[#d92bcb] transition-transform group-hover:translate-x-1" /></div><h3 className="mt-4 text-xl font-semibold transition group-hover:text-[#a21c98]">{article.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">{article.summary}</p></Link>)}
          </div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="product-eyebrow">Trust resources</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Understand the boundaries before you connect.</h2></div>
          <div className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">{trustResources.map((resource) => <Link key={resource.href} href={resource.href} className="group border-t border-black/10 py-5"><h3 className="flex items-center justify-between gap-3 font-bold">{resource.title}<Icon name="arrow-right" className="text-[#d92bcb] transition-transform group-hover:translate-x-1" /></h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{resource.copy}</p></Link>)}</div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-xl bg-[#251f2d] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><h2 className="text-2xl font-semibold">Still need a person?</h2><p className="mt-2 text-sm text-white/55">Share the blocker without passwords, OTPs, or access tokens.</p></div><a href="mailto:info@aifrogi.com?subject=AiFrogi%20support" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#d92bcb] px-5 text-sm font-bold">Contact support <Icon name="arrow-right" /></a></div></section>

      <SiteFooter />
    </main>
  );
}
