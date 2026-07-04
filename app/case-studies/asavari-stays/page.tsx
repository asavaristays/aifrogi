import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "Hotel WhatsApp Retargeting | Asavari Stays Case Study",
  description: "See how Asavari Stays, HotelRadar, and AiFrogi connect visual storytelling, WhatsApp retargeting, and human follow-up for booking conversations.",
  path: "/case-studies/asavari-stays"
});

const journey = [
  ["01", "A stay catches attention", "HotelRadar turns the property, room, and experience into a visual story—not another rate advertisement."],
  ["02", "Interest moves to WhatsApp", "The guest taps once to ask about dates, rooms, or availability while intent is still fresh."],
  ["03", "The right follow-up arrives", "AiFrogi keeps the enquiry in context and can retarget an opted-in guest with a relevant visual, reminder, or offer."],
  ["04", "A person closes the conversation", "The team sees the guest's journey, answers the final question, and moves the conversation toward booking."]
];

export default function AsavariStaysCaseStudyPage() {
  return (
    <main className="overflow-hidden bg-white text-[#2c243b]">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#2c243b] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-20 top-0 h-[440px] w-[440px] rounded-full bg-[#d92bcb]/20 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/resources" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#ff8af1]">← Customer stories</Link>
          <p className="mt-12 text-sm font-semibold text-white/48">Asavari Stays × HotelRadar × AiFrogi</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-6xl">From a beautiful stay to a booking conversation.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">A visual hospitality journey designed to recover interest, continue the story on WhatsApp, and give the team a better moment to convert.</p>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/12 pt-6 text-sm">
            <p><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-white/35">Client</span><strong className="mt-1 block">Nupur Purohit</strong></p>
            <p><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-white/35">Hospitality brand</span><strong className="mt-1 block">Asavari Stays</strong></p>
            <p><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-white/35">Growth partner</span><strong className="mt-1 block">HotelRadar</strong></p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="product-eyebrow">The conversion idea</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">Do not repeat the advertisement. Continue the guest&apos;s story.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)]">A guest who explored a room, destination, or experience should return to that same context—not a generic sales message.</p>
          </div>

          <div className="relative mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[1fr_100px_1fr] lg:items-center">
            <div className="overflow-hidden rounded-[1.75rem] bg-[#201a29] p-3 shadow-[0_28px_80px_rgba(44,36,59,.16)]">
              <div className="relative min-h-[460px] overflow-hidden rounded-[1.25rem] bg-[linear-gradient(155deg,#554261_0%,#bd7897_48%,#f3c58d_100%)] p-6 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,.35),transparent_30%)]" aria-hidden="true" />
                <div className="relative flex items-center justify-between text-[10px] font-bold uppercase tracking-[.16em]"><span>Asavari Stays</span><span>01 / 04</span></div>
                <div className="absolute inset-x-6 bottom-7">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-white/65">A slower morning in Goa</p>
                  <p className="mt-3 max-w-xs text-3xl font-semibold leading-tight">The stay becomes part of the trip—not just a room.</p>
                  <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-[#2c243b]">Check your dates →</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center text-[#d92bcb] lg:flex-col" aria-hidden="true">
              <span className="h-px flex-1 bg-[#d92bcb]/25 lg:h-16 lg:w-px lg:flex-none" />
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fceafb]"><Icon name="arrow-right" className="h-5 w-5 rotate-90 lg:rotate-0" /></span>
              <span className="h-px flex-1 bg-[#d92bcb]/25 lg:h-16 lg:w-px lg:flex-none" />
            </div>

            <div className="rounded-[1.75rem] bg-[#efeaf1] p-3 shadow-[0_28px_80px_rgba(44,36,59,.12)]">
              <div className="min-h-[460px] rounded-[1.25rem] bg-[#f8f7f9] p-5">
                <div className="flex items-center gap-3 border-b border-black/8 pb-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#d92bcb] text-xs font-bold text-white">AS</span><div><p className="text-sm font-bold">Asavari Stays</p><p className="text-[10px] text-[var(--text-muted)]">typically replies quickly</p></div></div>
                <div className="mt-8 max-w-[86%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 shadow-sm">Hi, is the garden room available for 12–14 July?</div>
                <div className="ml-auto mt-4 max-w-[90%] rounded-2xl rounded-tr-sm bg-[#f7d7f4] p-4 text-sm leading-6">Yes. Here is the room you viewed, with breakfast included. Would you like us to hold it?</div>
                <div className="ml-auto mt-3 max-w-[75%] overflow-hidden rounded-2xl rounded-tr-sm bg-white shadow-sm"><div className="h-24 bg-[linear-gradient(145deg,#6f526f,#dba17d)]" /><div className="p-3"><p className="text-xs font-bold">Garden Room · 2 nights</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">View stay details</p></div></div>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#178665]"><span className="h-2 w-2 rounded-full bg-[#178665]" />Ready for human follow-up</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#fbf8fc] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div><p className="product-eyebrow">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">One connected journey.</h2></div>
            <div>{journey.map(([number, title, copy]) => <article key={number} className="grid gap-4 border-t border-black/10 py-7 sm:grid-cols-[48px_220px_1fr]"><span className="text-xs font-bold text-[#d92bcb]">{number}</span><h3 className="font-bold">{title}</h3><p className="text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div><p className="product-eyebrow">Why this can convert better</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Context survives every step.</h2></div>
          <div className="border-y border-black/10">
            {[
              ["Relevant", "Follow-up reflects the stay or experience the guest actually viewed."],
              ["Timely", "Retargeting happens while travel intent and dates still matter."],
              ["Personal", "Automation opens the conversation; a person can complete it with full context."]
            ].map(([title, copy]) => <div key={title} className="grid gap-2 border-b border-black/10 py-5 last:border-b-0 sm:grid-cols-[110px_1fr]"><strong>{title}</strong><p className="text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div>)}
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-7xl rounded-xl bg-[#2c243b] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#ff8af1]">Build your journey</p><h2 className="mt-3 text-2xl font-semibold">Turn visual interest into a conversation your team can close.</h2></div><a href="https://app.aifrogi.com/register" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#d92bcb] px-5 text-sm font-bold lg:mt-0">Start free trial <Icon name="arrow-right" /></a></div>
      </section>

      <SiteFooter />
    </main>
  );
}
