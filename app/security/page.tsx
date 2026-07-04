import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "WhatsApp Business Data Security | AiFrogi",
  description: "Review AiFrogi security controls, workspace data boundaries, encrypted credentials, AI safeguards, and Meta Tech Provider verification.",
  path: "/security"
});

const controls = [
  ["Access", "Role-based workspaces, signed sessions, and server-side authorization protect customer operations."],
  ["Credentials", "WhatsApp access tokens and registration secrets are encrypted at rest and never displayed to clients."],
  ["Transport", "Production traffic uses HTTPS. Meta webhooks are verified before message data is processed."],
  ["Data boundaries", "Organizations and workspaces scope contacts, messages, documents, campaigns, and configuration."],
  ["AI controls", "Approved knowledge, confidence fallback, opt-out handling, and human handoff bound automated replies."],
  ["Operations", "Delivery status, activity history, support cases, and connection health provide an audit trail."]
];

const verificationFacts = [
  ["Status", "Verified"],
  ["Verified business", "webtechnosys"],
  ["Platform", "AiFrogi"],
  ["Confirmation", "1 July 2026"]
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white text-[#2c243b]">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#2c243b] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#d92bcb]/15 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff8af1]">Trust center</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl">Security that stays understandable.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">AiFrogi protects business messaging while keeping customers in control of their Meta account, data, users, and automation boundaries.</p>
        </div>
      </section>

      <section id="meta-verification" className="scroll-mt-20 border-b border-black/8 bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="product-eyebrow">Meta access verification</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] sm:text-4xl">webtechnosys is verified by Meta as a Tech Provider.</h2>
            <p className="mt-5 leading-7 text-[var(--text-muted)]">Verification was confirmed after Meta completed its access-verification submission and review.</p>

            <dl className="mt-8 grid gap-x-7 sm:grid-cols-2">
              {verificationFacts.map(([label, value]) => <div key={label} className="border-t border-black/10 py-4"><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">{label}</dt><dd className="mt-2 text-sm font-bold text-[#2c243b]">{value}</dd></div>)}
            </dl>

            <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">This confirms Tech Provider access verification for webtechnosys. It does not claim Meta endorsement, Accelerate Partner membership, or guaranteed approval of any customer account.</p>
            <a href="https://www.facebook.com/legal/BM-tech-provider-terms" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#a21c98]">Read Meta Tech Provider terms <Icon name="arrow-right" /></a>
          </div>

          <figure className="overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_24px_70px_rgba(44,36,59,.1)]">
            <a href="/brand/meta-tech-provider-verification.png" target="_blank" aria-label="Open the Meta Tech Provider verification evidence at full size">
              <Image src="/brand/meta-tech-provider-verification.png" alt="Meta Access Verification page showing webtechnosys verified as a Tech Provider" width={1890} height={734} className="h-auto w-full" priority />
            </a>
            <figcaption className="border-t border-black/8 px-5 py-4 text-xs leading-5 text-[var(--text-muted)]"><strong className="text-[#2c243b]">Verification evidence.</strong> Captured from Meta Access Verification on 1 July 2026. Open for full-size review.</figcaption>
          </figure>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="product-eyebrow">Security controls</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Clear controls across every customer workspace.</h2></div>
          <div className="mt-10 grid gap-x-10 md:grid-cols-2">{controls.map(([title, copy]) => <article key={title} className="border-t border-black/10 py-6"><h3 className="text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#fbf8fc] px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.7fr_1.3fr]"><h2 className="text-3xl font-semibold tracking-[-.03em]">Shared responsibility</h2><div><p className="text-sm leading-7 text-[var(--text-muted)]">webtechnosys secures and operates AiFrogi. Customers remain responsible for lawful contact collection, WhatsApp opt-in, approved content, user access, Meta billing, and accurate business information. Meta independently operates WhatsApp Business Platform and may apply policy, quality, template, or billing restrictions.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-[#a21c98]"><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-of-service">Terms of service</Link><Link href="/data-deletion">Data deletion</Link><a href="mailto:info@aifrogi.com">Report a security concern</a></div></div></div></section>

      <SiteFooter />
    </main>
  );
}
