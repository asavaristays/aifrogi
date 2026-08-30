import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { AIProductHero } from "@/components/marketing/ai-product-hero";
import { marketingMetadata } from "@/lib/seo";

const registerUrl = "https://app.aifrogi.com/register?source=clinicgpt";

export const metadata: Metadata = marketingMetadata({
  title: "ClinicGPT | AI Appointment Automation for Clinics | AiFrogi",
  description: "ClinicGPT helps clinics automate booking, confirmations, reminders, payments, cancellations, and reviews with AI workflows, calendars, and optional WhatsApp messaging.",
  path: "/solutions/clinicgpt"
});

const roleFlow = [
  {
    owner: "Super Admin",
    title: "Enable ClinicGPT",
    copy: "Turn on the appointment product for a client account, validate WhatsApp readiness, template status, product validity, and service subscription access.",
    icon: "settings" as const
  },
  {
    owner: "Client Admin",
    title: "Configure operations",
    copy: "Connect Google OAuth, set services, availability, payment rules, booking status, reschedule rules, and reminder preferences.",
    icon: "grid" as const
  },
  {
    owner: "Customer",
    title: "Book on WhatsApp",
    copy: "Customer selects service, shares details, receives slot confirmation, payment link when required, and approved reminders.",
    icon: "message-circle" as const
  }
];

const journey = [
  ["1", "Customer sends enquiry", "WhatsApp"],
  ["2", "ClinicGPT collects service and preferred slot", "Automation"],
  ["3", "Availability is checked", "Google Calendar"],
  ["4", "Payment link is shared if required", "Razorpay"],
  ["5", "Appointment is confirmed", "WhatsApp template"],
  ["6", "Record is saved for operations", "Calendar + Sheet"]
];

const prototypeEvents = [
  ["12:04", "WhatsApp enquiry received", "Cleaning appointment for tomorrow evening", "message-circle" as const],
  ["12:05", "Slot held", "Tue, 6:30 PM locked for 10 minutes", "grid" as const],
  ["12:06", "Confirmation sent", "Approved template delivered to customer", "bell" as const],
  ["12:07", "Payment captured", "Booking fee paid through Razorpay link", "link" as const],
  ["Next day", "Review requested", "Feedback message queued after visit", "sparkles" as const]
] as const;

const syncStates = [
  ["Calendar", "Event created", "6:30 PM · Dental cleaning"],
  ["Sheet", "Row added", "Paid · Confirmed · Review queued"],
  ["Dashboard", "Status updated", "Confirmed appointment"],
  ["WhatsApp", "Thread active", "Customer has receipt"]
] as const;

const faqs = [
  {
    question: "Who can use ClinicGPT?",
    answer: "ClinicGPT is designed clinic-first for doctors, dentists, wellness clinics, diagnostics, and appointment-led healthcare teams. It can also be adapted later for salons, consultants, tutors, and local service providers."
  },
  {
    question: "What problem does it solve?",
    answer: "It reduces missed enquiries, manual slot checking, slow confirmations, no-shows, payment follow-up, and scattered booking records."
  },
  {
    question: "How does a booking happen?",
    answer: "The customer asks on WhatsApp, ClinicGPT collects the service and preferred time, checks availability, holds a slot, sends confirmation, and updates the business records."
  },
  {
    question: "Can it collect payment?",
    answer: "Yes. If the business needs an advance or booking fee, ClinicGPT can send a payment link and confirm the appointment after payment is captured."
  },
  {
    question: "Can patients cancel appointments?",
    answer: "Yes. For the clinic-first workflow, patients can cancel up to 2 hours before the appointment. If there is a valid issue after payment, the clinic can process a refund according to its policy."
  },
  {
    question: "Where does the team see bookings?",
    answer: "The appointment can be visible in the AiFrogi dashboard, synced to Google Calendar, and recorded in Google Sheets for operations and reporting."
  },
  {
    question: "Does it help with reviews?",
    answer: "Yes. After the appointment is completed, ClinicGPT can trigger feedback or review requests while the customer experience is still fresh."
  },
  {
    question: "Is it only for one location?",
    answer: "No. Pricing and setup can be planned for one location, multiple staff calendars, or multiple service locations depending on the business workflow."
  },
  {
    question: "How is ClinicGPT priced?",
    answer: "ClinicGPT has a one-time setup fee of Rs. 4,500 for Meta, Razorpay, and Google onboarding. The platform fee is Rs. 1,250 per month, paid quarterly at Rs. 3,750. Meta message fees are charged separately as used."
  },
  {
    question: "Is there a trial or refund window?",
    answer: "Yes. The clinic pays quarterly to start. If the subscriber cancels within 15 days, AiFrogi will process the eligible refund in 5-7 working days."
  },
  {
    question: "How fast can a clinic go live?",
    answer: "Most clinics can go live in 2-3 working days after Meta, Google, Razorpay, and required business access are ready."
  },
  {
    question: "How much do 500 Meta messages cost?",
    answer: "As a planning estimate for India, 500 utility messages such as confirmations or reminders can often stay under Rs. 100 at current utility-rate ranges, while 500 marketing messages can be around Rs. 430 to Rs. 500. The actual bill depends on Meta/BSP rates, message category, recipient country, taxes, and any provider fees."
  },
  {
    question: "Why is the Meta fee separate?",
    answer: "Meta charges per delivered WhatsApp message and rates can change by category and country. Keeping it separate makes the monthly platform fee predictable while message usage remains transparent."
  }
];

