import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export function LegalPage({
  eyebrow,
  title,
  summary,
  children
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--warm-50)] text-[var(--ink-900)]">
      <SiteHeader />
      <div className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_30px_90px_rgba(16,16,16,0.1)]">
        <header className="bg-[linear-gradient(135deg,#101010,#404040_54%,#8a6a16)] px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--gold-300)]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">{summary}</p>
          <p className="mt-6 text-xs font-semibold text-white/52">Effective 2 July 2026</p>
        </header>

        <div className="legal-copy space-y-9 px-6 py-10 sm:px-10 sm:py-12">{children}</div>

        <footer className="flex flex-col gap-4 border-t border-black/8 bg-[var(--warm-25)] px-6 py-6 text-xs font-semibold text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>AiFrogi · Sovereign Business Bot</span>
          <nav className="flex flex-wrap gap-4">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
            <Link href="/data-deletion">Data deletion</Link>
          </nav>
        </footer>
      </article>
      </div>
      <SiteFooter />
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black tracking-tight text-[#404040]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[#52615b]">{children}</div>
    </section>
  );
}
