import type { Metadata } from "next";
import { LiveStatus } from "@/components/marketing/live-status";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Service Status | AiFrogi",
  description: "Check AiFrogi service reachability, support channels, priority handling, and third-party integration dependencies for your AI business automation.",
  path: "/status"
});

export default function StatusPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />
      <section className="bg-[#101010] px-5 py-16 text-white sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e2c66d]">Service status</p><h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Current health. Clear ownership.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">Check whether AiFrogi is reachable and see where to go when messaging or workflows need attention.</p></div></section>

      <section className="px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="product-eyebrow">Live check</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em]">Service availability now.</h2><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">This is a current reachability check, not a historical uptime report or contractual SLA.</p></div><LiveStatus /></div></section>

      <section className="border-y border-black/8 bg-[#fbfaf7] px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="product-eyebrow">Support commitment</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em]">The urgent issue reaches the right queue.</h2></div><div className="border-y border-black/10">{[
        ["Critical", "Live messaging or account access is stopped."],
        ["High", "A campaign, workflow, payment, or integration is blocking active work."],
        ["Normal", "Configuration, guidance, reporting, or a non-blocking question."]
      ].map(([priority, copy]) => <div key={priority} className="grid gap-2 border-b border-black/10 py-5 last:border-b-0 sm:grid-cols-[100px_1fr]"><strong>{priority}</strong><p className="text-sm text-[var(--text-muted)]">{copy}</p></div>)}<p className="border-t border-black/10 py-5 text-xs leading-5 text-[var(--text-muted)]">Support hours and response targets are confirmed in the customer&apos;s plan or service agreement. AiFrogi does not publish a universal response-time guarantee that may not apply to every plan.</p></div></div></section>

      <section className="px-5 py-16 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 bg-[#101010] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><h2 className="text-2xl font-semibold">Need help now?</h2><p className="mt-2 text-sm text-white/55">Include the workspace, expected result, actual result, and approximate time—never a password, OTP, or token.</p></div><a href="mailto:info@aifrogi.com?subject=AiFrogi%20support" className="inline-flex min-h-12 shrink-0 items-center justify-center bg-[#8a6a16] px-5 text-sm font-bold">Email support</a></div></section>
      <SiteFooter />
    </main>
  );
}
