import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { botProducts, getBotProduct } from "@/lib/bot-products";
import { marketingMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return botProducts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getBotProduct((await params).slug);
  if (!product) return {};
  return marketingMetadata({
    title: `${product.name} | ${product.category} AI Business Bot | AiFrogi`,
    description: product.description,
    path: `/solutions/${product.slug}`
  });
}

export default async function BotProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getBotProduct((await params).slug);
  if (!product) notFound();
  const registerUrl = `https://app.aifrogi.com/register?source=${product.slug}`;

  return (
    <main className="bg-white text-[var(--ink-900)]">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[var(--ink-950)] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:72px_72px]" aria-hidden="true" />
        <div className="absolute right-[8%] top-[10%] h-80 w-80 rounded-full bg-[var(--gold-600)]/20 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.12fr_.88fr]">
          <div>
            <p className="product-eyebrow text-[var(--gold-300)]">{product.category} · Sovereign Business Bot</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-7xl">{product.name}</h1>
            <h2 className="mt-5 max-w-4xl text-2xl font-medium leading-tight text-white/88 sm:text-4xl">{product.headline}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/62">{product.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-[var(--ink-600)] transition hover:bg-[var(--gold-500)]">Start {product.name} onboarding <Icon name="arrow-right" /></a>
              <a href="#intelligence" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10">View intelligence design</a>
            </div>
          </div>
          <div className="hero-bot-float relative mx-auto aspect-[1122/1402] w-full max-w-[430px]" aria-hidden="true">
            <div className="absolute inset-[15%] rounded-full bg-[var(--gold-600)]/20 blur-[70px]" />
            <Image src="/brand/aifrogi-sovereign-bot.png" alt="" fill priority sizes="(max-width: 1024px) 430px, 500px" className="object-contain" />
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-[var(--warm-25)] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="product-eyebrow">Primary outcome</p>
          <h2 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">{product.outcome}</h2>
          <div className="mt-12 grid border-y border-black/12 md:grid-cols-3">
            {product.audiences.map((audience, index) => <div key={audience} className="flex min-h-36 items-center gap-4 border-b border-black/12 py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"><span className="font-mono text-xs text-[var(--gold-600)]">0{index + 1}</span><p className="text-xl font-medium tracking-[-.02em]">{audience}</p></div>)}
          </div>
        </div>
      </section>

      <section id="intelligence" className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <p className="product-eyebrow">Approved capabilities</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">What this bot can be authorised to do.</h2>
            <p className="mt-6 text-base leading-7 text-[var(--text-muted)]">Authority is explicit. The bot answers, qualifies, recommends or requests approval only within the operating boundaries chosen during onboarding.</p>
          </div>
          <div>
            <div className="border-t border-black/14">{product.capabilities.map((item, index) => <div key={item} className="grid grid-cols-[42px_1fr] items-center border-b border-black/14 py-6"><span className="font-mono text-xs text-[var(--gold-600)]">0{index + 1}</span><span className="text-xl font-medium tracking-[-.02em]">{item}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--warm-25)] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="product-eyebrow">Sovereign intelligence</p><h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">Knowledge your business owns and controls.</h2></div><p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)]">Every answer is grounded in approved first-party sources. New information is reviewed, traceable and replaceable without surrendering the business memory.</p></div>
          <div className="mt-14 border-t border-black/14">{product.knowledge.map((item, index) => <div key={item} className="grid gap-3 border-b border-black/14 py-7 sm:grid-cols-[72px_1fr_auto] sm:items-center"><span className="font-mono text-xs text-[var(--gold-600)]">SOURCE 0{index + 1}</span><span className="text-2xl font-medium tracking-[-.025em]">{item}</span><span className="text-xs uppercase tracking-[.12em] text-[var(--text-muted)]">Business controlled</span></div>)}</div>
        </div>
      </section>

      <section className="bg-[var(--ink-950)] px-5 py-16 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="product-eyebrow text-[var(--gold-300)]">Controlled deployment</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Start with one outcome. Prove it end to end.</h2></div>
          <a href={registerUrl} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-[var(--ink-600)]">Plan {product.name} <Icon name="arrow-right" /></a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
