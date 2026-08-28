import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { EMILY_CAFE_ORDERS, EMILY_CAFE_PRODUCTS, formatInrFromPaisa } from "@/lib/flowcart-demo";
import { marketingMetadata } from "@/lib/seo";
import { FlowCartPricingCalculator } from "./pricing-calculator";

const registerUrl = "https://app.aifrogi.com/register?source=flowcart";

export const metadata: Metadata = marketingMetadata({
  title: "FlowCart | AI Order Automation for Stores | AiFrogi",
  description: "FlowCart helps stores turn customer enquiries into guided orders, payments, dashboard updates, and follow-ups with intelligent automation. WhatsApp is an optional channel.",
  path: "/solutions/flowcart"
});

const journey = [
  ["1", "Customer clicks WhatsApp", "Ad, website, QR, Instagram"],
  ["2", "Flow collects order", "Product, variant, add-ons"],
  ["3", "Price is calculated", "Catalog and delivery rules"],
  ["4", "Payment link is sent", "Razorpay"],
  ["5", "Store receives order", "Dashboard or connector"],
  ["6", "Updates go to customer", "WhatsApp templates"]
];

const roleFlow = [
  {
    owner: "Merchant",
    title: "Connect catalog",
    copy: "Start with a demo catalog, Google Sheet, Shopify, WooCommerce, or a custom shopping-system connector.",
    icon: "grid" as const
  },
  {
    owner: "Customer",
    title: "Order in WhatsApp",
    copy: "Customer browses, customizes, shares delivery details, and pays without switching to a long checkout form.",
    icon: "message-circle" as const
  },
  {
    owner: "Team",
    title: "Fulfil from dashboard",
    copy: "Paid, pending, preparing, dispatched, and delivered orders stay visible to the merchant team.",
    icon: "bar-chart-3" as const
  }
];

const pricingCards = [
  {
    title: "One-time setup",
    price: "Rs. 6,500",
    copy: "Meta, WhatsApp Flow, Razorpay, dashboard, and one demo or Google Sheet catalog setup."
  },
  {
    title: "FlowCart platform",
    price: "Rs. 1,750 / mo",
    copy: "Paid quarterly at Rs. 5,250 for dashboard, orders, reminders, and workflow support."
  },
  {
    title: "Store connector",
    price: "Scoped",
    copy: "Shopify, WooCommerce, custom API, or ERP connector based on the client shopping system."
  }
];

const faqs = [
  {
    question: "Does FlowCart replace the existing ecommerce store?",
    answer: "No. FlowCart is a WhatsApp sales channel. The existing store can remain the source of truth for products, stock, payments, and fulfilment."
  },
  {
    question: "Which shopping systems can it connect with?",
    answer: "The first connector can be Google Sheets for fast launch. Then FlowCart can connect to Shopify, WooCommerce, a custom website API, or a store database through middleware."
  },
  {
    question: "Why use WhatsApp Flow instead of only chat messages?",
    answer: "WhatsApp Flow makes ordering structured: product, size, flavour, delivery date, address, notes, and consent can be captured cleanly instead of being buried inside free-text chat."
  },
  {
    question: "Can it collect payments?",
    answer: "Yes. FlowCart creates a Razorpay payment link, stores it against the order, listens to payment webhooks, and updates the dashboard and customer conversation."
  },
  {
    question: "Can the customer customize an order?",
    answer: "Yes. The Emily Cafe demo supports cake size, message on cake, add-ons, delivery slot, and special notes. The same model works for fashion, gifts, restaurants, and services."
  },
  {
    question: "Where does the merchant see orders?",
    answer: "Orders appear in the AiFrogi dashboard and can also sync to Google Sheets or the client store. The team can see pending payment, paid, preparing, delivery, and completed orders."
  }
];

const architecture = [
  ["WhatsApp webhook", "Receives customer messages and Flow submissions."],
  ["Conversation engine", "Routes browse, order, payment, support, and human handoff intents."],
  ["Catalog connector", "Reads products from demo data, Google Sheets, Shopify, WooCommerce, or custom APIs."],
  ["Order engine", "Creates cart/order drafts, totals, delivery fees, add-ons, and customer records."],
  ["Payment engine", "Creates Razorpay links and processes payment confirmation webhooks."],
  ["Notification engine", "Sends order confirmation, payment reminders, preparation, and delivery updates."]
];

