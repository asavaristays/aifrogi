import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Security Compliance and Client Controls | AiFrogi",
  description: "Review how AiFrogi manages security compliance at client level, the platform standards maintained today, verified trust signals, responsibility boundaries, and certifications not yet claimed.",
  path: "/security-compliance"
});

const clientControls = [
  ["Workspace isolation", "Each client operates inside an organization and workspace boundary. Covered server routes verify workspace ownership and role before returning or changing customer data."],
  ["Role-based administration", "Super Admin, workspace owner and client-admin responsibilities are separated. Sensitive operational access is granted according to role rather than shared credentials."],
  ["Controlled support access", "Private client content is unavailable to support by default. A client owner or admin grants scoped, time-bound access and can revoke it."],
  ["Credential protection", "Connector tokens and registration secrets remain server-side and are encrypted or retrieved from protected secret storage. They are not displayed in client interfaces."],
  ["AI governance", "The client controls approved knowledge, bot authority, escalation rules and human handover. Sensitive values such as passwords, OTPs and payment details are not accepted as bot knowledge."],
  ["Retention and deletion", "Client information is retained for service delivery and legitimate operational requirements. Eligible deletion requests follow the published verification and deletion process."],
  ["Connector verification", "Supported inbound webhooks are authenticated before processing, then routed to the owning client workspace and channel connection."],
  ["Audit and evidence", "Covered administrative actions, support grants, delivery activity and automated release checks create evidence for investigation and operational review."]
];

const standards = [
  ["HTTPS transport", "Maintained", "Production application traffic is served over encrypted HTTPS connections."],
  ["Tenant and role enforcement", "Active", "Server-side authorization protects covered workspace data and mutations."],
  ["Encrypted credential handling", "Active", "Protected connector credentials remain outside public client bundles."],
  ["Signed connector webhooks", "Active", "Forged or unsigned supported webhook traffic is rejected."],
  ["Privileged login verification", "Active", "Platform and privileged workspace access uses password verification plus email OTP."],
  ["Release quality gate", "Automated", "Type checking, lint, production build and client-secret scans run before a release is accepted."],
  ["Privacy and deletion notices", "Published", "Privacy, terms, security and deletion procedures are publicly available."],
  ["SOC 2 / ISO 27001", "Not certified", "These remain future independent assurance objectives and are not currently claimed."]
];

const trustSignals: Array<[string, string, string, "settings" | "file-text" | "bar-chart-3" | "grid"]> = [
  ["AI governance", "Approved knowledge, defined authority, auditability and human control.", "/security", "settings" as const],
  ["Company details", "AiFrogi is operated by webtechnosys from Goa, India.", "/about", "file-text" as const],
  ["Service status", "Public platform availability and incident information.", "/status", "bar-chart-3" as const],
  ["Verified controls", "Support access, OTP, signed webhooks and boundary tests.", "/security#evidence", "grid" as const]
];

