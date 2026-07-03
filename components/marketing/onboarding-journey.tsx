"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const steps = [
  {
    title: "Create workspace",
    owner: "Customer",
    icon: "grid" as const,
    outcome: "Workspace ready",
    customer: "Add the business profile and confirm the workspace owner.",
    aifrogi: "Creates an isolated workspace with the right access boundaries.",
    meta: "No Meta action is needed at this stage."
  },
  {
    title: "Connect WhatsApp",
    owner: "Customer + Meta",
    icon: "plug" as const,
    outcome: "Number connected",
    customer: "Choose the business and WhatsApp number through Meta's secure flow.",
    aifrogi: "Guides embedded signup and checks every connection signal.",
    meta: "Confirms the approved business assets and permissions."
  },
  {
    title: "Approve knowledge",
    owner: "Customer",
    icon: "file-text" as const,
    outcome: "Knowledge approved",
    customer: "Review business content, instructions, and sensitive-topic rules.",
    aifrogi: "Maps answer coverage, finds gaps, and previews safe responses.",
    meta: "Credentials and private account access remain outside the knowledge layer."
  },
  {
    title: "Choose workflows",
    owner: "AiFrogi",
    icon: "refresh-cw" as const,
    outcome: "Automation ready",
    customer: "Select goals such as qualification, reminders, sales, or support.",
    aifrogi: "Builds the triggers, decisions, messages, and human handoffs.",
    meta: "Reviews message templates when an outbound workflow requires one."
  },
  {
    title: "Test safely",
    owner: "Team",
    icon: "sparkles" as const,
    outcome: "Checklist green",
    customer: "Run real scenarios and confirm the expected customer experience.",
    aifrogi: "Shows every decision, delivery event, exception, and handoff.",
    meta: "Delivers test traffic through the official WhatsApp channel."
  },
  {
    title: "Go live",
    owner: "AiFrogi + Team",
    icon: "bar-chart-3" as const,
    outcome: "Monitored operations",
    customer: "Invite agents, approve launch, and own daily conversations.",
    aifrogi: "Monitors delivery, automation health, usage, and next actions.",
    meta: "Keeps official messaging and template status continuously available."
  }
] as const;

export function OnboardingJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];
  const progress = activeIndex / (steps.length - 1) * 100;

  return (
    <section className="border-b border-[#eee6f0] bg-[#fbf8fc] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="product-eyebrow">Predictive onboarding</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One clear step at a time.</h2>
          <p className="mt-4 text-sm text-[var(--text-muted)]">Follow the journey from first setup to monitored go-live.</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-[#e6dbe9] bg-white shadow-[0_24px_70px_rgba(44,36,59,.07)]">
          <div className="bg-[#2c243b] px-4 pb-7 pt-6 text-white sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-white/48">Customer activation journey</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-[#ff8af1]">Hover or tap each stage</span>
            </div>

            <div className="mt-7 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div role="tablist" aria-label="AiFrogi onboarding journey" className="relative grid min-w-[850px] grid-cols-6 gap-3 px-3 pt-3">
                <div className="absolute left-[8.5%] right-[8.5%] top-[34px] h-px bg-white/12" aria-hidden="true"/>
                <div className="absolute left-[8.5%] top-[34px] h-px bg-[#d92bcb] transition-[width] duration-500 ease-out" style={{width:`${progress * .83}%`}} aria-hidden="true"/>
                {steps.map((step, index) => {
                  const selected = index === activeIndex;
                  const complete = index < activeIndex;
                  return <button key={step.title} type="button" role="tab" aria-label={step.title} aria-selected={selected} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onClick={() => setActiveIndex(index)} className="group relative flex flex-col items-center text-center">
                    <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border transition-all duration-300 ${selected ? "scale-110 border-[#ff8af1] bg-[#d92bcb] text-white shadow-[0_0_0_7px_rgba(217,43,203,.12),0_0_25px_rgba(217,43,203,.35)]" : complete ? "border-[#d92bcb] bg-[#4b3152] text-[#ff8af1]" : "border-white/15 bg-[#342a42] text-white/38 group-hover:border-white/30 group-hover:text-white/75"}`}><Icon name={complete ? "arrow-right" : step.icon}/></span>
                    <span className={`mt-4 text-[11px] font-semibold transition ${selected ? "text-white" : "text-white/48 group-hover:text-white/75"}`}>{step.title}</span>
                    <span className={`mt-1 text-[9px] transition ${selected ? "text-[#ff8af1]" : "text-white/25"}`}>{step.owner}</span>
                  </button>;
                })}
              </div>
            </div>
          </div>

          <div key={active.title} className="feature-showcase-reveal p-5 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-[#eee6f0] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-lg bg-[#fde9fb] text-[#a21c98]"><Icon name={active.icon}/></span><div><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#c725ba]">Stage {String(activeIndex + 1).padStart(2,"0")}</span><h3 className="mt-1 text-xl font-semibold text-[#2c243b]">{active.title}</h3></div></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f3edf5] px-3 py-1.5 text-xs font-semibold text-[#655b70]"><i className="h-1.5 w-1.5 rounded-full bg-[#d92bcb]"/>{active.outcome}</span>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <NarrativeLane label="What you do" number="01" copy={active.customer}/>
              <NarrativeLane label="What AiFrogi does" number="02" copy={active.aifrogi} featured/>
              <NarrativeLane label="What Meta confirms" number="03" copy={active.meta}/>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#817789]"><span className="text-[#c725ba]">Always visible:</span><span>Completed</span><i className="h-1 w-1 rounded-full bg-[#d4c8d8]"/><span>Waiting on AiFrogi</span><i className="h-1 w-1 rounded-full bg-[#d4c8d8]"/><span>Waiting on Meta</span><i className="h-1 w-1 rounded-full bg-[#d4c8d8]"/><span>Your next action</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NarrativeLane({ label, number, copy, featured = false }: { label: string; number: string; copy: string; featured?: boolean }) {
  return <article className={`rounded-lg border p-5 ${featured ? "border-[#d92bcb]/35 bg-[#fff7fe]" : "border-[#eadfed] bg-[#fbf8fc]"}`}><div className="flex items-center justify-between gap-3"><strong className="text-xs text-[#2c243b]">{label}</strong><span className={`text-[10px] font-bold ${featured ? "text-[#c725ba]" : "text-[#a99ead]"}`}>{number}</span></div><p className="mt-4 text-sm leading-6 text-[#70697d]">{copy}</p></article>;
}
