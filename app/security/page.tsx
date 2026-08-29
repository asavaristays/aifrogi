import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "AI Business Bot Security | AiFrogi",
  description: "Review the security controls behind AiFrogi: role-based access, protected business data, approved AI knowledge, signed webhooks, customer-controlled support, and secure integrations.",
  path: "/security"
});

const controls = [
  ["Access", "Role-based workspaces, signed sessions, privileged login OTP, and server-side authorization protect customer operations."],
  ["Credentials", "WhatsApp access tokens and registration secrets are encrypted at rest and never displayed to clients."],
  ["Transport", "Production traffic uses HTTPS. Meta webhook signatures are enforced with the Meta app secret, and unsigned webhook requests are rejected."],
  ["Data boundaries", "Organizations and workspaces scope contacts, messages, documents, campaigns, and configuration."],
  ["AI controls", "Approved knowledge, confidence fallback, opt-out handling, and human handoff bound automated replies."],
  ["Operations", "Delivery status, activity history, support grants, blocked support attempts, and connection health provide an audit trail."],
  ["Support access", "AiFrogi support cannot read private customer content by default. Customers grant time-bound access and can revoke it anytime."]
];

const verificationFacts = [
  ["Status", "Verified"],
  ["Verified business", "webtechnosys"],
  ["Platform", "AiFrogi"],
  ["Confirmation", "1 July 2026"]
];

const trustLadder = [
  ["Enforced now", "Customer-controlled support access, privileged login OTP, workspace-scoped WhatsApp APIs, encrypted credentials, signed Meta webhooks, and support-audit trails."],
  ["Verified behavior", "Repeatable security-boundary tests confirm covered sensitive routes reject unauthenticated access, workspace spoofing, and role-bypassing mutation attempts."],
  ["Enterprise evidence", "Public status, subprocessors, external assessment, and SOC 2 or ISO readiness as AiFrogi scales."]
];

const verifiedControls = [
  ["Support access", "Private customer content is locked by default. Owners/admins grant scope and duration before support can view sensitive areas."],
  ["Privileged OTP", "Platform admin and workspace owner/admin accounts require an email OTP after password verification."],
  ["Meta webhook signing", "Production webhook processing requires Meta's signature. Missing or invalid signatures are refused."],
  ["Boundary tests", "Fixture-based checks prove covered routes refuse cross-workspace and role-bypass attempts before release."]
];

const complianceStatus = [
  ["Tenant and workspace isolation", "Active", "Server-side workspace and role checks protect covered customer routes."],
  ["Encryption and secret handling", "Active", "Protected integration credentials are encrypted or referenced from server-side secret storage."],
  ["Webhook authenticity", "Active", "Meta webhook signatures are enforced in production."],
  ["Customer-controlled support", "Active", "Private support access is scoped, time-bound, revocable, and audited."],
  ["Privacy and deletion controls", "Published", "Privacy, data-deletion, terms, and security-contact routes are public."],
  ["SOC 2 certification", "Not certified", "A future external assurance objective; AiFrogi does not currently claim SOC 2 certification."],
  ["ISO 27001 certification", "Not certified", "A future information-security programme objective; no certification is currently claimed."],
  ["PCI DSS", "Provider responsibility", "Payment credentials remain with approved payment providers; AiFrogi does not claim to be a card-data processor."]
];

const evidenceRegister = [
  ["Production readiness", "Automated", "Health endpoint checks the database, session secret, public URL, Meta webhook signing, and legacy inbound-token configuration.", "Each release"],
  ["Security boundaries", "Automated", "Fixture-based tests exercise unauthenticated access, cross-workspace access, and role-bypassing mutations on covered routes.", "Before release"],
  ["Client-side secret exposure", "Automated", "Production client bundles are checked for protected credential patterns.", "Before release"],
  ["Backup and restoration", "Runbook ready", "Documented database backup, protected release snapshot, restoration, and rollback procedures.", "Operational review due"],
  ["Independent penetration test", "Planned", "External application and infrastructure assessment has not yet been completed.", "Before wider enterprise rollout"],
  ["Incident-response exercise", "Planned", "The response runbook exists; a formally recorded tabletop exercise remains pending.", "Before wider enterprise rollout"]
];

const sovereignControls = [
  ["Owned intelligence", "Approved business knowledge is stored and governed inside the customer workspace."],
  ["Channel independence", "Website and WhatsApp are connectors; the business intelligence is not owned by either channel."],
  ["Scoped model access", "Only information needed to answer the current request should be sent to an AI provider."],
  ["Human authority", "Business actions remain within configured permissions, approvals, and human-handoff rules."],
  ["Portable records", "Customer knowledge, conversations, and outcomes are maintained as business records rather than model memory."],
  ["Auditable operation", "Support grants, delivery activity, knowledge use, and covered administrative actions leave evidence."]
];

