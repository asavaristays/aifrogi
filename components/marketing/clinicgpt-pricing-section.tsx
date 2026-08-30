import { Icon } from "@/components/icons";
import { ClinicGPTPricingCalculator } from "@/app/solutions/clinicgpt/pricing-calculator";

const pricingCards = [
  { title: "One-time setup", price: "Rs. 4,500", copy: "Meta, Razorpay, and Google onboarding with one clinic booking test." },
  { title: "ClinicGPT platform", price: "Rs. 1,250 / mo", copy: "Paid quarterly at Rs. 3,750 with a 15-day cancellation and refund window." },
  { title: "Meta message fee", price: "As used", copy: "Billed by delivered WhatsApp message category and customer country." }
];

export function ClinicGPTPricingSection() {
  return (
    <section id="clinicgpt-pricing" className="border-t border-black/8 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <div>
            <p className="product-eyebrow">ClinicGPT pricing example</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">Clinic automation and WhatsApp API usage in one estimate.</h2>
            <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">Platform subscription and onboarding remain predictable. Meta message charges vary by category, customer country and actual usage.</p>
            <a href="https://app.aifrogi.com/register?source=whatsapp-api-clinicgpt-pricing" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--gold-600)] px-6 text-sm font-bold text-[var(--ink-600)] transition hover:bg-[var(--gold-500)]">Start with Rs. 4,500 setup <Icon name="arrow-right" /></a>
          </div>
          <div>
            <div className="grid gap-4 md:grid-cols-3">
              {pricingCards.map((card) => <article key={card.title} className="rounded-lg border border-black/8 bg-[var(--warm-25)] p-5 shadow-[0_18px_50px_rgba(16,16,16,.06)]"><p className="text-xs font-bold uppercase text-[var(--gold-700)]">{card.title}</p><h3 className="mt-3 text-2xl font-bold tracking-[-.03em]">{card.price}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{card.copy}</p></article>)}
            </div>
            <div className="mt-4 rounded-lg border border-[var(--gold-600)]/18 bg-[var(--primary-soft)] p-5"><p className="text-xs font-bold uppercase text-[var(--gold-700)]">Clinic launch terms</p><p className="mt-2 text-sm leading-6 text-[var(--gold-700)]">Pay quarterly to start. Cancel within 15 days and eligible refunds are processed in 5-7 working days. Most clinics can go live in 2-3 working days after Meta, Google, Razorpay, and access readiness.</p></div>
            <ClinicGPTPricingCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}
