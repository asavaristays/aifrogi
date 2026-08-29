import Image from "next/image";

export function AnimatedBotPhone({ botName = "PingBook" }: { botName?: string }) {
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden bg-black" aria-label={`${botName} verified appointment conversation`}>
      <Image src="/media/ai-bot-phone-stage-v2.png" alt="Black and antique-gold phone frame for an AiFrogi business bot" fill priority sizes="100vw" className="object-contain" />

      <div className="absolute left-[53.35%] top-[6.8%] flex h-[86.4%] w-[21.25%] flex-col overflow-hidden rounded-[7.5%] bg-black px-[1.15%] pb-[1.2%] pt-[1.35%] shadow-[inset_0_0_0_1px_rgba(226,198,109,.1)]">
        <header className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold-600)] text-[clamp(10px,.78vw,13px)] font-semibold text-white">PB</span>
          <span className="min-w-0">
            <strong className="block truncate text-[clamp(13px,1vw,17px)] font-semibold leading-none text-white">{botName}</strong>
            <small className="mt-1 flex items-center gap-1 text-[clamp(9px,.66vw,11px)] text-white/58"><i className="h-1.5 w-1.5 rounded-full bg-[#36c997]" />Clinic assistant online</small>
          </span>
        </header>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <p className="text-[clamp(9px,.66vw,11px)] font-semibold uppercase tracking-[.12em] text-[var(--gold-300)]">Book an appointment</p>
          <Message side="customer">I need a dental appointment this Friday afternoon.</Message>
          <Message>Certainly. What mobile number should the clinic use for confirmation?</Message>
          <Message side="customer">+91 98••• ••226</Message>
          <p className="text-[clamp(9px,.66vw,11px)] font-semibold text-white/62">Available Friday afternoon</p>
          <div className="grid grid-cols-3 gap-1.5" aria-label="Available appointment times">
            <TimeSlot>2:30 PM</TimeSlot>
            <TimeSlot selected>4:30 PM</TimeSlot>
            <TimeSlot>5:15 PM</TimeSlot>
          </div>
          <Message side="customer">Book 4:30 PM.</Message>
          <div className="rounded-lg border border-[#36c997]/35 bg-[#36c997]/10 px-2.5 py-2.5 text-[clamp(10px,.8vw,13px)] leading-[1.35] text-[#a9ead4]">
            <strong className="block font-semibold text-[#c3f4e3]">✓ Appointment confirmed</strong>
            Friday · 4:30 PM · Ref PB-2048
          </div>

          <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2">
            <Outcome title="Reminder set" detail="24 hours before" />
            <Outcome title="Clinic notified" detail="Handover available" />
          </div>

          <p className="mt-auto border-t border-white/10 pt-2 text-[clamp(8px,.6vw,10px)] leading-[1.35] text-white/50">Verified using approved booking rules and the connected clinic calendar.</p>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-full border border-white/8 bg-white/[.055] px-3 py-1.5 text-[clamp(8px,.6vw,10px)] text-white/35">
          <span>Ask {botName}…</span><span className="text-[var(--gold-300)]">➤</span>
        </div>
      </div>
    </div>
  );
}

function Message({ children, side = "assistant" }: { children: React.ReactNode; side?: "assistant" | "customer" }) {
  return <div className={`max-w-[94%] rounded-lg px-2.5 py-2 text-[clamp(10px,.82vw,14px)] leading-[1.35] ${side === "customer" ? "ml-auto bg-[var(--gold-600)]/25 text-white" : "mr-auto bg-white/[.075] text-white/90"}`}>{children}</div>;
}

function TimeSlot({ children, selected = false }: { children: React.ReactNode; selected?: boolean }) {
  return <span className={`rounded-md border px-1 py-1.5 text-center text-[clamp(9px,.68vw,11px)] font-semibold ${selected ? "border-[var(--gold-300)] bg-[var(--gold-600)] text-white" : "border-white/12 bg-white/[.04] text-white/65"}`}>{children}</span>;
}

function Outcome({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[.035] px-2 py-2 text-[clamp(8px,.62vw,10px)] leading-[1.25] text-white/88">
      <strong className="block font-semibold text-[var(--gold-100)]">✓ {title}</strong>
      <small className="text-[clamp(7px,.54vw,9px)] text-white/48">{detail}</small>
    </div>
  );
}
