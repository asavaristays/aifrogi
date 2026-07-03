import { InboxOperationsVisual } from "@/components/marketing/inbox-operations-visual";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function SolutionsPage() {
  return (
    <main className="bg-white text-[#2c243b]">
      <SiteHeader />
      <section className="bg-[#2c243b] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="product-eyebrow text-[#ff8af1]">Solutions</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">One inbox. Many business outcomes.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/64">Broadcasts, chatbot, retargeting, reminders, payments, forms, surveys, and reviews work from the same customer conversation.</p>
          </div>
          <InboxOperationsVisual />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#2c243b] sm:text-5xl">
            WhatsApp is where customers ask, decide, pay, and come back.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#70697d]">
            AiFrogi turns those moments into guided customer experiences — faster replies, cleaner handoff, and higher conversion from the same conversation.
          </p>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-[#c725ba]">
            Broadcast → Chatbot → Retarget → Remind → Collect → Review
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
