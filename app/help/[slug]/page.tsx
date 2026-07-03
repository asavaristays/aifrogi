import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpArticle, helpArticles } from "@/lib/help-center";

export function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getHelpArticle((await params).slug);
  return article ? { title: `${article.title} | AiFrogi Help`, description: article.summary } : {};
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getHelpArticle((await params).slug);
  if (!article) notFound();
  return <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
    <header className="border-b border-[var(--border)] bg-white px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-5xl items-center justify-between gap-5"><Link href="/" aria-label="AiFrogi home"><Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[150px]" /></Link><Link href="/help" className="text-sm font-semibold text-[var(--primary-strong)]">All guides</Link></div></header>
    <article className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <div><p className="text-sm font-semibold text-[var(--primary-strong)]">{article.category} · {article.minutes} minutes</p><h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{article.title}</h1><p className="mt-5 text-lg leading-8 text-[var(--text-muted)]">{article.summary}</p><div className="mt-8 rounded-lg border border-[#e8ddeb] bg-[#fffaff] p-5"><strong className="text-sm">Successful outcome</strong><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{article.outcome}</p></div><ol className="mt-10 space-y-8">{article.steps.map((step, index) => <li key={step.title} className="grid grid-cols-[36px_1fr] gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary-strong)]">{index + 1}</span><div><h2 className="text-lg font-semibold">{step.title}</h2><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{step.body}</p></div></li>)}</ol></div>
        <aside className="h-fit rounded-lg border border-[var(--border)] bg-white p-5 lg:sticky lg:top-8"><h2 className="text-sm font-semibold">Before you finish</h2><ul className="mt-4 space-y-3">{article.checks.map((check) => <li key={check} className="flex gap-3 text-sm leading-5 text-[var(--text-muted)]"><span aria-hidden="true" className="text-[var(--success)]">✓</span>{check}</li>)}</ul><a href="mailto:info@aifrogi.com" className="mt-6 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] px-4 text-sm font-semibold text-white">Contact support</a></aside>
      </div>
    </article>
  </main>;
}
