"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const pingBookSteps = [
  { type: "customer", copy: "I need a dental appointment on Friday." },
  { type: "typing", copy: "PingBook is checking approved booking rules" },
  { type: "assistant", copy: "Certainly. I’ll check the clinic’s available times for Friday." },
  { type: "system", copy: "Reading connected calendar" },
  { type: "assistant", copy: "Available: 11:00 AM, 2:30 PM or 4:30 PM." },
  { type: "customer", copy: "4:30 PM works for me." },
  { type: "system", copy: "Creating and verifying appointment" },
  { type: "confirmed", copy: "Appointment confirmed · PB-2048" }
] as const;

const stepDelay = 2300;

export function AnimatedBotPhone({ botName = "PingBook" }: { botName?: string }) {
  const [step, setStep] = useState(2);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delay = step === pingBookSteps.length - 1 ? 4400 : stepDelay;
    const timer = window.setTimeout(
      () => setStep((current) => (current === pingBookSteps.length - 1 ? 2 : current + 1)),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation) return;
    conversation.scrollTo({ top: conversation.scrollHeight, behavior: step > 2 ? "smooth" : "auto" });
  }, [step]);

  const visibleSteps = pingBookSteps.slice(0, step + 1);

  return (
    <div
      className="relative aspect-[2/1] w-full overflow-hidden bg-black"
      aria-label={`${botName} live appointment journey`}
    >
      <Image src="/media/ai-bot-phone-stage-v1.jpg" alt="Black and antique-gold phone stage for an AiFrogi business bot" fill priority sizes="(max-width: 1024px) 100vw, 760px" className="object-contain" />

      <div className="absolute left-[55.3%] top-[8%] flex h-[79%] w-[18.7%] flex-col overflow-hidden rounded-[8%] bg-black/96 px-[1.2%] pb-[1.3%] pt-[1.5%] shadow-[inset_0_0_0_1px_rgba(226,198,109,.12)]">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gold-600)] text-[clamp(9px,.75vw,11px)] font-bold text-white">PB</span>
          <span className="min-w-0"><strong className="block truncate text-[clamp(11px,.9vw,14px)] leading-none text-white">{botName}</strong><small className="mt-1 flex items-center gap-1 text-[clamp(8px,.64vw,10px)] text-white/50"><i className="h-1 w-1 rounded-full bg-[#36c997]" />Online</small></span>
        </div>

        <div ref={conversationRef} className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-live="polite">
          <div className="bot-phone-scroll flex min-h-full flex-col justify-start gap-2 pb-1">
            {visibleSteps.map((item, index) => <PhoneEvent key={`${step}-${index}-${item.copy}`} type={item.type} copy={item.copy} />)}
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between rounded-full bg-white/[.055] px-2 py-1 text-[clamp(5px,.5vw,7px)] text-white/30">
          <span>Type a message…</span><span className="text-[var(--gold-300)]">➤</span>
        </div>
      </div>

    </div>
  );
}

function PhoneEvent({ type, copy }: { type: typeof pingBookSteps[number]["type"]; copy: string }) {
  if (type === "typing") return <div className="mr-auto rounded-md bg-white/[.07] px-2 py-1.5"><span className="sr-only">{copy}</span><span className="flex gap-1" aria-hidden="true"><i className="bot-typing-dot h-1 w-1 rounded-full bg-white/55" /><i className="bot-typing-dot h-1 w-1 rounded-full bg-white/55 [animation-delay:.18s]" /><i className="bot-typing-dot h-1 w-1 rounded-full bg-white/55 [animation-delay:.36s]" /></span></div>;
  if (type === "system") return <div className="rounded-md border border-[var(--gold-300)]/18 bg-[var(--gold-600)]/10 px-2 py-1.5 text-center text-[clamp(9px,.72vw,11px)] font-semibold leading-[1.3] text-[var(--gold-100)]">{copy}</div>;
  if (type === "confirmed") return <div className="rounded-md border border-[#36c997]/28 bg-[#36c997]/10 px-2 py-2 text-[clamp(10px,.84vw,13px)] font-semibold leading-[1.3] text-[#9be7cc]">✓ {copy}</div>;
  return <div className={`max-w-[92%] rounded-md px-2.5 py-2 text-[clamp(10px,.84vw,13px)] leading-[1.35] ${type === "customer" ? "ml-auto bg-[var(--gold-600)]/22 text-white" : "mr-auto bg-white/[.075] text-white/88"}`}>{copy}</div>;
}
