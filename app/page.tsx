import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { OnboardingJourney } from "@/components/marketing/onboarding-journey";
import { WhatsAppCostCalculator } from "@/components/marketing/whatsapp-cost-calculator";

const loginUrl = "https://app.aifrogi.com/login";
const registerUrl = "https://app.aifrogi.com/register";

const plans = [
  {
    name: "Starter",
    monthly: "₹1,650",
    quarterly: "₹4,950 billed quarterly",
    bestFor: "A focused WhatsApp inbox and first campaigns",
    features: ["1 WhatsApp number", "Shared inbox", "Contacts and templates", "Basic broadcasts", "Onboarding support"]
  },
  {
    name: "Growth",
    monthly: "₹3,550",
    quarterly: "₹10,650 billed quarterly",
    bestFor: "Teams that need campaigns and workflow follow-up",
    featured: true,
    features: ["Everything in Starter", "Multi-agent operations", "Campaign analytics", "5 automation workflows", "Priority support"]
  },
  {
    name: "AI Operations",
    monthly: "₹5,500",
    quarterly: "₹16,500 billed quarterly",
    bestFor: "Knowledge answers, qualification, and assisted automation",
    features: ["Everything in Growth", "Knowledge assistant", "AI lead qualification", "Human handoff controls", "Advanced workflow design"]
  }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-[#2c243b]">
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#251f2d]/90 px-5 text-white backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5">
          <Link href="/" className="flex items-center" aria-label="AiFrogi home">
            <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[142px] sm:w-[158px]" />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-semibold text-white/65 md:flex">
            <a className="transition hover:text-white" href="#product">Product experience</a><a className="transition hover:text-white" href="#calculator">Calculator</a><a className="transition hover:text-white" href="#pricing">Pricing</a><Link className="transition hover:text-white" href="/product-tour">Tour</Link>
          </div>
          <div className="flex items-center gap-3"><a href={loginUrl} className="hidden text-sm font-semibold text-white/70 hover:text-white sm:inline-flex">Log in</a><a href={registerUrl} className="inline-flex min-h-10 items-center rounded-lg bg-[#d92bcb] px-4 text-sm font-bold text-white shadow-[0_0_28px_rgba(217,43,203,.22)] transition hover:bg-[#e33bd4]">Start free trial</a></div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-[#2c243b] px-5 pb-0 pt-20 text-white sm:px-8 sm:pt-24">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#d92bcb]/20 blur-[130px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-[#ff8af1] shadow-[0_0_12px_#ff8af1]" />Built on the official WhatsApp Business Platform</p>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Turn WhatsApp conversations into <span className="bg-gradient-to-r from-[#ff8af1] to-[#d92bcb] bg-clip-text text-transparent">revenue.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">Messaging, campaigns, automation, and AI assistance in one workspace—with the context and human control your team needs.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#d92bcb] px-6 text-sm font-bold text-white shadow-[0_0_34px_rgba(217,43,203,.25)] transition hover:-translate-y-0.5 hover:bg-[#e33bd4]">Start 30-day trial <Icon name="arrow-right" /></a><Link href="/product-tour" className="inline-flex min-h-12 items-center rounded-lg border border-white/15 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10">Watch product tour</Link></div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-white/40"><span>No credit card</span><span>•</span><span>Guided setup</span><span>•</span><span>Human handover built in</span></div>

          <FeatureShowcase />
        </div>
      </section>

      <section className="bg-[#2c243b] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-24"><p className="text-xs font-semibold text-[#ff8af1]">Knowledge with boundaries</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">AI answers from approved business truth.</h2><p className="mt-4 text-base leading-7 text-white/65">Connect a public website, review its topic coverage, define workspace instructions, protect sensitive topics, and preview answers before automation goes live.</p><a href={loginUrl} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d92bcb] px-4 text-sm font-semibold text-white">Open Knowledge workspace <Icon name="arrow-right" /></a></div>
          <div className="grid gap-3 sm:grid-cols-2"><DarkFeature title="Approved sources" copy="Public pages and approved documents become the only business reference." icon="file-text" /><DarkFeature title="Answer constitution" copy="Global safety and customer-specific behavior stay visible and controlled." icon="sparkles" /><DarkFeature title="Knowledge gaps" copy="Unanswered questions reveal exactly what information the business should add." icon="help-circle" /><DarkFeature title="Human handover" copy="Complaints, billing, legal, sensitive, and low-confidence requests reach a person." icon="message-circle" /></div>
        </div>
      </section>

      <OnboardingJourney />

      <WhatsAppCostCalculator />

      <section id="pricing" className="border-y border-[#eee6f0] bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="product-eyebrow">Clear pricing</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Platform fee and Meta usage stay separate.</h2><p className="mt-4 leading-7 text-[var(--text-muted)]">All plans include a 30-day working trial. Meta template-message charges, taxes, optional custom integrations, and unusually high AI usage are billed separately and shown before commitment.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <PricingPlan key={plan.name} {...plan} />)}</div>
          <div className="mt-6 grid gap-4 rounded-lg border border-black/8 bg-white p-5 text-sm leading-6 text-[var(--text-muted)] md:grid-cols-3"><p><strong className="block text-[#18211e]">Meta message charges</strong>Pass-through usage based on template category and recipient country.</p><p><strong className="block text-[#18211e]">Wallet responsibility</strong>The client funds or authorizes the connected Meta billing account.</p><p><strong className="block text-[#18211e]">No credential sharing</strong>Clients approve access through Meta&apos;s secure connection flow.</p></div>
        </div>
      </section>

      <section id="support" className="px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div><p className="product-eyebrow">Trust by design</p><h2 className="mt-3 text-3xl font-semibold">Clear boundaries for data, AI, and Meta.</h2></div><div className="grid gap-4 sm:grid-cols-2"><TrustItem title="Client-controlled access" copy="No Facebook password, email password, permanent token, or OTP sharing."/><TrustItem title="Bounded AI" copy="Answers use approved knowledge; uncertainty routes to a human."/><TrustItem title="Consent-aware campaigns" copy="Audience preview, permission confirmation, cost estimate, and approved template."/><TrustItem title="Operational support" copy="Tickets include the customer's setup context without exposing credentials."/></div></div></section>

      <footer className="border-t border-[#eee6f0] bg-white px-5 py-10 text-[#2c243b] sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[160px]" /><p className="mt-1 text-xs text-[#756b80]">WhatsApp messaging, automation, and human operations.</p></div><div className="flex flex-wrap gap-5 text-xs font-semibold text-[#655b70]"><Link href="/product-tour">Product tour</Link><Link href="/help">Help Center</Link><Link href="/security">Security</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link><Link href="/disclaimer">Disclaimer</Link><Link href="/data-deletion">Data deletion</Link></div></div></footer>
    </main>
  );
}

function DarkFeature({ title, copy, icon }: { title: string; copy: string; icon: "file-text" | "sparkles" | "help-circle" | "message-circle" }) { return <article className="rounded-md border border-white/10 bg-white/5 p-5"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/8 text-[#ff8af1]"><Icon name={icon} /></span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/58">{copy}</p></article>; }
function TrustItem({ title, copy }: { title: string; copy: string }) { return <div className="border-t border-black/10 pt-4"><strong className="text-sm">{title}</strong><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div>; }
function PricingPlan({ name, monthly, quarterly, bestFor, features, featured }: { name: string; monthly: string; quarterly: string; bestFor: string; features: string[]; featured?: boolean }) { return <article className={`rounded-lg border bg-white p-6 ${featured ? "border-[#d92bcb] shadow-lg" : "border-black/8"}`}><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{name}</h3>{featured ? <span className="status-pill bg-[#fde9fb] text-[#a21c98]">Recommended</span> : null}</div><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{bestFor}</p><p className="mt-7 text-3xl font-semibold">{monthly}<small className="text-sm font-medium text-[var(--text-muted)]"> / month</small></p><p className="mt-1 text-xs text-[var(--text-muted)]">{quarterly}</p><ul className="mt-6 space-y-3 text-sm">{features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-[#d92bcb]">✓</span>{feature}</li>)}</ul><a href={registerUrl} className={`mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md text-sm font-bold ${featured ? "bg-[#d92bcb] text-white" : "border border-black/10"}`}>Start trial</a></article>; }
