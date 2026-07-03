import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { helpArticles } from "@/lib/help-center";

export const metadata: Metadata = {
  title: "AiFrogi Help Center",
  description: "Clear guides for WhatsApp onboarding, messaging, campaigns, AI knowledge, access, and support."
};

const categories = ["Get started", "Messaging", "Campaigns", "Knowledge and AI", "Account and security", "Support"];

export default function HelpCenterPage() {
  return <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
    <header className="border-b border-[var(--border)] bg-white px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
        <Link href="/" aria-label="AiFrogi home"><Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[150px]" /></Link>
        <div className="flex items-center gap-4 text-sm font-semibold"><Link href="/product-tour" className="text-[var(--text-muted)] hover:text-[var(--text)]">Product tour</Link><a href="mailto:info@aifrogi.com" className="text-[var(--primary-strong)]">Contact support</a></div>
      </div>
    </header>
    <section className="border-b border-[var(--border)] bg-[#2c243b] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-[#ff8af1]">AiFrogi Resource Center</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">Answers that move the work forward.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/68">Short, practical guidance for setting up WhatsApp, resolving delivery, running campaigns, governing AI, and getting human help.</p></div>
    </section>
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <nav aria-label="Help categories" className="flex flex-wrap gap-2">{categories.map((category) => <a key={category} href={`#${category.toLowerCase().replaceAll(" ", "-")}`} className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-semibold hover:border-[#e8bce5] hover:bg-[var(--primary-soft)]">{category}</a>)}</nav>
      <div className="mt-12 space-y-12">{categories.map((category) => <section key={category} id={category.toLowerCase().replaceAll(" ", "-")} className="scroll-mt-24" aria-labelledby={`${category}-title`}><div className="border-b border-[var(--border)] pb-3"><h2 id={`${category}-title`} className="text-xl font-semibold">{category}</h2></div><div className="grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)]">{helpArticles.filter((article) => article.category === category).map((article) => <Link key={article.slug} href={`/help/${article.slug}`} className="group bg-white p-6 hover:bg-[#fffaff]"><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold text-[var(--primary-strong)]">{article.minutes} min guide</span><span aria-hidden="true" className="text-[var(--primary-strong)] transition-transform group-hover:translate-x-1">→</span></div><h3 className="mt-5 text-lg font-semibold">{article.title}</h3><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{article.summary}</p></Link>)}</div></section>)}</div>
    </div>
  </main>;
}
