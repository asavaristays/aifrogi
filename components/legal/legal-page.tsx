import Link from "next/link";
import type { ReactNode } from "react";

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
    <main className="min-h-screen bg-[linear-gradient(145deg,#eefaf3_0%,#ffffff_48%,#edf7f5_100%)] px-4 py-10 text-[#14241f] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,61,53,0.12)]">
        <header className="bg-[linear-gradient(135deg,#2c243b,#493b62_54%,#c725ba)] px-6 py-10 text-white sm:px-10 sm:py-14">
          <Link href="/" className="text-sm font-black tracking-tight">AiFrogi</Link>
          <p className="mt-8 text-[11px] font-black uppercase tracking-[0.24em] text-[#86efac]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">{summary}</p>
          <p className="mt-6 text-xs font-semibold text-white/52">Effective 2 July 2026</p>
        </header>

        <div className="legal-copy space-y-9 px-6 py-10 sm:px-10 sm:py-12">{children}</div>

        <footer className="flex flex-col gap-4 border-t border-black/5 bg-[#f4faf7] px-6 py-6 text-xs font-semibold text-[#52615b] sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>AiFrogi · WhatsApp Business Platform</span>
          <nav className="flex flex-wrap gap-4">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
            <Link href="/data-deletion">Data deletion</Link>
          </nav>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black tracking-tight text-[#493b62]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[#52615b]">{children}</div>
    </section>
  );
}