export default function ClinicGPTPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />

      <AIProductHero name="ClinicGPT" category="Appointments" headline="Turn appointment conversations into verified confirmations." copy="ClinicGPT understands the required service, presents valid availability, applies approved booking rules and records the confirmed outcome for the team." stages={[
        { label: "Customer intent", detail: "Customer shares the service and preferred date or time." },
        { label: "Trusted intelligence", detail: "ClinicGPT checks services, availability and booking rules." },
        { label: "Approved action", detail: "A valid slot is held and presented for confirmation." },
        { label: "Verified outcome", detail: "The appointment is created, read back and recorded." }
      ]} />

      <section className="border-b border-black/8 bg-[#fbfaf7] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="product-eyebrow">Who it helps</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">
              For clinics where appointments are still managed through calls, chats, and manual follow-up.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Audience title="Dental and medical clinics" copy="Consultations, cleaning, follow-ups, reminders, cancellation, and no-show reduction." />
            <Audience title="Wellness and diagnostics" copy="Slot selection, booking fees, reports pickup, reminders, and review requests." />
            <Audience title="Multi-doctor clinics" copy="Staff calendars, patient routing, appointment visibility, and daily booking records." />
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="product-eyebrow">System flow</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">
                One workflow, three users.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                Super Admin enables the product, client admin configures the operating rules, and the customer books from WhatsApp without learning a new app.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {roleFlow.map((role) => (
                <article key={role.title} className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_60px_rgba(16,16,16,.08)]">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-[#f8f0d8] text-[#6d5310]">
                    <Icon name={role.icon} />
                  </span>
                  <p className="mt-5 text-xs font-bold text-[#6d5310]">{role.owner}</p>
                  <h3 className="mt-2 text-lg font-bold">{role.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{role.copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-lg border border-black/8 bg-[#1c1c1c] p-5 text-white sm:p-7">
            <div className="grid gap-4 md:grid-cols-6">
              {journey.map(([number, title, system], index) => (
                <div key={title} className="relative rounded-lg border border-white/10 bg-white/[.045] p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e2c66d] text-xs font-black text-[#1c1c1c]">{number}</span>
                  <h3 className="mt-5 text-sm font-bold leading-5">{title}</h3>
                  <p className="mt-2 text-xs font-semibold text-white/42">{system}</p>
                  {index < journey.length - 1 ? <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[#e2c66d]/60 md:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="product-eyebrow">Pricing and Meta usage</p><p className="mt-2 text-lg font-semibold">Pricing estimates now live with WhatsApp API costs and onboarding.</p></div>
          <Link href="/whatsapp-api#clinicgpt-pricing" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--gold-700)]">View ClinicGPT pricing <Icon name="arrow-right" /></Link>
        </div>
      </section>

      <section className="border-t border-black/8 bg-[#fbfaf7] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="product-eyebrow">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">
                Clinic terms, patient cancellation, and pricing.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                ClinicGPT is for clinics that need appointment booking to move faster, look more professional, and stay visible from enquiry to review.
              </p>
              <a href={registerUrl} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#8a6a16] px-6 text-sm font-bold text-white shadow-[0_18px_42px_rgba(138,106,22,.22)] transition hover:-translate-y-0.5 hover:bg-[#8a6a16]">
                Ask for ClinicGPT pricing
                <Icon name="arrow-right" />
              </a>
            </div>
            <div className="grid gap-3">
              {faqs.map((faq, index) => (
                <details key={faq.question} name="clinicgpt-faq" className="group rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(16,16,16,.06)]" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[#101010]">
                    <span>{faq.question}</span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f8f0d8] text-[#6d5310] transition group-open:rotate-45">
                      <Icon name="x" className="h-3.5 w-3.5" />
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function RealtimePrototype() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-white/12 bg-[#f8f7fb] text-[#101010] shadow-[0_34px_90px_rgba(16,16,16,.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 bg-white px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase text-[#178665]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#178665] shadow-[0_0_0_6px_rgba(23,134,101,.12)]" />
              Realtime booking run
            </p>
            <h2 className="mt-1 text-lg font-black">Customer to confirmed appointment</h2>
          </div>
          <p className="rounded-md bg-[#f8f0d8] px-3 py-2 text-xs font-black text-[#6d5310]">PB-1042</p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[.92fr_1.08fr]">
          <div className="border-b border-black/8 bg-[#ded8cb] p-4 lg:border-b-0 lg:border-r">
            <div className="rounded-xl bg-[#f8f0d8] p-4 shadow-[0_18px_50px_rgba(16,16,16,.12)]">
              <div className="flex items-center justify-between border-b border-black/8 pb-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#178665] text-xs font-black text-white">WA</span>
                  <div>
                    <p className="text-sm font-black">WhatsApp booking</p>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">Customer: Aisha Rao</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#e9f7f1] px-3 py-1 text-[10px] font-black text-[#178665]">Live</span>
              </div>

              <div className="mt-5 space-y-3">
                <ChatBubble align="left" copy="Can I book dental cleaning tomorrow evening?" />
                <ChatBubble align="right" copy="Yes. Dr. Meera has 5:30 PM, 6:30 PM, or 7:15 PM." />
                <div className="grid grid-cols-3 gap-2">
                  <SlotPill label="5:30" state="open" />
                  <SlotPill label="6:30" state="held" />
                  <SlotPill label="7:15" state="open" />
                </div>
                <ChatBubble align="left" copy="6:30 works. Please confirm." />
                <ChatBubble align="right" copy="Slot held. Pay Rs 500 booking fee to confirm." />
              </div>
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusTile title="Slot" value="6:30 PM held" icon="grid" tone="green" />
              <StatusTile title="Confirmation" value="Template sent" icon="bell" tone="pink" />
              <StatusTile title="Payment" value="Rs 500 paid" icon="link" tone="green" />
              <StatusTile title="Review" value="Queued after visit" icon="sparkles" tone="pink" />
            </div>

            <div className="mt-4 border-t border-black/8 pt-4">
              <p className="text-xs font-black uppercase text-[#6d5310]">System timeline</p>
              <div className="mt-3 space-y-3">
                {prototypeEvents.map(([time, title, copy, icon]) => (
                  <TimelineItem key={title} time={time} title={title} copy={copy} icon={icon} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/8 bg-[#101010] p-4 text-white">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {syncStates.map(([title, status, copy]) => (
              <SyncState key={title} title={title} status={status} copy={copy} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ align, copy }: { align: "left" | "right"; copy: string }) {
  const isRight = align === "right";
  return (
    <p className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${isRight ? "ml-auto rounded-tr-sm bg-[#f8f0d8]" : "rounded-tl-sm bg-[#eef7f2]"}`}>
      {copy}
    </p>
  );
}

function SlotPill({ label, state }: { label: string; state: "open" | "held" }) {
  return (
    <div className={`rounded-md border px-3 py-2 text-center text-xs font-black ${state === "held" ? "border-[#178665] bg-[#e9f7f1] text-[#12664e]" : "border-black/8 bg-white text-[var(--text-muted)]"}`}>
      {label}
      <span className="mt-1 block text-[9px] uppercase">{state}</span>
    </div>
  );
}

function StatusTile({ title, value, icon, tone }: { title: string; value: string; icon: "grid" | "bell" | "link" | "sparkles"; tone: "green" | "pink" }) {
  return (
    <div className="rounded-lg border border-black/8 bg-[#fbfaf7] p-3">
      <span className={`grid h-8 w-8 place-items-center rounded-md ${tone === "green" ? "bg-[#e9f7f1] text-[#178665]" : "bg-[#f8f0d8] text-[#6d5310]"}`}>
        <Icon name={icon} />
      </span>
      <p className="mt-3 text-[10px] font-black uppercase text-[var(--text-muted)]">{title}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function TimelineItem({ time, title, copy, icon }: { time: string; title: string; copy: string; icon: "message-circle" | "grid" | "bell" | "link" | "sparkles" }) {
  return (
    <div className="grid grid-cols-[58px_32px_1fr] items-start gap-3">
      <p className="pt-1 text-[10px] font-black uppercase text-[var(--text-muted)]">{time}</p>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f8f0d8] text-[#6d5310]">
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{copy}</p>
      </div>
    </div>
  );
}

function SyncState({ title, status, copy }: { title: string; status: string; copy: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[.055] p-3">
      <p className="text-[10px] font-black uppercase text-[#e2c66d]">{title}</p>
      <h3 className="mt-2 text-sm font-black">{status}</h3>
      <p className="mt-1 text-xs leading-5 text-white/52">{copy}</p>
    </div>
  );
}

function Audience({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_60px_rgba(16,16,16,.08)]">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p>
    </article>
  );
}
