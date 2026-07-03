import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/icons";

const loginUrl = "https://app.aifrogi.com/login";
const registerUrl = "https://app.aifrogi.com/register";

const platformRoles = [
  { role: "User", title: "Handle the conversation", copy: "Agents see assigned chats, priority, approved AI drafts, customer context, and the exact reason for a human handover.", items: ["Today queue", "Shared inbox", "Contacts and notes", "Safe AI replies"] },
  { role: "Client Admin", title: "Run the workspace", copy: "Business owners control onboarding, campaigns, knowledge, automation, team access, usage, and support without handling Meta credentials.", items: ["Business setup", "Knowledge controls", "Campaign approval", "Automation health"] },
  { role: "AiFrogi Super Admin", title: "Protect every customer", copy: "Platform operators monitor onboarding, Meta status, delivery, knowledge readiness, billing, support, and audited customer assistance.", items: ["Customer pipeline", "Platform health", "Template governance", "Support context"] }
];

const onboardingSteps = ["Create workspace", "Connect WhatsApp", "Approve knowledge", "Choose workflows", "Test safely", "Go live"];

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
    <main className="bg-white text-[#2c243b]">
      <nav className="sticky top-0 z-30 border-b border-[#eee6f0] bg-white/95 px-5 text-[#2c243b] backdrop-blur sm:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5">
          <Link href="/" className="flex items-center" aria-label="AiFrogi home">
            <Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[142px] sm:w-[162px]" />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-[#6e6478] md:flex">
            <a href="#product">Product</a><a href="#roles">Who it serves</a><a href="#pricing">Pricing</a><Link href="/security">Security</Link>
          </div>
          <a href={loginUrl} className="inline-flex min-h-9 items-center rounded-md border border-[#eadfed] px-3 text-sm font-bold text-[#a21c98] hover:bg-[#fde9fb]">Sign in</a>
        </div>
      </nav>

      <section className="relative min-h-[600px] overflow-hidden bg-white text-[#2c243b] sm:min-h-[620px] lg:min-h-[640px]">
        <Image src="/brand/aifrogi-dashboard.png" alt="AiFrogi customer operations dashboard" fill priority className="object-cover object-center opacity-35" sizes="100vw" />
        <div className="absolute inset-0 bg-white/78" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-5 pb-16 pt-16 sm:min-h-[620px] sm:px-8 lg:min-h-[640px]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#c725ba]">Built by a verified Meta Tech Provider</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.04] sm:text-6xl lg:text-7xl">AiFrogi</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-[#655b70] sm:text-2xl">WhatsApp operations that tell your team what matters now, what happens next, and when a human should take over.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#d92bcb] px-5 text-sm font-bold text-white hover:bg-[#bb20af]">Start 30-day trial <Icon name="arrow-right" /></a>
            <a href="#product" className="inline-flex min-h-12 items-center rounded-md border border-[#d9cedd] bg-white px-5 text-sm font-bold hover:bg-[#faf3fb]">See how it works</a>
          </div>
          <div className="mt-12 grid max-w-3xl gap-3 text-sm font-medium text-[#756b80] sm:grid-cols-3"><span>Client-safe onboarding</span><span>Approved campaign templates</span><span>AI with human control</span></div>
        </div>
      </section>

      <section id="product" className="border-b border-[#eee6f0] bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="product-eyebrow">One operating loop</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">From customer message to the right next action.</h2><p className="mt-4 text-base leading-7 text-[var(--text-muted)]">AiFrogi joins onboarding, messaging, campaigns, knowledge, automation, and support without exposing Meta credentials or asking teams to become API experts.</p></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-black/8 bg-black/8 lg:grid-cols-3">
            <ProductStep number="01" title="Connect once" copy="The client selects their business and WhatsApp number. AiFrogi configures and monitors the technical connection." />
            <ProductStep number="02" title="Work from one inbox" copy="Every inbound message becomes an owned conversation with response status, context, and a clear handoff path." />
            <ProductStep number="03" title="Automate with boundaries" copy="Approved knowledge and workflows handle repeatable work. Low confidence, exceptions, and sales intent reach a human." />
          </div>
        </div>
      </section>

      <section id="roles" className="border-b border-[#eee6f0] bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="product-eyebrow">One platform, clear responsibilities</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Every person sees the work they own.</h2><p className="mt-4 text-base leading-7 text-[var(--text-muted)]">AiFrogi separates daily conversations, business administration, and platform operations. This keeps the interface focused and customer data properly bounded.</p></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-[#eadfed] bg-[#eadfed] lg:grid-cols-3">{platformRoles.map((item, index) => <article key={item.role} className="bg-white p-7"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#c725ba]">{item.role}</span><span className="text-xs text-[#a99ead]">0{index + 1}</span></div><h3 className="mt-7 text-xl font-semibold">{item.title}</h3><p className="mt-3 min-h-20 text-sm leading-6 text-[var(--text-muted)]">{item.copy}</p><ul className="mt-6 space-y-2 border-t border-[#eee6f0] pt-5 text-sm">{item.items.map((feature) => <li key={feature} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d92bcb]" />{feature}</li>)}</ul></article>)}</div>
        </div>
      </section>

      <section className="bg-[#2c243b] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-24"><p className="text-xs font-semibold text-[#ff8af1]">Knowledge with boundaries</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">AI answers from approved business truth.</h2><p className="mt-4 text-base leading-7 text-white/65">Connect a public website, review its topic coverage, define workspace instructions, protect sensitive topics, and preview answers before automation goes live.</p><a href={loginUrl} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d92bcb] px-4 text-sm font-semibold text-white">Open Knowledge workspace <Icon name="arrow-right" /></a></div>
          <div className="grid gap-3 sm:grid-cols-2"><DarkFeature title="Approved sources" copy="Public pages and approved documents become the only business reference." icon="file-text" /><DarkFeature title="Answer constitution" copy="Global safety and customer-specific behavior stay visible and controlled." icon="sparkles" /><DarkFeature title="Knowledge gaps" copy="Unanswered questions reveal exactly what information the business should add." icon="help-circle" /><DarkFeature title="Human handover" copy="Complaints, billing, legal, sensitive, and low-confidence requests reach a person." icon="message-circle" /></div>
        </div>
      </section>

      <section className="border-b border-[#eee6f0] bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end"><div><p className="product-eyebrow">Predictive onboarding</p><h2 className="mt-3 text-3xl font-semibold">One clear step at a time.</h2><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">Customers always know what is complete, what AiFrogi is handling, what is waiting on Meta, and what they need to do next.</p></div><div className="grid gap-2 sm:grid-cols-3">{onboardingSteps.map((step, index) => <div key={step} className="flex min-h-20 items-center gap-3 rounded-md border border-[#eadfed] bg-white px-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#fde9fb] text-xs font-semibold text-[#a21c98]">{index + 1}</span><strong className="text-sm">{step}</strong></div>)}</div></div></div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div><p className="product-eyebrow">Product walkthrough</p><h2 className="mt-3 text-3xl font-semibold">Understand the day in under 90 seconds.</h2><p className="mt-4 text-base leading-7 text-[var(--text-muted)]">The home dashboard starts with attention, not analytics. It explains each issue, who owns it, and the next safe action.</p><a href={loginUrl} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#c725ba]">Open the working product <Icon name="arrow-right" /></a></div>
          <div className="overflow-hidden rounded-lg border border-[#3a2f4d] bg-[#2c243b] text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><strong className="text-sm">Today in AiFrogi</strong><span className="status-pill bg-[#4b3152] text-[#ff8af1]">Live</span></div>
            <div className="grid gap-4 p-5 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-md bg-white p-5 text-[#2c243b]"><p className="product-eyebrow">Needs attention</p><h3 className="mt-2 text-xl font-bold">2 conversations need a reply</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The last customer message is unanswered. Replying now protects the active service window.</p><span className="tour-signal mt-5 block h-2 w-3/4 rounded bg-[#e33bd4]"/></div>
              <div className="space-y-3">{[["WhatsApp","Connected"],["Meta review","Live"],["Wallet","Check before campaign"]].map(([label,value]) => <div key={label} className="rounded-md border border-white/8 bg-white/5 p-4"><small className="text-white/52">{label}</small><strong className="mt-1 block text-sm">{value}</strong></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[#eee6f0] bg-[#fbf8fc] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="product-eyebrow">Clear pricing</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Platform fee and Meta usage stay separate.</h2><p className="mt-4 leading-7 text-[var(--text-muted)]">All plans include a 30-day working trial. Meta template-message charges, taxes, optional custom integrations, and unusually high AI usage are billed separately and shown before commitment.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <PricingPlan key={plan.name} {...plan} />)}</div>
          <div className="mt-6 grid gap-4 rounded-lg border border-black/8 bg-white p-5 text-sm leading-6 text-[var(--text-muted)] md:grid-cols-3"><p><strong className="block text-[#18211e]">Meta message charges</strong>Pass-through usage based on template category and recipient country.</p><p><strong className="block text-[#18211e]">Wallet responsibility</strong>The client funds or authorizes the connected Meta billing account.</p><p><strong className="block text-[#18211e]">No credential sharing</strong>Clients approve access through Meta&apos;s secure connection flow.</p></div>
        </div>
      </section>

      <section id="support" className="px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div><p className="product-eyebrow">Trust by design</p><h2 className="mt-3 text-3xl font-semibold">Clear boundaries for data, AI, and Meta.</h2></div><div className="grid gap-4 sm:grid-cols-2"><TrustItem title="Client-controlled access" copy="No Facebook password, email password, permanent token, or OTP sharing."/><TrustItem title="Bounded AI" copy="Answers use approved knowledge; uncertainty routes to a human."/><TrustItem title="Consent-aware campaigns" copy="Audience preview, permission confirmation, cost estimate, and approved template."/><TrustItem title="Operational support" copy="Tickets include the customer's setup context without exposing credentials."/></div></div></section>

      <footer className="border-t border-[#eee6f0] bg-white px-5 py-10 text-[#2c243b] sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[160px]" /><p className="mt-1 text-xs text-[#756b80]">WhatsApp messaging, automation, and human operations.</p></div><div className="flex flex-wrap gap-5 text-xs font-semibold text-[#655b70]"><Link href="/security">Security</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link><Link href="/disclaimer">Disclaimer</Link><Link href="/data-deletion">Data deletion</Link></div></div></footer>
    </main>
  );
}

function ProductStep({ number, title, copy }: { number: string; title: string; copy: string }) { return <article className="bg-white p-7"><span className="text-xs font-bold text-[#c725ba]">{number}</span><h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>; }
function DarkFeature({ title, copy, icon }: { title: string; copy: string; icon: "file-text" | "sparkles" | "help-circle" | "message-circle" }) { return <article className="rounded-md border border-white/10 bg-white/5 p-5"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/8 text-[#ff8af1]"><Icon name={icon} /></span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/58">{copy}</p></article>; }
function TrustItem({ title, copy }: { title: string; copy: string }) { return <div className="border-t border-black/10 pt-4"><strong className="text-sm">{title}</strong><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div>; }
function PricingPlan({ name, monthly, quarterly, bestFor, features, featured }: { name: string; monthly: string; quarterly: string; bestFor: string; features: string[]; featured?: boolean }) { return <article className={`rounded-lg border bg-white p-6 ${featured ? "border-[#d92bcb] shadow-lg" : "border-black/8"}`}><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{name}</h3>{featured ? <span className="status-pill bg-[#fde9fb] text-[#a21c98]">Recommended</span> : null}</div><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{bestFor}</p><p className="mt-7 text-3xl font-semibold">{monthly}<small className="text-sm font-medium text-[var(--text-muted)]"> / month</small></p><p className="mt-1 text-xs text-[var(--text-muted)]">{quarterly}</p><ul className="mt-6 space-y-3 text-sm">{features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-[#d92bcb]">✓</span>{feature}</li>)}</ul><a href={registerUrl} className={`mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md text-sm font-bold ${featured ? "bg-[#d92bcb] text-white" : "border border-black/10"}`}>Start trial</a></article>; }
