import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { InboxOperationsVisual } from "@/components/marketing/inbox-operations-visual";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Automation Solutions | AiFrogi",
  description: "Explore AI customer bots, follow-ups, workflow automation, payments, forms, reviews, commerce journeys, human handover, and WhatsApp as one supported channel.",
  path: "/solutions"
});

export default function SolutionsPage() {
  return (
    <main className="bg-white text-[#101010]">
      <SiteHeader />
      <section className="bg-[#101010] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="product-eyebrow text-[#e2c66d]">Solutions</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">One inbox. Many business outcomes.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/64">Broadcasts, chatbot, retargeting, reminders, payments, forms, surveys, and reviews work from the same customer conversation.</p>
          </div>
          <InboxOperationsVisual />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101010] sm:text-5xl">
              WhatsApp is where customers ask, decide, pay, book, and come back.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#68645c]">
              AiFrogi turns those moments into guided customer experiences: faster replies, cleaner handoff, higher conversion, and productized workflows like FlowCart and PingBook.
            </p>
            <p className="mt-8 text-sm font-semibold text-[#8a6a16]">
              Broadcast | Chatbot | Retarget | Order | Pay | Remind | Review | Book
            </p>
          </div>
          <div className="grid gap-4">
            <Link href="/solutions/flowcart" className="group rounded-lg border border-black/8 bg-[#f8f4ed] p-6 shadow-[0_22px_70px_rgba(16,16,16,.1)]">
              <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
                <div className="rounded-lg border border-black/8 bg-white p-4">
                  <Image src="/brand/flowcart-logo.svg" alt="FlowCart logo" width={1200} height={1200} className="h-auto w-full" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#b56a05]">Featured solution</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">FlowCart WhatsApp commerce</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    Turn cafe, gift, cake, and store enquiries into custom orders, Razorpay payments, and automated WhatsApp updates.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#b56a05]">
                    Open FlowCart
                    <Icon name="arrow-right" className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/solutions/pingbook" className="group rounded-lg border border-black/8 bg-[#fbfaf7] p-6 shadow-[0_22px_70px_rgba(16,16,16,.1)]">
              <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
                <div className="rounded-lg border border-black/8 bg-white p-4">
                  <Image src="/brand/pingbook-logo-aifrogi-tight.png" alt="PingBook" width={1200} height={1200} className="h-auto w-full grayscale contrast-125" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6d5310]">Appointment solution</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">PingBook appointment automation</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    Book, confirm, remind, and grow through WhatsApp with Google Calendar, Google Sheets, and Razorpay-ready payment flow.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#6d5310]">
                    Open PingBook
                    <Icon name="arrow-right" className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
