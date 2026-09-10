import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { websiteHelpArticles } from "@/lib/help-center";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Help Center | AiFrogi",
  description: "Practical guides for setting up your AI business bot, managing approved knowledge, website delivery, security, and support.",
  path: "/help"
});

const categories = [...new Set(websiteHelpArticles.map((article) => article.category))];

export default function HelpCenterPage() {
  return <main className="min-h-screen bg-white text-[var(--text)]">
    <SiteHeader />
    <section className="border-b border-white/10 bg-[#101010] px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">AiFrogi AI Bot Help Center</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Choose the task. Follow the guide.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/62">Create, train, publish and operate your AI Bot—with or without a website.</p></div><Link href="/resources" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#9b7518] px-5 text-sm font-bold text-white">View complete onboarding route →</Link></div>
    </section>
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="mb-10 grid gap-3 rounded-2xl border border-[#d8c278] bg-[#fff9e8] p-5 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#76590f]">New client</p><p className="mt-2 text-sm">Start with workspace creation and knowledge upload.</p></div><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#76590f]">Ready to publish</p><p className="mt-2 text-sm">Choose standalone web app or website installation.</p></div><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#76590f]">Already live</p><p className="mt-2 text-sm">Use Leads, Team Inbox, Billing and Improve My Bot.</p></div></div>
      <nav aria-label="Help categories" className="flex flex-wrap gap-2">{categories.map((category) => <a key={category} href={`#${category.toLowerCase().replaceAll(" ", "-")}`} className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-semibold hover:border-[#ded8cb] hover:bg-[var(--primary-soft)]">{category}</a>)}</nav>
      <div className="mt-12 space-y-12">{categories.map((category) => <section key={category} id={category.toLowerCase().replaceAll(" ", "-")} className="scroll-mt-24" aria-labelledby={`${category}-title`}><div className="border-b border-[var(--border)] pb-3"><h2 id={`${category}-title`} className="text-xl font-semibold">{category}</h2></div><div className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)]">{websiteHelpArticles.filter((article) => article.category === category).map((article) => <Link key={article.slug} href={`/help/${article.slug}`} className="group bg-white p-6 hover:bg-[#fbfaf7]"><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold text-[var(--primary-strong)]">{article.minutes} min guide</span><span aria-hidden="true" className="text-[var(--primary-strong)] transition-transform group-hover:translate-x-1">→</span></div><h3 className="mt-5 text-lg font-semibold">{article.title}</h3><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{article.summary}</p></Link>)}</div></section>)}</div>
    </div>
    <SiteFooter />
  </main>;
}
