import Image from "next/image";

type Journey = {
  initials: string;
  status: string;
  task: string;
  customer: string;
  assistant: string;
  answer: string;
  choiceLabel: string;
  choices: string[];
  selected: number;
  confirmation: string;
  outcome: string;
  outcomeDetail: string;
  followUps: Array<[string, string]>;
  proof: string;
};

const journeys: Record<string, Journey> = {
  BusinessGPT: {
    initials: "BG", status: "Business assistant online", task: "Qualify a business enquiry",
    customer: "We want to automate customer enquiries and follow-up.", assistant: "Which customer channels should the first workflow support?", answer: "Website and WhatsApp.",
    choiceLabel: "Recommended starting outcome", choices: ["Answer", "Qualify", "Automate"], selected: 1,
    confirmation: "Consultation request verified", outcome: "Qualified automation lead", outcomeDetail: "Website + WhatsApp · Ref BG-1042",
    followUps: [["Brief recorded", "Team has full context"], ["Specialist notified", "Human handover ready"]], proof: "Grounded in approved services, qualification rules and commercial boundaries."
  },
  HotelGPT: {
    initials: "HG", status: "Hotel revenue assistant online", task: "Find the right stay",
    customer: "Two adults, 12–14 September. We prefer a sea-view room.", assistant: "I’ve checked the connected availability and approved rate rules.", answer: "Show the best direct option.",
    choiceLabel: "Available room options", choices: ["Garden", "Sea View", "Suite"], selected: 1,
    confirmation: "Availability verified", outcome: "Sea View Room selected", outcomeDetail: "2 nights · Direct-booking rate held",
    followUps: [["Booking link ready", "Approved direct rate"], ["Reservations notified", "Handover available"]], proof: "Availability and rate read from the connected hotel system of record."
  },
  ClinicGPT: {
    initials: "CG", status: "Clinic assistant online", task: "Book an appointment",
    customer: "I need a dental appointment this Friday afternoon.", assistant: "Certainly. What mobile number should the clinic use for confirmation?", answer: "+91 98••• ••226",
    choiceLabel: "Available Friday afternoon", choices: ["2:30 PM", "4:30 PM", "5:15 PM"], selected: 1,
    confirmation: "Book 4:30 PM.", outcome: "Appointment confirmed", outcomeDetail: "Friday · 4:30 PM · Ref CG-2048",
    followUps: [["Reminder set", "24 hours before"], ["Clinic notified", "Handover available"]], proof: "Verified using approved booking rules and the connected clinic calendar."
  },
  DineGPT: {
    initials: "DG", status: "Dining assistant online", task: "Reserve a table",
    customer: "A table for four this Saturday evening.", assistant: "Any dietary or accessibility requirements for your party?", answer: "Vegetarian options; one nut allergy.",
    choiceLabel: "Available table times", choices: ["7:30 PM", "8:00 PM", "8:30 PM"], selected: 1,
    confirmation: "Reserve 8:00 PM.", outcome: "Table reservation verified", outcomeDetail: "4 guests · Saturday · Ref DG-3186",
    followUps: [["Dietary note saved", "Allergy flagged to team"], ["Restaurant notified", "Human review ready"]], proof: "Reservation checked against table capacity and approved dining information."
  },
  PropertyGPT: {
    initials: "PG", status: "Property advisor online", task: "Match a buyer",
    customer: "I need a 2-bedroom home in North Goa under ₹1.2 crore.", assistant: "Is this for immediate use, investment or future possession?", answer: "Ready or near-ready for own use.",
    choiceLabel: "Approved inventory matches", choices: ["Siolim", "Assagao", "Porvorim"], selected: 0,
    confirmation: "Arrange a Siolim visit.", outcome: "Site visit requested", outcomeDetail: "2 BHK · Saturday 11 AM · Ref PG-4821",
    followUps: [["Buyer qualified", "Budget and use recorded"], ["Advisor assigned", "Project brief shared"]], proof: "Matched only against approved inventory, price guidance and visit rules."
  },
  FlowCart: {
    initials: "FC", status: "Commerce assistant online", task: "Build a verified order",
    customer: "I need a chocolate birthday cake delivered Sunday.", assistant: "Choose the size, delivery window and cake message.", answer: "1 kg · ‘Happy Birthday Aanya’",
    choiceLabel: "Available delivery windows", choices: ["10–12", "12–2", "4–6"], selected: 1,
    confirmation: "Confirm the 12–2 slot.", outcome: "Order created", outcomeDetail: "₹1,450 · Payment link ready · FC-6724",
    followUps: [["Stock verified", "Catalog price applied"], ["Store notified", "Fulfilment visible"]], proof: "Order verified against approved catalog, stock, pricing and delivery rules."
  },
  "Custom Business Bot": {
    initials: "CB", status: "Workflow assistant online", task: "Run an approved workflow",
    customer: "The cooling unit at Site 3 needs inspection.", assistant: "Please confirm urgency and whether operations are affected.", answer: "Urgent; output is reduced.",
    choiceLabel: "Approved response path", choices: ["Routine", "Urgent", "Shutdown"], selected: 1,
    confirmation: "Create an urgent service task.", outcome: "Service task verified", outcomeDetail: "Site 3 · Priority 2 · Ref CB-8105",
    followUps: [["Engineer routed", "Skills and region matched"], ["Manager notified", "Escalation recorded"]], proof: "Executed within the client-approved workflow, authority and escalation policy."
  }
};

