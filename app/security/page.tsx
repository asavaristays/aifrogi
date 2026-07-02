import Link from "next/link";

const controls = [
  ["Access", "Role-based workspaces, signed sessions, and server-side authorization protect customer operations."],
  ["Credentials", "WhatsApp access tokens and registration secrets are encrypted at rest and never displayed to clients."],
  ["Transport", "Production traffic uses HTTPS. Meta webhooks are verified before message data is processed."],
  ["Data boundaries", "Organizations and workspaces scope contacts, messages, documents, campaigns, and configuration."],
  ["AI controls", "Approved knowledge, explicit tools, confidence fallback, opt-out handling, and human handoff bound automated replies."],
  ["Operations", "Delivery status, activity history, campaign recipients, support cases, and connection health provide an audit trail."]
];

export default function SecurityPage() {
  return <main className="min-h-screen bg-[#f5f7f6] text-[#18211e]"><header className="bg-[#241b31] px-5 py-16 text-white sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm font-bold text-white/65">AiFrogi</Link><p className="mt-12 text-xs font-bold uppercase tracking-[0.12em] text-[#ff8af1]">Trust center</p><h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Security that stays understandable.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/70">AiFrogi protects business messaging while keeping customers in control of their Meta account, data, users, and automation boundaries.</p></div></header><div className="mx-auto max-w-5xl px-5 py-14 sm:px-8"><section className="grid gap-px overflow-hidden rounded-lg border border-black/8 bg-black/8 md:grid-cols-2">{controls.map(([title,copy]) => <article key={title} className="bg-white p-6"><h2 className="text-lg font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</section><section className="mt-8 rounded-lg border border-black/8 bg-white p-6"><h2 className="text-xl font-bold">Shared responsibility</h2><p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">webtechnosys secures and operates AiFrogi. Customers remain responsible for lawful contact collection, WhatsApp opt-in, approved content, user access, Meta billing, and the accuracy of business information. Meta independently operates WhatsApp Business Platform and may apply policy, quality, template, or billing restrictions.</p></section><div className="mt-8 flex flex-wrap gap-4 text-sm font-bold text-[#b923ae]"><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-of-service">Terms of service</Link><Link href="/data-deletion">Data deletion</Link><a href="mailto:info@aifrogi.com">Report a security concern</a></div></div></main>;
}
