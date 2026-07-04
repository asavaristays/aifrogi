import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { helpArticles } from "@/lib/help-center";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "WhatsApp Business Help Center | AiFrogi",
  description: "Clear guides for WhatsApp onboarding, messaging, campaigns, AI knowledge, account access, security, and support.",
  path: "/help"
});

const categories = ["Buying guide", "Get started", "Messaging", "Campaigns", "Knowledge and AI", "Account and security", "Support"];

export default function HelpCenterPage() {
  return <main className="min-h-screen bg-white text-[var(--text)]">
    <SiteHeader />
    <section className="border-b border-white/10 bg-[#2c243b] px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff8af1]">AiFrogi Resource Center</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Answers that move the work forward.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/62">Short, practical guidance for setup, messaging, campaigns, AI knowledge, access, and support.</p></div>
    </section>
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <nav aria-label="Help categories" className="flex flex-wrap gap-2">{categories.map((category) => <a key={category} href={`#${category.toLowerCase().replaceAll(" ", "-")}`} className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-semibold hover:border-[#e8bce5] hover:bg-[var(--primary-soft)]">{category}</a>)}</nav>
      <div className="mt-12 space-y-12">{categories.map((category) => <section key={category} id={category.toLowerCase().replaceAll(" ", "-")} className="scroll-mt-24" aria-labelledby={`${category}-title`}><div className="border-b border-[var(--border)] pb-3"><h2 id={`${category}-title`} className="text-xl font-semibold">{category}</h2></div><div className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)]">{helpArticles.filter((article) => article.category === category).map((article) => <Link key={article.slug} href={`/help/${article.slug}`} className="group bg-white p-6 hover:bg-[#fffaff]"><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold text-[var(--primary-strong)]">{article.minutes} min guide</span><span aria-hidden="true" className="text-[var(--primary-strong)] transition-transform group-hover:translate-x-1">→</span></div><h3 className="mt-5 text-lg font-semibold">{article.title}</h3><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{article.summary}</p></Link>)}</div></section>)}</div>
    </div>
    <SiteFooter />
  </main>;
}