export function AnimatedBotPhone({ botName = "ClinicGPT" }: { botName?: string }) {
  const journey = journeys[botName] ?? journeys["Custom Business Bot"];
  return (
    <div className="relative aspect-[9/14] w-full overflow-hidden bg-black sm:aspect-[2/1]" aria-label={`${botName} verified business journey`}>
      <Image src="/media/ai-bot-phone-stage-v2.png" alt="Black and antique-gold phone frame for an AiFrogi business bot" fill priority sizes="100vw" className="object-cover object-[70%_center] sm:object-contain sm:object-center" />
      <div className="absolute left-[16.8%] top-[6.8%] flex h-[86.4%] w-[66.2%] flex-col overflow-hidden rounded-[7.5%] bg-black px-[3.6%] pb-[3.7%] pt-[4.2%] shadow-[inset_0_0_0_1px_rgba(226,198,109,.1)] sm:left-[53.35%] sm:w-[21.25%] sm:px-[1.15%] sm:pb-[1.2%] sm:pt-[1.35%]">
        <header className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold-600)] text-[clamp(10px,.78vw,13px)] font-semibold text-white">{journey.initials}</span>
          <span className="min-w-0"><strong className="block truncate text-[clamp(13px,1vw,17px)] font-semibold leading-none text-white">{botName}</strong><small className="mt-1 flex items-center gap-1 truncate text-[clamp(9px,.66vw,11px)] text-white/58"><i className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#36c997]" />{journey.status}</small></span>
        </header>
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <p className="text-[clamp(9px,.66vw,11px)] font-semibold uppercase tracking-[.12em] text-[var(--gold-300)]">{journey.task}</p>
          <Message side="customer">{journey.customer}</Message>
          <Message>{journey.assistant}</Message>
          <Message side="customer">{journey.answer}</Message>
          <p className="text-[clamp(9px,.66vw,11px)] font-semibold text-white/62">{journey.choiceLabel}</p>
          <div className="grid grid-cols-3 gap-1.5">{journey.choices.map((choice, index) => <Choice key={choice} selected={index === journey.selected}>{choice}</Choice>)}</div>
          <Message side="customer">{journey.confirmation}</Message>
          <div className="rounded-lg border border-[#36c997]/35 bg-[#36c997]/10 px-2.5 py-2.5 text-[clamp(10px,.8vw,13px)] leading-[1.35] text-[#a9ead4]"><strong className="block font-semibold text-[#c3f4e3]">✓ {journey.outcome}</strong>{journey.outcomeDetail}</div>
          <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2">{journey.followUps.map(([title, detail]) => <Outcome key={title} title={title} detail={detail} />)}</div>
          <p className="mt-auto border-t border-white/10 pt-2 text-[clamp(8px,.6vw,10px)] leading-[1.35] text-white/50">{journey.proof}</p>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-full border border-white/8 bg-white/[.055] px-3 py-1.5 text-[clamp(8px,.6vw,10px)] text-white/35"><span>Ask {botName}…</span><span className="text-[var(--gold-300)]">➤</span></div>
      </div>
    </div>
  );
}

function Message({ children, side = "assistant" }: { children: React.ReactNode; side?: "assistant" | "customer" }) {
  return <div className={`max-w-[94%] rounded-lg px-2.5 py-2 text-[clamp(10px,.82vw,14px)] leading-[1.35] ${side === "customer" ? "ml-auto bg-[var(--gold-600)]/25 text-white" : "mr-auto bg-white/[.075] text-white/90"}`}>{children}</div>;
}
function Choice({ children, selected = false }: { children: React.ReactNode; selected?: boolean }) {
  return <span className={`rounded-md border px-1 py-1.5 text-center text-[clamp(8px,.64vw,11px)] font-semibold ${selected ? "border-[var(--gold-300)] bg-[var(--gold-600)] text-white" : "border-white/12 bg-white/[.04] text-white/65"}`}>{children}</span>;
}
function Outcome({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-lg border border-white/8 bg-white/[.035] px-2 py-2 text-[clamp(8px,.62vw,10px)] leading-[1.25] text-white/88"><strong className="block font-semibold text-[var(--gold-100)]">✓ {title}</strong><small className="text-[clamp(7px,.54vw,9px)] text-white/48">{detail}</small></div>;
}
