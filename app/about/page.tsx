import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "About AiFrogi and webtechnosys",
  description: "Meet the company behind AiFrogi, its Meta Tech Provider verification, operating principles, location, and approach to customer onboarding and support.",
  path: "/about"
});

const facts = [
  ["Platform", "AiFrogi"],
  ["Operator", "webtechnosys"],
  ["Location", "Morjim, Goa, India"],
  ["Meta status", "Tech Provider verification confirmed 1 July 2026"]
];

export default function AboutPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[#2c243b] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#d92bcb]/16 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff8af1]">About AiFrogi</p><h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl">WhatsApp operations should feel clear, not complicated.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">AiFrogi is a business messaging platform built and operated by webtechnosys from Morjim, Goa.</p></div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div><p className="product-eyebrow">One accountable operator</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Product, onboarding, and support stay connected.</h2><p className="mt-5 max-w-xl leading-7 text-[var(--text-muted)]">webtechnosys operates the platform and guides customers through number readiness, Meta onboarding, integrations, workflow setup, and ongoing support.</p></div>
          <dl className="grid gap-x-8 sm:grid-cols-2">{facts.map(([label, value]) => <div key={label} className="border-t border-black/10 py-5"><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">{label}</dt><dd className="mt-2 text-sm font-bold">{value}</dd></div>)}</dl>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="product-eyebrow">How we work</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em]">Clear ownership at every step.</h2></div><div>{[
          ["Guided onboarding", "We explain prerequisites, monitor Meta-dependent steps, and keep the next customer action visible."],
          ["Controlled automation", "Approved knowledge, consent, role-based access, and human handover define what automation can do."],
          ["Honest boundaries", "Meta controls WhatsApp approvals, quality, delivery rules, and usage charges. AiFrogi does not promise otherwise."]
        ].map(([title, copy]) => <article key={title} className="grid gap-3 border-t border-black/10 py-6 sm:grid-cols-[180px_1fr]"><h3 className="font-bold">{title}</h3><p className="text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div></div>
      </section>

      <section className="px-5 py-16 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 bg-[#2c243b] px-6 py-9 text-white sm:px-9 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-semibold">Verify before you connect.</h2><p className="mt-2 text-sm text-white/55">Review our Meta verification evidence, security controls, and platform responsibilities.</p></div><div className="flex flex-wrap gap-4"><Link href="/security#meta-verification" className="inline-flex min-h-11 items-center gap-2 font-bold text-[#ff8af1]">Verification evidence <Icon name="arrow-right" /></Link><Link href="/status" className="inline-flex min-h-11 items-center gap-2 font-bold">Service status <Icon name="arrow-right" /></Link></div></div></section>
      <SiteFooter />
    </main>
  );
}
