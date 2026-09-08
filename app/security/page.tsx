import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Bot Security | AiFrogi",
  description: "How AiFrogi protects website AI Bot conversations, approved knowledge, workspace access, and customer data.",
  path: "/security"
});

const controls = [
  ["Workspace isolation", "Server-side checks bind every customer, conversation, document, and action to the correct workspace."],
  ["Signed visitor sessions", "Website visitors receive short-lived tenant-bound capabilities; guessed session identifiers cannot read transcripts."],
  ["Approved knowledge", "Only published, current, conflict-free business knowledge can support a customer-facing answer."],
  ["Human authority", "Sensitive questions, uncertain answers, and consequential actions remain subject to explicit human control."],
  ["Protected credentials", "Application credentials remain server-side and are never exposed in installation code or client bundles."],
  ["Auditable operations", "Support access, administrative changes, answer evidence, and verified actions retain accountable records."]
];

export default function SecurityPage() {
  return <main className="bg-white text-[#101010]">
    <SiteHeader />
    <section className="bg-[#101010] px-5 py-20 text-white sm:px-8"><div className="mx-auto max-w-7xl"><p className="product-eyebrow text-[#e2c66d]">Security</p><h1 className="mt-4 max-w-4xl text-4xl font-semibold sm:text-6xl">Business intelligence protected by clear boundaries.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">AiFrogi protects website conversations, approved business knowledge, customer workspaces, and human decision authority.</p></div></section>
    <section className="px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{controls.map(([title, copy]) => <article key={title} className="rounded-2xl border border-black/8 bg-[#fbfaf7] p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{copy}</p></article>)}</div><div className="mt-10 flex flex-wrap gap-5 text-sm font-bold text-[#6d5310]"><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-of-service">Terms of service</Link><Link href="/data-deletion">Data deletion</Link><a href="mailto:info@aifrogi.com">Report a security concern</a></div></div></section>
    <SiteFooter />
  </main>;
}
