import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

const products = [
  {
    name: "FlowCart",
    label: "WhatsApp commerce",
    href: "/solutions/flowcart",
    setupHref: "https://app.aifrogi.com/register?source=flowcart-product-shell",
    logo: "/brand/flowcart-logo.svg",
    accent: "#b56a05",
    surface: "#f8f4ed",
    iconSurface: "#fff1d7",
    summary: "Turn product questions into custom orders, Razorpay payment links, store sync, and customer updates.",
    bestFor: "Cafes, bakeries, gift stores, food orders, fashion, cosmetics and custom ecommerce.",
    workflow: ["Catalog", "Order", "Payment", "Store sync", "Updates"],
    proof: ["WhatsApp Flow order capture", "Razorpay-ready payment status", "Shopify, WooCommerce, Sheet or API connector"]
  },
  {
    name: "PingBook",
    label: "WhatsApp appointments",
    href: "/solutions/pingbook",
    setupHref: "https://app.aifrogi.com/register?source=pingbook-product-shell",
    logo: "/brand/pingbook-logo-aifrogi-tight.png",
    accent: "#6d5310",
    surface: "#fbfaf7",
    iconSurface: "#f8f0d8",
    summary: "Turn appointment enquiries into confirmed bookings, reminders, calendar updates, payment flow, and reviews.",
    bestFor: "Clinics, dentists, diagnostics, wellness teams, salons, consultants and appointment-led services.",
    workflow: ["Service", "Slot", "Confirm", "Reminder", "Review"],
    proof: ["Google Calendar and Sheet sync", "Razorpay-ready booking fee", "No-show reduction and review follow-up"]
  }
];

export function WhatsAppProductsShell({ eyebrow = "WhatsApp API products" }: { eyebrow?: string }) {
  return (
    <section className="border-b border-black/8 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="product-eyebrow">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.035em] text-[#101010] sm:text-5xl">
              Two focused WhatsApp workflows, built like serious products.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
              AiFrogi packages the same Meta WhatsApp API, payment, automation, and integration skill into productized workflows for different buying moments.
            </p>
          </div>
          <Link href="/solutions" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-bold text-[#101010] transition hover:bg-[#f8faf9]">
            View all solutions
            <Icon name="arrow-right" />
          </Link>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-lg border border-black/8 bg-[#f7faf8] shadow-[0_24px_80px_rgba(16,16,16,.09)] lg:grid-cols-2">
          {products.map((product, index) => (
            <article
              key={product.name}
              className={`flex flex-col border-black/8 p-5 sm:p-7 ${index === 0 ? "lg:border-r" : "border-t lg:border-t-0"}`}
              style={{ backgroundColor: product.surface }}
            >
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-black/8 bg-white p-2">
                  <Image src={product.logo} alt={`${product.name} logo`} width={160} height={160} className={`h-12 w-12 object-contain ${product.name === "PingBook" ? "grayscale contrast-125" : ""}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[.12em]" style={{ color: product.accent }}>{product.label}</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-[-.025em] text-[#21362f]">{product.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#66736d]">{product.summary}</p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-black/8 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#69766f]">Best fit</p>
                <p className="mt-2 text-sm leading-6 text-[#2c3f38]">{product.bestFor}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {product.workflow.map((step) => (
                  <span key={step} className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-bold text-[#42544e]">{step}</span>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                {product.proof.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#42544e]">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ backgroundColor: product.iconSurface, color: product.accent }}>
                      <Icon name="sparkles" className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-7">
                <a href={product.href} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold !text-white transition hover:-translate-y-0.5" style={{ backgroundColor: product.accent }}>
                  Explore {product.name}
                  <Icon name="arrow-right" />
                </a>
                <a href={product.setupHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-bold text-[#101010] transition hover:bg-[#f8faf9]">
                  Start setup
                  <Icon name="settings" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