export default function FlowCartPage() {
  return (
    <main className="bg-white text-[#21362f]">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#21362f] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 p-2 pr-4">
              <Image src="/brand/flowcart-logo.svg" alt="FlowCart logo" width={96} height={96} priority className="h-12 w-12 rounded-md bg-white object-contain p-1" />
              <div>
                <p className="text-xs font-black uppercase text-[#f4b85a]">AiFrogi FlowCart</p>
                <p className="text-xs font-semibold text-white/58">Emily Cafe live example</p>
              </div>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] sm:text-6xl">
              Turn WhatsApp enquiries into paid ecommerce orders.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/66">
              FlowCart helps cafes, bakeries, gift stores, and ecommerce teams collect custom orders, send Razorpay payment links, sync with shopping systems, and update customers automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={registerUrl} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#f4b85a] px-6 text-sm font-bold text-[#21362f] shadow-[0_0_34px_rgba(244,184,90,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffd078]">
                Start FlowCart setup
                <Icon name="arrow-right" />
              </a>
              <a href="#workflow" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10">
                View workflow
                <Icon name="grid" />
              </a>
              <a href="/api/flowcart/current" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10">
                API demo
                <Icon name="link" />
              </a>
            </div>
          </div>

          <RealtimeCommercePrototype />
        </div>
      </section>

      <section className="border-b border-black/8 bg-[#f8f4ed] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="product-eyebrow text-[#b56a05]">Emily Cafe example</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              A cafe order is rarely just checkout. It needs options, timing, payment, and follow-up.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Audience title="Cake and gift customization" copy="Size, flavour, delivery date, message on cake, card copy, add-ons, and special notes are collected in a clean Flow." />
            <Audience title="Payment before preparation" copy="Razorpay payment links reduce unpaid custom orders and give the kitchen a clear confirmation signal." />
            <Audience title="Order visibility for staff" copy="The merchant dashboard shows paid, pending, preparing, delivery, and completed orders in one operating view." />
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="product-eyebrow text-[#b56a05]">System flow</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                WhatsApp becomes the sales channel. The store remains the source of truth.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                FlowCart can start with an Emily Cafe demo catalog, then connect to Shopify, WooCommerce, custom APIs, or a Google Sheet catalog depending on the client.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {roleFlow.map((role) => (
                <article key={role.title} className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_60px_rgba(33,54,47,.08)]">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-[#fff1d7] text-[#b56a05]">
                    <Icon name={role.icon} />
                  </span>
                  <p className="mt-5 text-xs font-bold text-[#b56a05]">{role.owner}</p>
                  <h3 className="mt-2 text-lg font-bold">{role.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{role.copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-lg border border-black/8 bg-[#21362f] p-5 text-white sm:p-7">
            <div className="grid gap-4 md:grid-cols-6">
              {journey.map(([number, title, system], index) => (
                <div key={title} className="relative rounded-lg border border-white/10 bg-white/[.045] p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4b85a] text-xs font-black text-[#21362f]">{number}</span>
                  <h3 className="mt-5 text-sm font-bold leading-5">{title}</h3>
                  <p className="mt-2 text-xs font-semibold text-white/46">{system}</p>
                  {index < journey.length - 1 ? <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[#f4b85a]/65 md:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-[#f8f4ed] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
            <div>
              <p className="product-eyebrow text-[#b56a05]">Backend stack</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Built like a product, not a scripted chatbot.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                The backend uses tenant, catalog, customer, order, payment, session, and conversation records so every client can have a repeatable commerce workflow.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {architecture.map(([title, copy]) => (
                <article key={title} className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(33,54,47,.06)]">
                  <h3 className="text-base font-black text-[#21362f]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="product-eyebrow text-[#b56a05]">Demo catalog</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Emily Cafe products show why WhatsApp commerce sells well.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                The catalog is designed around custom orders. Each item has variants, add-ons, and delivery context so the demo feels close to a real store.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {EMILY_CAFE_PRODUCTS.map((product) => (
                <article key={product.id} className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(33,54,47,.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-[#b56a05]">{product.category}</p>
                      <h3 className="mt-2 text-xl font-black">{product.name}</h3>
                    </div>
                    <span className="rounded-md bg-[#fff1d7] px-3 py-2 text-xs font-black text-[#8b5204]">{formatInrFromPaisa(product.basePricePaisa)}+</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{product.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <span key={variant.id} className="rounded-full border border-black/8 bg-[#f8f4ed] px-3 py-1 text-xs font-bold text-[#42544e]">
                        {variant.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-black/8 bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
            <div>
              <p className="product-eyebrow text-[#b56a05]">Pricing</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Simple entry pricing, connector scoped separately.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                Start with a complete WhatsApp commerce demo or Google Sheet catalog. Add Shopify, WooCommerce, or custom shopping-system integration after the workflow is proven.
              </p>
              <a href={registerUrl} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#f4b85a] px-6 text-sm font-bold text-[#21362f] shadow-[0_18px_42px_rgba(244,184,90,.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd078]">
                Start with Rs. 6,500 setup
                <Icon name="arrow-right" />
              </a>
            </div>

            <div>
              <div className="grid gap-4 md:grid-cols-3">
                {pricingCards.map((card) => (
                  <article key={card.title} className="rounded-lg border border-black/8 bg-[#f8f4ed] p-5 shadow-[0_18px_50px_rgba(33,54,47,.06)]">
                    <p className="text-xs font-black uppercase text-[#b56a05]">{card.title}</p>
                    <h3 className="mt-3 text-2xl font-black text-[#21362f]">{card.price}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{card.copy}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[#f4b85a]/28 bg-[#fff7e8] p-5">
                <p className="text-xs font-black uppercase text-[#8b5204]">Launch terms</p>
                <p className="mt-2 text-sm leading-6 text-[#59452a]">
                  Most small stores can launch with demo or Google Sheet catalog first. Production connector pricing depends on product count, variant complexity, stock rules, payment flow, and fulfilment needs.
                </p>
              </div>

              <FlowCartPricingCalculator />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-[#f8f4ed] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="product-eyebrow text-[#b56a05]">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Store integration, payments, and WhatsApp Flow details.
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
                FlowCart is strongest where shoppers ask questions before buying: cakes, gifts, food, fashion, cosmetics, handmade goods, and custom services.
              </p>
            </div>
            <div className="grid gap-3">
              {faqs.map((faq, index) => (
                <details key={faq.question} name="flowcart-faq" className="group rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(33,54,47,.06)]" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[#21362f]">
                    <span>{faq.question}</span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff1d7] text-[#b56a05] transition group-open:rotate-45">
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

function RealtimeCommercePrototype() {
  const order = EMILY_CAFE_ORDERS[0];
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-white/12 bg-[#f8f4ed] text-[#21362f] shadow-[0_34px_90px_rgba(10,24,19,.3)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 bg-white px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase text-[#178665]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#178665] shadow-[0_0_0_6px_rgba(23,134,101,.12)]" />
              Realtime order run
            </p>
            <h2 className="mt-1 text-lg font-black">Emily Cafe WhatsApp order</h2>
          </div>
          <p className="rounded-md bg-[#fff1d7] px-3 py-2 text-xs font-black text-[#8b5204]">{order.orderNumber}</p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[.92fr_1.08fr]">
          <div className="border-b border-black/8 bg-[#ede3d5] p-4 lg:border-b-0 lg:border-r">
            <div className="rounded-xl bg-[#fffdf8] p-4 shadow-[0_18px_50px_rgba(33,54,47,.12)]">
              <div className="flex items-center justify-between border-b border-black/8 pb-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#178665] text-xs font-black text-white">WA</span>
                  <div>
                    <p className="text-sm font-black">WhatsApp checkout</p>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">Customer: {order.customerName}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#e9f7f1] px-3 py-1 text-[10px] font-black text-[#178665]">Live</span>
              </div>

              <div className="mt-5 space-y-3">
                <ChatBubble align="left" copy="Need a chocolate cake today evening." />
                <ChatBubble align="right" copy="Sure. Please choose size, message, delivery slot, and add-ons." />
                <div className="grid grid-cols-3 gap-2">
                  <OptionPill label="500g" state="open" />
                  <OptionPill label="1kg" state="selected" />
                  <OptionPill label="2kg" state="open" />
                </div>
                <ChatBubble align="left" copy="1kg. Write Happy Birthday Aarav. Delivery 6 PM." />
                <ChatBubble align="right" copy={`Total ${formatInrFromPaisa(order.totalPaisa)}. Pay now to confirm kitchen prep.`} />
              </div>
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusTile title="Order" value={`${order.productName}, ${order.variantName}`} icon="grid" tone="gold" />
              <StatusTile title="Payment" value="Razorpay link paid" icon="link" tone="green" />
              <StatusTile title="Kitchen" value="Preparing" icon="bell" tone="gold" />
              <StatusTile title="Update" value="Delivery slot sent" icon="message-circle" tone="green" />
            </div>

            <div className="mt-4 border-t border-black/8 pt-4">
              <p className="text-xs font-black uppercase text-[#b56a05]">Merchant dashboard</p>
              <div className="mt-3 grid gap-3">
                <MetricRow label="Paid orders today" value="12" />
                <MetricRow label="Pending payments" value="5" />
                <MetricRow label="Revenue today" value="Rs. 28,450" />
                <MetricRow label="Abandoned carts" value="7" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/8 bg-[#21362f] p-4 text-white">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SyncState title="Catalog" status="4 products" copy="Cake, hamper, platter, cold brew box" />
            <SyncState title="Payment" status="Paid" copy="Razorpay webhook confirms order" />
            <SyncState title="Store" status="Order synced" copy="Connector-ready for Shopify or WooCommerce" />
            <SyncState title="WhatsApp" status="Updates queued" copy="Confirmation and delivery templates" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ align, copy }: { align: "left" | "right"; copy: string }) {
  const isRight = align === "right";
  return (
    <p className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${isRight ? "ml-auto rounded-tr-sm bg-[#fff1d7]" : "rounded-tl-sm bg-[#e9f7f1]"}`}>
      {copy}
    </p>
  );
}

function OptionPill({ label, state }: { label: string; state: "open" | "selected" }) {
  return (
    <div className={`rounded-md border px-3 py-2 text-center text-xs font-black ${state === "selected" ? "border-[#178665] bg-[#e9f7f1] text-[#12664e]" : "border-black/8 bg-white text-[var(--text-muted)]"}`}>
      {label}
      <span className="mt-1 block text-[9px] uppercase">{state}</span>
    </div>
  );
}

function StatusTile({ title, value, icon, tone }: { title: string; value: string; icon: "grid" | "bell" | "link" | "message-circle"; tone: "green" | "gold" }) {
  return (
    <div className="rounded-lg border border-black/8 bg-[#f8f4ed] p-3">
      <span className={`grid h-8 w-8 place-items-center rounded-md ${tone === "green" ? "bg-[#e9f7f1] text-[#178665]" : "bg-[#fff1d7] text-[#b56a05]"}`}>
        <Icon name={icon} />
      </span>
      <p className="mt-3 text-[10px] font-black uppercase text-[var(--text-muted)]">{title}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-[#f8f4ed] px-3 py-2">
      <p className="text-xs font-bold text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-black text-[#21362f]">{value}</p>
    </div>
  );
}

function SyncState({ title, status, copy }: { title: string; status: string; copy: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[.055] p-3">
      <p className="text-[10px] font-black uppercase text-[#f4b85a]">{title}</p>
      <h3 className="mt-2 text-sm font-black">{status}</h3>
      <p className="mt-1 text-xs leading-5 text-white/55">{copy}</p>
    </div>
  );
}

function Audience({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_18px_60px_rgba(33,54,47,.08)]">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p>
    </article>
  );
}
