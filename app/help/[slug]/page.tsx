import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getHelpArticle, helpArticles } from "@/lib/help-center";
import { marketingMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const article = getHelpArticle(slug);
  return article ? marketingMetadata({ title: `${article.title} | AiFrogi Help`, description: article.summary, path: `/help/${slug}` }) : {};
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getHelpArticle((await params).slug);
  if (!article) notFound();
  return <main className="min-h-screen bg-white text-[var(--text)]">
    <SiteHeader />
    <header className="bg-[#2c243b] px-5 py-14 text-white sm:px-8 sm:py-20"><div className="mx-auto max-w-7xl"><Link href="/resources" className="text-xs font-bold uppercase tracking-[.12em] text-[#ff8af1]">← All resources</Link><p className="mt-8 text-sm font-semibold text-white/55">{article.category} · {article.minutes} minutes</p><h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">{article.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/62">{article.summary}</p></div></header>
    <article className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <div><div className="border-l-4 border-[#d92bcb] bg-[#fbf8fc] p-5"><strong className="text-sm">Successful outcome</strong><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{article.outcome}</p></div><ol className="mt-10 space-y-8">{article.steps.map((step, index) => <li key={step.title} className="grid grid-cols-[36px_1fr] gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary-strong)]">{index + 1}</span><div><h2 className="text-lg font-semibold">{step.title}</h2><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{step.body}</p></div></li>)}</ol></div>
        <aside className="h-fit border-t-2 border-[#d92bcb] bg-[#fbf8fc] p-5 lg:sticky lg:top-24"><h2 className="text-sm font-semibold">Before you finish</h2><ul className="mt-4 space-y-3">{article.checks.map((check) => <li key={check} className="flex gap-3 text-sm leading-5 text-[var(--text-muted)]"><span aria-hidden="true" className="text-[var(--success)]">✓</span>{check}</li>)}</ul><a href="mailto:info@aifrogi.com" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] px-4 text-sm font-semibold text-white">Contact support</a></aside>
      </div>
    </article>
    <SiteFooter />
  </main>;
}
