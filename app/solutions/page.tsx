import { Icon } from "@/components/icons";
import { InboxOperationsVisual } from "@/components/marketing/inbox-operations-visual";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const useCases = [
  ["Broadcast message", "Send approved campaigns and keep replies inside the inbox."],
  ["AI chatbot", "Answer common questions, qualify leads, and hand over with context."],
  ["E-commerce retargeting", "Recover carts, repeat purchases, and product interest."],
  ["Reminders", "Send appointment, renewal, payment, and booking nudges."],
  ["Payment collection", "Share links, track status, and confirm payment in chat."],
  ["Forms, survey, review", "Collect structured answers and ask for feedback at the right moment."]
];

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
        <div className="mx-auto max-w-7xl">
          <p className="product-eyebrow">Use cases</p>
          <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map(([title, copy]) => (
              <article key={title} className="border-t border-[#eadfed] pt-5">
                <Icon name="arrow-right" className="text-[#d92bcb]" />
                <h2 className="mt-4 text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#70697d]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
