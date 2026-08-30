import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

const highlights = [
  "WhatsApp-led appointment booking",
  "Google Calendar and Sheet sync",
  "Razorpay-ready payment workflow"
];

export function AppointmentJourneyShowcase() {
  return (
    <section id="clinicgpt" className="border-b border-black/8 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <p className="product-eyebrow">AiFrogi</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">
            ClinicGPT turns WhatsApp enquiries into confirmed appointments.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-muted)]">
            AiFrogi&apos;s appointment product helps service businesses book, confirm, remind, and grow through WhatsApp while keeping operations visible in trusted Google tools.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="rounded-lg border border-black/8 bg-[#fbfaf7] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f8f0d8] text-[#6d5310]">
                  <Icon name="sparkles" />
                </span>
                <p className="mt-4 text-sm font-bold leading-5 text-[#101010]">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/solutions/clinicgpt" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#8a6a16] px-5 text-sm font-bold !text-white shadow-[0_18px_42px_rgba(138,106,22,.22)] transition hover:-translate-y-0.5 hover:bg-[#8a6a16]">
              Explore ClinicGPT
              <Icon name="arrow-right" />
            </Link>
            <a href="https://app.aifrogi.com/register?source=clinicgpt-home" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-5 text-sm font-bold text-[#2b2b2b] transition hover:bg-[#fbfaf7]">
              Start setup
              <Icon name="settings" />
            </a>
          </div>
        </div>

        <Link href="/solutions/clinicgpt" className="group flex min-h-[260px] items-center justify-center">
          <Image src="/brand/aifrogi-sovereign-bot.png" alt="ClinicGPT AI clinic assistant" width={1122} height={1402} className="h-[500px] w-[500px] max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
        </Link>
      </div>
    </section>
  );
}
