import Image from "next/image";

export function AnimatedBotPhone({ botName = "PingBook" }: { botName?: string }) {
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden bg-black" aria-label={`${botName} verified appointment conversation`}>
      <Image src="/media/ai-bot-phone-stage-v2.png" alt="Black and antique-gold phone frame for an AiFrogi business bot" fill priority sizes="100vw" className="object-contain" />

      <div className="absolute left-[52.55%] top-[5.7%] flex h-[87.5%] w-[22.1%] flex-col overflow-hidden rounded-[9%] bg-black px-[1.25%] pb-[1.35%] pt-[1.5%] shadow-[inset_0_0_0_1px_rgba(226,198,109,.12)]">
        <header className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold-600)] text-[clamp(9px,.72vw,12px)] font-semibold text-white">PB</span>
          <span className="min-w-0">
            <strong className="block truncate text-[clamp(11px,.88vw,15px)] font-semibold leading-none text-white">{botName}</strong>
            <small className="mt-1 flex items-center gap-1 text-[clamp(8px,.58vw,10px)] text-white/55"><i className="h-1.5 w-1.5 rounded-full bg-[#36c997]" />Ready to help</small>
          </span>
        </header>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <p className="text-[clamp(8px,.58vw,10px)] font-semibold uppercase tracking-[.12em] text-[var(--gold-300)]">Appointment request</p>
          <Message side="customer">I need a dental appointment this Friday afternoon.</Message>
          <Message>Of course. I’ve checked the clinic’s approved booking rules and live calendar.</Message>
          <div className="grid grid-cols-3 gap-1.5" aria-label="Available appointment times">
            <TimeSlot>2:30 PM</TimeSlot>
            <TimeSlot selected>4:30 PM</TimeSlot>
            <TimeSlot>5:15 PM</TimeSlot>
          </div>
          <Message side="customer">Please book 4:30 PM.</Message>
          <div className="rounded-lg border border-[#36c997]/35 bg-[#36c997]/10 px-2.5 py-2.5 text-[clamp(9px,.73vw,12px)] leading-[1.35] text-[#a9ead4]">
            <strong className="block font-semibold text-[#c3f4e3]">✓ Appointment confirmed</strong>
            Friday · 4:30 PM · Ref PB-2048
          </div>

          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="mb-2 text-[clamp(8px,.58vw,10px)] font-semibold uppercase tracking-[.12em] text-[var(--gold-300)]">Next steps handled</p>
            <div className="grid gap-1.5">
              <OutcomeRow icon="✓" title="Confirmation delivered" detail="Customer and clinic informed" />
              <OutcomeRow icon="◷" title="Reminder scheduled" detail="24 hours before the visit" />
              <OutcomeRow icon="↗" title="Human handover ready" detail="Clinic team can join anytime" />
            </div>
          </div>

          <p className="mt-auto border-t border-white/10 pt-2 text-[clamp(7px,.55vw,9px)] leading-[1.35] text-white/48">Every action is recorded against approved business rules and the connected calendar.</p>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-full border border-white/8 bg-white/[.055] px-3 py-1.5 text-[clamp(7px,.52vw,9px)] text-white/32">
          <span>Ask {botName}…</span><span className="text-[var(--gold-300)]">➤</span>
        </div>
      </div>
    </div>
  );
}

function Message({ children, side = "assistant" }: { children: React.ReactNode; side?: "assistant" | "customer" }) {
  return <div className={`max-w-[92%] rounded-lg px-2.5 py-2 text-[clamp(9px,.73vw,12px)] leading-[1.35] ${side === "customer" ? "ml-auto bg-[var(--gold-600)]/25 text-white" : "mr-auto bg-white/[.075] text-white/88"}`}>{children}</div>;
}

function TimeSlot({ children, selected = false }: { children: React.ReactNode; selected?: boolean }) {
  return <span className={`rounded-md border px-1 py-1.5 text-center text-[clamp(7px,.56vw,10px)] font-semibold ${selected ? "border-[var(--gold-300)] bg-[var(--gold-600)] text-white" : "border-white/12 bg-white/[.04] text-white/65"}`}>{children}</span>;
}

function OutcomeRow({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return (
    <div className="grid grid-cols-[1.6rem_1fr] items-center gap-2 rounded-lg border border-white/8 bg-white/[.035] px-2 py-1.5">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gold-600)]/22 text-[clamp(8px,.62vw,10px)] text-[var(--gold-100)]">{icon}</span>
      <span className="min-w-0 text-[clamp(8px,.62vw,10px)] leading-[1.25] text-white/88"><strong className="block font-semibold text-white">{title}</strong><small className="text-[clamp(7px,.52vw,9px)] text-white/45">{detail}</small></span>
    </div>
  );
}
