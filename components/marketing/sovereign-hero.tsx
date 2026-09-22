"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { HeroVideo } from "./hero-video";

const botNames = ["HotelGPT", "ClinicGPT", "DineGPT", "eduGPT", "PropertyGPT", "BusinessGPT", "FlowCart"];

export function SovereignHero({ registerUrl }: { registerUrl: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % botNames.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.12fr_.88fr] lg:gap-5">
      <div className="relative z-10 text-center lg:text-left">
        <h1 className="font-semibold leading-[1.04] tracking-[-0.045em]">
          <span className="block text-3xl sm:text-4xl lg:text-5xl">Give your business…</span>
          <span className="mt-3 block text-4xl sm:mt-4 sm:text-5xl lg:text-[3.7rem]">Intelligent AI Bot that turns conversations into action.</span>
        </h1>

        <div className="mt-6 flex min-h-12 items-center justify-center gap-3 text-sm lg:justify-start" aria-live="polite">
          <span className="text-white/45">Built for</span>
          <span key={botNames[activeIndex]} className="hero-bot-name text-lg font-semibold text-[var(--gold-300)] sm:text-xl">{botNames[activeIndex]}</span>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/62 sm:text-lg lg:mx-0">One sovereign intelligence system, configured for the way your business answers, qualifies, recommends and acts.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          <a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--gold-600)] px-6 text-sm font-bold text-[var(--ink-600)] shadow-[0_12px_34px_rgba(138,106,22,.24)] transition hover:-translate-y-0.5 hover:bg-[var(--gold-500)]">Start 15-day trial <Icon name="arrow-right" /></a>
          <Link href="/solutions" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white/76 transition hover:border-[var(--gold-300)]/45 hover:bg-white/10 hover:text-white">Explore business bots</Link>
        </div>
      </div>

      <HeroVideo />
    </div>
  );
}
