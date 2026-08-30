"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { AnimatedBotPhone } from "@/components/marketing/animated-bot-phone";

export type ProductStoryStage = { label: string; detail: string };

export function AIProductHero({
  name,
  category,
  headline,
  copy,
  stages
}: {
  name: string;
  category: string;
  headline: string;
  copy: string;
  stages: ProductStoryStage[];
}) {
  const [activeStage, setActiveStage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveStage((stage) => (stage + 1) % stages.length), 2400);
    return () => window.clearInterval(timer);
  }, [stages.length]);

  function beginOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const query = new URLSearchParams({
      source: `product-${name.toLowerCase().replace(/\s+/g, "-")}`,
      bot: name,
      business: String(values.get("business") || ""),
      website: String(values.get("website") || ""),
      contact: String(values.get("contact") || "")
    });
    window.location.assign(`https://app.aifrogi.com/register?${query.toString()}`);
  }

  const usesJourneyHero = ["BusinessGPT", "HotelGPT", "ClinicGPT", "DineGPT", "eduGPT", "PropertyGPT", "FlowCart", "Custom Business Bot"].includes(name);

  if (usesJourneyHero) {
    return (
      <section className="relative overflow-hidden bg-black text-white">
        <div className="px-5 pb-8 pt-9 sm:px-8 sm:pt-12 lg:hidden">
          <p className="product-eyebrow text-[var(--gold-300)]">{category} · Sovereign Business Bot</p>
          <h1 className="mt-3 text-5xl font-semibold leading-[.98] tracking-[-.05em] sm:text-6xl">{name}</h1>
          <h2 className="mt-4 max-w-xl text-[1.65rem] font-medium leading-[1.12] text-white/92">{headline}</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/62">{copy}</p>
          <button type="button" onClick={() => setFormOpen(true)} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-white">Build my {name} <Icon name="arrow-right" /></button>
        </div>

        <div className="relative mx-auto w-full max-w-[1600px]">
          <AnimatedBotPhone botName={name} />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[48%] bg-gradient-to-r from-black via-black/94 to-transparent lg:block" aria-hidden="true" />
          <div className="absolute inset-y-0 left-[max(2rem,calc((100%-80rem)/2))] z-10 hidden w-[44%] flex-col justify-center lg:flex">
            <p className="product-eyebrow text-[var(--gold-300)]">{category} · Sovereign Business Bot</p>
            <h1 className="mt-4 text-6xl font-semibold leading-[.98] tracking-[-.05em] xl:text-7xl">{name}</h1>
            <h2 className="mt-5 max-w-xl text-3xl font-medium leading-tight text-white/92 xl:text-4xl">{headline}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62 xl:text-lg">{copy}</p>
            <div className="mt-6 max-w-xl border-y border-white/14 py-4" aria-live="polite">
              <div key={`${name}-${activeStage}`} className="hero-bot-name grid gap-1 xl:grid-cols-[150px_1fr] xl:items-center">
                <span className="text-xs font-bold uppercase tracking-[.13em] text-[var(--gold-300)]">{stages[activeStage].label}</span>
                <span className="text-sm text-white/82 xl:text-base">{stages[activeStage].detail}</span>
              </div>
            </div>
            <button type="button" onClick={() => setFormOpen(true)} className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--gold-500)]">Build my {name} <Icon name="arrow-right" /></button>
          </div>
        </div>

        {formOpen ? (
          <form onSubmit={beginOnboarding} className="mx-auto max-w-7xl border-t border-white/14 px-5 py-6 sm:px-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="business" required placeholder="Business name" className="min-h-12 rounded-md border border-white/15 bg-white/7 px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-[var(--gold-300)]/70" />
              <input name="website" type="url" placeholder="Website" className="min-h-12 rounded-md border border-white/15 bg-white/7 px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-[var(--gold-300)]/70" />
              <input name="contact" required placeholder="Work email or mobile" className="min-h-12 rounded-md border border-white/15 bg-white/7 px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-[var(--gold-300)]/70" />
            </div>
            <button type="submit" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--gold-600)] px-5 text-sm font-bold text-white">Continue onboarding <Icon name="arrow-right" /></button>
          </form>
        ) : null}
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-black px-5 py-14 text-white sm:px-8 sm:py-20">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.06fr_.94fr] lg:gap-4">
        <div className="relative z-10">
          <p className="product-eyebrow text-[var(--gold-300)]">{category} · Sovereign Business Bot</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.05em] sm:text-7xl">{name}</h1>
          <h2 className="mt-5 max-w-3xl text-2xl font-medium leading-tight text-white/90 sm:text-4xl">{headline}</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">{copy}</p>

          <div className="mt-7 min-h-20 border-y border-white/14 py-4" aria-live="polite">
            <div key={`${name}-${activeStage}`} className="hero-bot-name grid gap-1 sm:grid-cols-[150px_1fr] sm:items-center">
              <span className="text-xs font-bold uppercase tracking-[.13em] text-[var(--gold-300)]">{stages[activeStage].label}</span>
              <span className="text-base text-white/82">{stages[activeStage].detail}</span>
            </div>
          </div>

          {!formOpen ? (
            <button type="button" onClick={() => setFormOpen(true)} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-[var(--ink-600)] transition hover:-translate-y-0.5 hover:bg-[var(--gold-500)]">
              Build my {name} <Icon name="arrow-right" />
            </button>
          ) : (
            <form onSubmit={beginOnboarding} className="mt-8 max-w-2xl border-y border-white/14 py-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <input name="business" required placeholder="Business name" className="min-h-12 rounded-md border border-white/15 bg-white/7 px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-[var(--gold-300)]/70" />
                <input name="website" type="url" placeholder="Website" className="min-h-12 rounded-md border border-white/15 bg-white/7 px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-[var(--gold-300)]/70" />
                <input name="contact" required placeholder="Work email or mobile" className="min-h-12 rounded-md border border-white/15 bg-white/7 px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-[var(--gold-300)]/70" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--gold-600)] px-5 text-sm font-bold text-[var(--ink-600)]">Continue onboarding <Icon name="arrow-right" /></button>
                <span className="text-xs text-white/38">Business-controlled knowledge · Human oversight</span>
              </div>
            </form>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-[500px]" aria-label={`${name} product story`}>
          <div className="hero-bot-float relative aspect-[1122/1402]">
            <Image src="/brand/aifrogi-sovereign-bot.png" alt={`AiFrogi mascot demonstrating ${name}`} fill priority sizes="(max-width: 1024px) 430px, 500px" className="object-contain [mask-image:radial-gradient(ellipse_76%_72%_at_50%_48%,black_54%,transparent_100%)]" />
            <span className="hero-bot-eye hero-bot-eye-left" aria-hidden="true" />
            <span className="hero-bot-eye hero-bot-eye-right" aria-hidden="true" />
            <span className="hero-bot-blink hero-bot-blink-left" aria-hidden="true" />
            <span className="hero-bot-blink hero-bot-blink-right" aria-hidden="true" />
            <div className="absolute bottom-[5%] left-1/2 w-[86%] -translate-x-1/2 text-center" aria-hidden="true">
              <div key={`signal-${activeStage}`} className="hero-bot-name inline-flex items-center gap-2 rounded-full border border-[var(--gold-300)]/30 bg-black/70 px-4 py-2 text-xs text-[var(--gold-100)] shadow-[0_0_28px_rgba(138,106,22,.24)] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-300)] shadow-[0_0_10px_var(--gold-300)]" />
                {stages[activeStage].detail}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