const subprocessors = [
  ["OpenAI", "AI response processing", "Approved knowledge excerpts and the conversation context required for a response."],
  ["Meta / WhatsApp", "Business messaging channel", "WhatsApp participant, message, template, and delivery information."],
  ["Infrastructure providers", "Application, database, network, backup, and email delivery", "Service data required to operate AiFrogi; the current provider register is available during customer review."]
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white text-[#101010]">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#101010] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#8a6a16]/15 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Trust center</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl">Security that stays understandable.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">AiFrogi protects business messaging while keeping customers in control of their Meta account, data, users, and automation boundaries.</p>
        </div>
      </section>

      <section id="meta-verification" className="scroll-mt-20 border-b border-black/8 bg-[#fbfaf7] px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="product-eyebrow">Meta access verification</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] sm:text-4xl">Meta access verification is confirmed for webtechnosys.</h2>
            <p className="mt-5 leading-7 text-[var(--text-muted)]">Verification was confirmed after Meta completed its access-verification submission and review.</p>

            <dl className="mt-8 grid gap-x-7 sm:grid-cols-2">
              {verificationFacts.map(([label, value]) => <div key={label} className="border-t border-black/10 py-4"><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">{label}</dt><dd className="mt-2 text-sm font-bold text-[#101010]">{value}</dd></div>)}
            </dl>

            <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">This confirms Meta access verification for webtechnosys in the WhatsApp platform setup flow. It does not claim Meta endorsement, Accelerate Partner membership, or guaranteed approval of any customer account.</p>
            <a href="https://www.facebook.com/legal/BM-tech-provider-terms" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#6d5310]">Read Meta Tech Provider terms <Icon name="arrow-right" /></a>
          </div>

          <figure className="overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_24px_70px_rgba(16,16,16,.1)]">
            <a href="/brand/meta-tech-provider-verification.png" target="_blank" aria-label="Open the Meta access verification evidence at full size">
              <Image src="/brand/meta-tech-provider-verification.png" alt="Meta Access Verification page showing webtechnosys access verification" width={1890} height={734} className="h-auto w-full" priority />
            </a>
            <figcaption className="border-t border-black/8 px-5 py-4 text-xs leading-5 text-[var(--text-muted)]"><strong className="text-[#101010]">Verification evidence.</strong> Captured from Meta Access Verification on 1 July 2026. Open for full-size review.</figcaption>
          </figure>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="product-eyebrow">Security controls</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Clear controls across every customer workspace.</h2></div>
          <div className="mt-10 grid gap-x-10 md:grid-cols-2">{controls.map(([title, copy]) => <article key={title} className="border-t border-black/10 py-6"><h3 className="text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#fbfaf7] px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div>
            <p className="product-eyebrow">Verified security posture</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Built controls, then tested refusal paths.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--text-muted)]">Security confidence comes from behavior, not slogans. AiFrogi records the controls below as current platform behavior and keeps the claim limited to the routes and workflows covered by verification.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {verifiedControls.map(([title, copy]) => (
              <article key={title} className="rounded-xl border border-black/8 bg-white p-5">
                <span className="inline-flex rounded-full bg-[#eaf9ef] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#178665]">Active</span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="compliance-status" className="scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="product-eyebrow">Compliance status register</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">What is active, and what is not yet claimed.</h2><p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">This register distinguishes implemented platform controls from formal third-party certification. It should be updated whenever a material control or assurance status changes.</p></div>
          <div className="mt-10 overflow-hidden rounded-xl border border-black/8">
            {complianceStatus.map(([control, status, evidence]) => <div key={control} className="grid gap-3 border-b border-black/8 bg-white p-5 last:border-b-0 md:grid-cols-[1fr_170px_1.6fr] md:items-start"><strong className="text-sm">{control}</strong><span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${status === "Active" || status === "Published" ? "bg-[#eaf9ef] text-[#178665]" : "bg-[#fff5df] text-[#9a6719]"}`}>{status}</span><p className="text-xs leading-5 text-[var(--text-muted)]">{evidence}</p></div>)}
          </div>
        </div>
      </section>

      <section id="evidence" className="scroll-mt-20 border-y border-black/8 bg-[#fbfaf7] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div><p className="product-eyebrow">Assurance evidence</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Trust backed by a visible evidence register.</h2><p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">The register separates automated checks, documented operating procedures, and independent work that is still pending. Detailed evidence remains access-controlled because it can contain sensitive system information.</p></div>
            <p className="text-xs leading-5 text-[var(--text-muted)] lg:text-right"><strong className="text-[#101010]">Register reviewed:</strong> 29 August 2026<br />Material changes are reflected on this page.</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-xl border border-black/8 bg-white">
            {evidenceRegister.map(([control, status, evidence, cadence]) => <div key={control} className="grid gap-3 border-b border-black/8 p-5 last:border-b-0 md:grid-cols-[1fr_150px_1.7fr_170px]"><strong className="text-sm">{control}</strong><span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${status === "Planned" ? "bg-[#fff5df] text-[#9a6719]" : "bg-[#eaf9ef] text-[#178665]"}`}>{status}</span><p className="text-xs leading-5 text-[var(--text-muted)]">{evidence}</p><p className="text-xs font-semibold leading-5 text-[#101010]">{cadence}</p></div>)}
          </div>
        </div>
      </section>

      <section id="sovereign-controls" className="scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="product-eyebrow">Sovereign Business Bot controls</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.03em] sm:text-4xl">The business owns its intelligence and preserves its operational data.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{sovereignControls.map(([title, copy]) => <article key={title} className="rounded-xl border border-black/8 bg-white p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#101010] text-sm font-bold text-white">✓</span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div>
        </div>
      </section>

      <section id="subprocessors" className="scroll-mt-20 border-y border-black/8 bg-[#fbfaf7] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="product-eyebrow">Data-processing transparency</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Key service providers are identified by purpose.</h2><p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">Actual processing depends on the customer’s enabled channels and features. Contractual terms, locations, retention, and the complete provider register should be confirmed during customer onboarding.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{subprocessors.map(([provider, purpose, data]) => <article key={provider} className="rounded-xl border border-black/8 bg-white p-6"><h3 className="text-lg font-bold">{provider}</h3><p className="mt-2 text-xs font-bold uppercase tracking-[.1em] text-[#6d5310]">{purpose}</p><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{data}</p></article>)}</div>
        </div>
      </section>

      <section id="customer-security-pack" className="scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="product-eyebrow">Customer assurance</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">A practical security pack for customer review.</h2><p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">Customers and design partners can request the current assurance pack. Sensitive test output and infrastructure details are shared only after an appropriate confidentiality review.</p><a href="mailto:info@aifrogi.com?subject=AiFrogi%20security%20pack%20request" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#8a6a16] px-5 text-sm font-bold text-white">Request security pack <Icon name="arrow-right" /></a></div>
          <div className="grid gap-x-8 sm:grid-cols-2">{["Security and architecture overview", "Data-flow and responsibility summary", "Privacy and deletion controls", "Subprocessor register", "Access and support-control summary", "Backup and incident-response summary", "Available test evidence", "Certification and remediation roadmap"].map((item) => <div key={item} className="flex gap-3 border-t border-black/10 py-4 text-sm font-semibold"><span className="text-[#178665]">✓</span>{item}</div>)}</div>
        </div>
      </section>

      <section id="assurance-roadmap" className="scroll-mt-20 border-y border-black/8 bg-[#101010] px-5 py-16 text-white sm:px-8">
        <div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Assurance roadmap</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Independent assurance follows operational maturity.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{[["Now", "Document controls, harden access, collect release evidence, and complete repeatable internal verification."], ["Next", "Commission an independent penetration test, remediate findings, and record an incident-response exercise."], ["Formal assurance", "Prepare for ISO/IEC 27001 certification and SOC 2 examination when the operating evidence and commercial need justify it."]].map(([title, copy]) => <article key={title} className="rounded-xl border border-white/12 bg-white/5 p-5"><h3 className="font-bold text-[#e2c66d]">{title}</h3><p className="mt-3 text-sm leading-6 text-white/62">{copy}</p></article>)}</div></div>
      </section>

      <section className="bg-[#101010] px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Customer-controlled support</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Support access is locked until the customer opens it.</h2>
            <p className="mt-5 text-sm leading-7 text-white/62">Super admin sees platform health by default. Private conversations, uploaded documents, knowledge content, and integration details require a time-bound customer grant.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Choose scope", "Conversation, document, knowledge, and integration access are granted separately."],
              ["Choose duration", "Access can be limited to 30 minutes, 2 hours, or 24 hours."],
              ["Revoke anytime", "Workspace owners and admins can revoke support access immediately."],
              ["Audit trail", "Every grant, revoke, blocked attempt, and support view is recorded."]
            ].map(([title, copy]) => <article key={title} className="border-t border-white/12 pt-5"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="product-eyebrow">Trust ladder</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">The standard goes higher as customer data grows.</h2>
            <p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">AiFrogi treats Meta-connected messaging as critical infrastructure. Controls start with strict workspace boundaries and customer-approved support access, then mature into external evidence as the platform scales.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {trustLadder.map(([title, copy], index) => <article key={title} className="rounded-2xl border border-black/8 bg-[#fbfaf7] p-6"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101010] text-xs font-bold text-white">{index + 1}</div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#fbfaf7] px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.7fr_1.3fr]"><h2 className="text-3xl font-semibold tracking-[-.03em]">Shared responsibility</h2><div><p className="text-sm leading-7 text-[var(--text-muted)]">webtechnosys secures and operates AiFrogi. Customers remain responsible for lawful contact collection, WhatsApp opt-in, approved content, user access, Meta billing, and accurate business information. Meta independently operates WhatsApp Business Platform and may apply policy, quality, template, or billing restrictions.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-[#6d5310]"><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-of-service">Terms of service</Link><Link href="/data-deletion">Data deletion</Link><a href="mailto:info@aifrogi.com">Report a security concern</a></div></div></div></section>

      <SiteFooter />
    </main>
  );
}
