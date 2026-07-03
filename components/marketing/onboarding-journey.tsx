"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Icon } from "@/components/icons";

const stages = [
  {
    badge: "Before Meta",
    title: "Prepare",
    time: "10 min",
    icon: "smartphone" as const,
    headline: <>SIM + proof ready</>,
    customer: <>SIM receives <strong>OTP/voice</strong>. Business proof matches display name.</>,
    aifrogi: "We check readiness and mismatch risk.",
    note: <>Already on WhatsApp App? <strong>Remove or migrate first.</strong></>
  },
  {
    badge: "Meta gate",
    title: "Meta approval",
    time: "Meta time",
    icon: "plug" as const,
    headline: <>Meta approves number</>,
    customer: "You approve Meta permissions.",
    aifrogi: "We handhold the flow and track status.",
    note: <>Business, display-name, or template review can add time.</>
  },
  {
    badge: "After approval",
    title: "API activation",
    time: "30-60 min",
    icon: "settings" as const,
    headline: <>Connect + test</>,
    customer: "No technical work from your side.",
    aifrogi: "API, webhook, token, billing, and test messages.",
    note: <>Number approval is <strong>not</strong> final launch.</>
  },
  {
    badge: "First launch",
    title: "Go live",
    time: "1-2 days",
    icon: "bar-chart-3" as const,
    headline: <>First workflow live</>,
    customer: "Choose the first use case.",
    aifrogi: "Chatbot, campaign, reminder, payment, form, review, or handoff.",
    note: <>AiFrogi monitors failures and next actions.</>
  }
] as const;

export function OnboardingJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = stages[activeIndex];

  return (
    <section className="border-b border-[#eee6f0] bg-[#fbf8fc] px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="product-eyebrow">Meta Tech Provider guided setup</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">We handhold your WhatsApp API onboarding.</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">One glance: what you need, what Meta approves, and what happens after approval.</p>
        </div>

        <div className="mt-9 overflow-hidden rounded-2xl border border-[#e6dbe9] bg-[#2c243b] text-white shadow-[0_24px_70px_rgba(44,36,59,.12)]">
          <div className="grid gap-px bg-white/8 lg:grid-cols-3">
            <CriticalStrip label="You bring" copy={<><strong>OTP/voice SIM</strong> + matching business proof</>} />
            <CriticalStrip label="Meta approves" copy={<>Business / number / display name</>} />
            <CriticalStrip label="After approval" copy={<><strong>API 30-60 min</strong> → workflow <strong>1-2 days</strong></>} />
          </div>

          <div className="p-4 sm:p-7">
            <div className="grid auto-cols-[230px] grid-flow-col gap-3 overflow-x-auto pb-2 [scrollbar-width:none] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {stages.map((stage, index) => {
                const selected = index === activeIndex;
                return (
                  <button
                    key={stage.title}
                    type="button"
                    aria-label={stage.title}
                    aria-pressed={selected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    className={`group relative overflow-hidden rounded-xl border p-4 text-left transition duration-300 ${
                      selected
                        ? "border-[#ff8af1] bg-white text-[#2c243b] shadow-[0_18px_45px_rgba(217,43,203,.22)]"
                        : "border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/8"
                    }`}
                  >
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] ${selected ? "bg-[#fde9fb] text-[#b923ae]" : "bg-white/8 text-white/45"}`}>
                      {stage.badge}
                    </span>
                    <div className="mt-5 flex items-center gap-3">
                      <span className={`grid h-12 w-12 place-items-center rounded-full ${selected ? "bg-[#d92bcb] text-white" : "bg-[#342a42] text-[#ff8af1]"}`}>
                        <Icon name={stage.icon} className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-black">{stage.title}</h3>
                        <p className={`mt-1 text-xs font-bold ${selected ? "text-[#b923ae]" : "text-white/48"}`}>{stage.time}</p>
                      </div>
                    </div>
                    <p className={`mt-5 text-sm font-semibold leading-6 ${selected ? "text-[#4f4658]" : "text-white/62"}`}>{stage.headline}</p>
                    {index < stages.length - 1 ? <span className={`absolute right-4 top-1/2 hidden -translate-y-1/2 text-xl lg:block ${selected ? "text-[#d92bcb]" : "text-white/22"}`}>→</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div key={active.title} className="feature-showcase-reveal mt-5 rounded-2xl border border-[#eadfed] bg-white p-4 shadow-[0_16px_45px_rgba(44,36,59,.06)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
            <InfoBlock label="Client action" copy={active.customer} />
            <InfoBlock label="AiFrogi handhold" copy={active.aifrogi} highlighted />
            <InfoBlock label="Critical note" copy={active.note} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CriticalStrip({ label, copy }: { label: string; copy: ReactNode }) {
  return (
    <div className="bg-[#2c243b] p-4">
      <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#ff8af1]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/82">{copy}</p>
    </div>
  );
}

function InfoBlock({ label, copy, highlighted = false }: { label: string; copy: ReactNode; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlighted ? "border-[#d92bcb]/35 bg-[#fff7fe]" : "border-[#eadfed] bg-[#fbf8fc]"}`}>
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#c725ba]">{label}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-[#5f5668]">{copy}</p>
    </div>
  );
}