export default function SecurityCompliancePage() {
  return (
    <main className="bg-white text-[var(--ink-900)]">
      <SiteHeader />
      <section className="relative overflow-hidden bg-black px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute right-[8%] top-[12%] h-96 w-96 rounded-full bg-[var(--gold-600)]/16 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="product-eyebrow text-[var(--gold-300)]">Security Compliance</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-7xl">Client-level controls. Evidence-led standards.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/62">AiFrogi manages security as a shared operating responsibility. We maintain platform safeguards, isolate client workspaces and verify covered controls; each client governs its users, approved knowledge, customer consent, business actions and connected accounts.</p>
        </div>
      </section>

      <section className="border-b border-black/8 bg-[var(--warm-25)] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl"><p className="product-eyebrow">Security and compliance transparency</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-5xl">Trust claims limited to controls we can prove.</h2><p className="mt-5 text-base leading-7 text-[var(--text-muted)]">Implemented controls, client responsibilities and assurance status are stated separately. AiFrogi does not claim SOC 2, ISO 27001 or another independent certification until the relevant external programme is completed.</p></div>
            <Link href="/security#compliance-status" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-black px-5 text-sm font-bold text-white">Detailed status register <Icon name="arrow-right" /></Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Workspace isolation","Active"],["Encrypted credentials","Active"],["Signed webhooks","Active"],["Controlled support","Active"],["SOC 2 / ISO","Not certified"]].map(([control,status]) => <div key={control} className="border-t border-black/14 py-5"><p className="text-sm font-semibold">{control}</p><p className={`mt-2 text-[10px] font-bold uppercase tracking-[.12em] ${status === "Active" ? "text-[#178665]" : "text-[#9a6719]"}`}>{status}</p></div>)}</div>
        </div>
      </section>

      <section id="trust-by-design" className="relative overflow-hidden bg-[var(--ink-950)] px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[var(--gold-600)]/18 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Trust by design</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl">Security controls customers can understand and verify.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">AiFrogi protects business workspaces with customer-approved support access, privileged login OTP, signed connector webhooks, encrypted credentials, and repeatable boundary tests for covered routes.</p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              {[["Connector webhook", "Signed traffic only"], ["Admin login", "Password + email OTP"], ["Boundary tests", "Verified refusal paths"]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/12 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/38">{label}</p><p className="mt-2 text-sm font-bold text-white">{value}</p></div>)}
            </div>
            <Link href="/security" className="group mt-8 inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#8a6a16] px-6 text-sm font-bold text-white shadow-[0_0_38px_rgba(138,106,22,.3)] transition hover:-translate-y-0.5 hover:bg-[#b28728]">Review Data Security <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/45"><Link href="/help/protect-whatsapp-customer-data" className="transition hover:text-white">Plain-English security guide</Link><Link href="/about" className="transition hover:text-white">About webtechnosys</Link><Link href="/privacy-policy" className="transition hover:text-white">Privacy policy</Link><Link href="/data-deletion" className="transition hover:text-white">Data deletion</Link><a href="mailto:info@aifrogi.com" className="transition hover:text-white">Report a concern</a></div>
          </div>
          <div className="border-y border-white/12">
            <SecurityControl icon="settings" title="Customer-approved support access" copy="Super admin cannot freely read private customer content. Owners/admins grant time-bound support access by scope." />
            <SecurityControl icon="phone" title="Privileged login OTP" copy="Platform admin and workspace owner/admin sign-in requires password plus email OTP before a session is created." />
            <SecurityControl icon="link" title="Signed connector webhooks" copy="Supported connector traffic is verified before processing. Unsigned or forged webhook requests are rejected." />
            <SecurityControl icon="grid" title="Verified workspace boundaries" copy="Temporary fixture tests confirm covered routes reject cross-workspace slugs and role-bypassing mutation attempts." />
            <SecurityControl icon="sparkles" title="AI stays controlled" copy="Approved knowledge, role-based access, confidence fallback, and human handover keep automation bounded." />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div><p className="product-eyebrow">Client-level management</p><h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">How every client workspace is protected.</h2><p className="mt-5 text-base leading-7 text-[var(--text-muted)]">Controls are applied to the client boundary, not merely described at platform level. Access, intelligence, connectors and support are governed within the owning organization.</p></div>
          <div className="border-t border-black/14">{clientControls.map(([title,copy], index) => <article key={title} className="grid gap-3 border-b border-black/14 py-6 sm:grid-cols-[45px_190px_1fr]"><span className="font-mono text-xs text-[var(--gold-600)]">0{index+1}</span><h3 className="font-semibold">{title}</h3><p className="text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[var(--warm-25)] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="product-eyebrow">Standards we maintain</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Operational standards and honest assurance status.</h2></div><div className="mt-10 overflow-hidden border-y border-black/14">{standards.map(([control,status,evidence]) => <div key={control} className="grid gap-3 border-b border-black/14 py-6 last:border-b-0 md:grid-cols-[1fr_170px_1.7fr]"><strong className="text-sm">{control}</strong><span className={`w-fit text-[10px] font-bold uppercase tracking-[.12em] ${status === "Not certified" ? "text-[#9a6719]" : "text-[#178665]"}`}>{status}</span><p className="text-sm leading-6 text-[var(--text-muted)]">{evidence}</p></div>)}</div></div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl"><p className="product-eyebrow">Verified trust signals</p><h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Verify the operator, service status and security boundaries.</h2><div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{trustSignals.map(([title,copy,href,icon]) => <Link key={title} href={href} className="group border-t border-black/14 pt-5"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--gold-700)]"><Icon name={icon} /></span><h3 className="mt-5 flex items-center justify-between gap-3 text-lg font-bold">{title}<Icon name="arrow-right" className="text-[var(--gold-600)] transition-transform group-hover:translate-x-1" /></h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></Link>)}</div></div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SecurityControl({ icon, title, copy }: { icon: "settings" | "grid" | "sparkles" | "phone" | "link"; title: string; copy: string }) {
  return <div className="grid gap-4 border-b border-white/12 py-6 last:border-b-0 sm:grid-cols-[48px_1fr] sm:items-start"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-[#e2c66d]"><Icon name={icon} className="h-5 w-5" /></span><div><h3 className="text-base font-bold">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{copy}</p></div></div>;
}
