"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Icon } from "@/components/icons";

const steps = [
  {
    title: "Check readiness",
    owner: "Customer",
    icon: "help-circle" as const,
    outcome: "10 minute check",
    customer: "Keep one business email, company details, website or social page, and the WhatsApp number you want to use.",
    aifrogi: "Checks the setup path before asking for documents, so the first call does not become a guessing exercise.",
    meta: "No Meta action yet. This stage confirms whether you are ready to start Meta onboarding."
  },
  {
    title: "Validate business",
    owner: "Customer + AiFrogi",
    icon: "file-text" as const,
    outcome: "Same day review",
    customer: "Share legal business name, address, GST or trade licence details, owner contact, and website or social proof.",
    aifrogi: "Reviews the information, highlights mismatch risk, and shows what is ready or missing before Meta submission.",
    meta: "May request business verification depending on account history, country, category, and display-name confidence."
  },
  {
    title: "Prepare SIM",
    owner: "Customer",
    icon: "smartphone" as const,
    outcome: "OTP ready",
    customer: <>Use a number that can receive <strong>OTP or voice</strong>. If it is already on WhatsApp App or Business App, it must be <strong>removed or migrated before API activation</strong>.</>,
    aifrogi: "Explains the safest number path before connection, including whether to use an existing number or a fresh SIM.",
    meta: <>Verifies the phone during the official connection flow. <strong>Without OTP or voice access, onboarding stops here.</strong></>
  },
  {
    title: "Connect Meta",
    owner: "Customer + Meta",
    icon: "plug" as const,
    outcome: "30-60 minutes",
    customer: "Login to Meta, choose the business portfolio, accept permissions, and verify the WhatsApp number.",
    aifrogi: "Runs the guided connection, stores only approved API access, and shows live status for phone, webhook, token, and billing readiness.",
    meta: "Confirms the WhatsApp Business account, phone number, display name, and messaging permissions."
  },
  {
    title: "Set workflows",
    owner: "AiFrogi + Team",
    icon: "refresh-cw" as const,
    outcome: "1-2 days",
    customer: "Confirm what should happen first: enquiry reply, chatbot, reminders, payment collection, forms, reviews, or retargeting.",
    aifrogi: "Configures templates, inbox routing, automation rules, AI knowledge, and human handoff with visible progress.",
    meta: "Reviews outbound template messages where required. Inbound replies and service conversations can start once the number is live."
  },
  {
    title: "Test & go live",
    owner: "AiFrogi + Team",
    icon: "bar-chart-3" as const,
    outcome: "Live + monitored",
    customer: "Send test messages, approve the first workflow, invite agents, and confirm who handles exceptions.",
    aifrogi: "Monitors delivery, wallet risk, template status, automation health, failed recipients, and next actions in real time.",
    meta: "Continues to control quality rating, template approval, display name status, and messaging limits."
  }
] as const;

const prerequisites = [
  {
    title: "SIM must be available",
    copy: <>The WhatsApp number must receive <strong>OTP or voice</strong>. If it is already used in <strong>WhatsApp App or Business App</strong>, plan <strong>removal or migration before API activation</strong>.</>
  },
  {
    title: "Business proof must match",
    copy: <><strong>Legal name, address, GST/trade licence, website or social profile, and display name</strong> should tell the same story.</>
  },
  {
    title: "Meta timing is visible",
    copy: <>Simple setups can connect the same day. <strong>Business verification or template review can take longer</strong>, and AiFrogi shows exactly what is waiting.</>
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
          <p className="product-eyebrow">WhatsApp API onboarding</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Know what is needed before you start.</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">AiFrogi shows the exact prerequisites, who is responsible, and how long each step usually takes — no generic setup checklist.</p>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {prerequisites.map((item, index) => (
            <article key={item.title} className="rounded-xl border border-[#eadfed] bg-white p-5 shadow-[0_16px_45px_rgba(44,36,59,.05)]">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fde9fb] text-xs font-black text-[#c725ba]">{index + 1}</span>
                <h3 className="text-sm font-bold text-[#2c243b]">{item.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#70697d]">{item.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-[#e6dbe9] bg-white shadow-[0_24px_70px_rgba(44,36,59,.07)]">
          <div className="bg-[#2c243b] px-4 pb-7 pt-6 text-white sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-white/48">Realtime onboarding tracker</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-[#ff8af1]">Hover or tap for timing and responsibility</span>
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

            <div className="mt-5 grid gap-3 rounded-lg border border-[#eadfed] bg-[#fbf8fc] p-4 text-xs text-[#70697d] sm:grid-cols-3">
              <StatusNote label="Client sees" copy="Completed, missing, waiting on AiFrogi, waiting on Meta, and your next action." />
              <StatusNote label="Typical timing" copy={<>Fast cases can go live same day; <strong>verification, display-name, or template review may add 1-3+ days</strong>.</>} />
              <StatusNote label="No hidden blocker" copy={<><strong>SIM access, business proof, Meta approval, billing readiness, and test status</strong> stay visible.</>} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NarrativeLane({ label, number, copy, featured = false }: { label: string; number: string; copy: ReactNode; featured?: boolean }) {
  return <article className={`rounded-lg border p-5 ${featured ? "border-[#d92bcb]/35 bg-[#fff7fe]" : "border-[#eadfed] bg-[#fbf8fc]"}`}><div className="flex items-center justify-between gap-3"><strong className="text-xs text-[#2c243b]">{label}</strong><span className={`text-[10px] font-bold ${featured ? "text-[#c725ba]" : "text-[#a99ead]"}`}>{number}</span></div><p className="mt-4 text-sm leading-6 text-[#70697d]">{copy}</p></article>;
}

function StatusNote({ label, copy }: { label: string; copy: ReactNode }) {
  return <div><strong className="text-[#2c243b]">{label}</strong><p className="mt-1 leading-5">{copy}</p></div>;
}
