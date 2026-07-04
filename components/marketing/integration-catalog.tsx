"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { IntegrationLogo } from "@/components/marketing/integration-logo";

const integrations = [
  {
    id: "shopify",
    name: "Shopify",
    src: "/integrations/shopify.svg",
    category: "Commerce",
    status: "Available",
    title: "Recover checkout and keep every order moving.",
    description: "Connect Shopify storefront and checkout events to timely WhatsApp conversations.",
    outcomes: ["Abandoned checkout recovery", "Order and payment confirmation", "Fulfilment and delivery updates"],
    flow: ["Shopify event", "Consent check", "WhatsApp update", "Order action"],
    trust: "Shopify Checkout is included here. Protected customer data is accessed only through approved Shopify permissions."
  },
  {
    id: "razorpay",
    name: "Razorpay",
    src: "/integrations/razorpay.svg",
    category: "Payments",
    status: "Available",
    title: "Collect and confirm payment without leaving the conversation.",
    description: "Create a hosted payment link, share it in WhatsApp, and update the conversation when its status changes.",
    outcomes: ["Secure hosted payment links", "Paid, partial, expired, and cancelled status", "Automatic confirmation and follow-up"],
    flow: ["Payment request", "Razorpay link", "Verified webhook", "Status confirmed"],
    trust: "Payment happens on Razorpay. AiFrogi does not collect the customer’s card, bank, or UPI credentials."
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    src: "/integrations/woocommerce.svg",
    category: "Commerce",
    status: "Custom",
    title: "Turn store events into useful customer updates.",
    description: "Connect order, customer, and product events through WooCommerce REST APIs and signed webhooks.",
    outcomes: ["Order confirmations", "Cart and product follow-up", "Delivery and repeat-purchase journeys"],
    flow: ["Store event", "Webhook verified", "Workflow rule", "WhatsApp action"],
    trust: "The connector requests only the store permissions required for the approved workflow."
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    src: "/integrations/zoho.svg",
    category: "CRM",
    status: "Custom",
    title: "Keep leads, owners, and follow-ups synchronized.",
    description: "Create or update CRM records from WhatsApp and react to lead or deal-stage changes.",
    outcomes: ["Lead capture and deduplication", "Owner and stage synchronization", "Sales reminders and handover"],
    flow: ["Customer reply", "Lead qualified", "CRM updated", "Owner notified"],
    trust: "Field mapping is agreed before activation so only approved customer information is synchronized."
  },
  {
    id: "hubspot",
    name: "HubSpot",
    src: "/integrations/hubspot.svg",
    category: "CRM",
    status: "Custom",
    title: "Connect conversations with contacts, deals, and tickets.",
    description: "Use CRM events to trigger relevant follow-up while keeping sales context available to agents.",
    outcomes: ["Contact and deal updates", "Ticket creation", "Lifecycle-based WhatsApp workflows"],
    flow: ["CRM event", "Rule matched", "WhatsApp follow-up", "Outcome logged"],
    trust: "OAuth access can be reviewed and revoked by the customer at any time."
  },
  {
    id: "sheets",
    name: "Google Sheets",
    src: "/integrations/google-sheets.svg",
    category: "Data",
    status: "Custom",
    title: "Move structured WhatsApp responses into familiar sheets.",
    description: "Send form answers, survey responses, leads, and operational updates to an approved spreadsheet.",
    outcomes: ["Lead and form collection", "Survey exports", "Simple operational reporting"],
    flow: ["Answer collected", "Fields validated", "Row created", "Team notified"],
    trust: "Access is limited to the approved spreadsheet and can be disconnected without affecting WhatsApp history."
  },
  {
    id: "calendar",
    name: "Google Calendar",
    src: "/integrations/google-calendar.svg",
    category: "Booking",
    status: "Custom",
    title: "Turn booking intent into confirmed appointments.",
    description: "Create events, send reminders, and keep rescheduling context inside WhatsApp.",
    outcomes: ["Appointment confirmation", "Reminder automation", "Reschedule and cancellation updates"],
    flow: ["Time selected", "Event created", "Reminder sent", "Attendance updated"],
    trust: "Calendar access is scoped to the calendars approved during setup."
  },
  {
    id: "stripe",
    name: "Stripe",
    src: "/integrations/stripe.svg",
    category: "Payments",
    status: "Custom",
    title: "Add international hosted-payment workflows.",
    description: "Create secure payment links and trigger confirmations from verified payment events.",
    outcomes: ["Hosted checkout links", "Payment confirmation", "Failed-payment follow-up"],
    flow: ["Payment needed", "Hosted checkout", "Webhook received", "Customer updated"],
    trust: "Sensitive payment details remain with the payment provider, outside AiFrogi."
  },
  {
    id: "make",
    name: "Make",
    src: "/integrations/make.svg",
    category: "Automation",
    status: "Custom",
    title: "Connect specialized tools through controlled workflows.",
    description: "Use approved webhook events to bridge AiFrogi with internal systems and long-tail SaaS tools.",
    outcomes: ["Custom event routing", "Multi-step operations", "Internal system updates"],
    flow: ["Approved event", "Webhook sent", "Scenario runs", "Result returned"],
    trust: "Every workflow documents its trigger, shared fields, destination, and failure handling."
  }
] as const;

export function IntegrationCatalog() {
  const [activeId, setActiveId] = useState<(typeof integrations)[number]["id"]>("shopify");
  const active = integrations.find((integration) => integration.id === activeId) ?? integrations[0];

  return (
    <section id="catalog" className="bg-[#fbf8fc] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="product-eyebrow">Integration directory</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Choose a system. See exactly what connects.</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">Select a logo to explore the customer journey, data flow, and control model.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {integrations.map((integration) => {
              const selected = integration.id === active.id;
              return (
                <button
                  key={integration.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveId(integration.id)}
                  className={`group min-h-28 rounded-xl border bg-white p-4 text-left transition ${selected ? "border-[#d92bcb] shadow-[0_12px_34px_rgba(217,43,203,.1)]" : "border-black/8 hover:border-[#d92bcb]/45"}`}
                >
                  <IntegrationLogo src={integration.src} name={integration.name} />
                  <strong className="mt-3 block text-sm">{integration.name}</strong>
                  <span className={`mt-1 block text-[10px] font-bold uppercase tracking-[.08em] ${integration.status === "Available" ? "text-[#178665]" : "text-[#8a8290]"}`}>{integration.status}</span>
                </button>
              );
            })}
          </div>

          <article key={active.id} className="feature-showcase-reveal rounded-xl bg-[#251f2d] p-6 text-white sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="group flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-white p-2.5"><IntegrationLogo src={active.src} name={active.name} size="lg" /></span>
                <div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#ff8af1]">{active.category}</p><h3 className="mt-1 text-xl font-bold">{active.name}</h3></div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${active.status === "Available" ? "bg-[#dff7ed] text-[#116d51]" : "bg-white/8 text-white/58"}`}>{active.status}</span>
            </div>

            <h4 className="mt-7 max-w-xl text-2xl font-semibold tracking-[-.025em] sm:text-3xl">{active.title}</h4>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">{active.description}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {active.outcomes.map((outcome) => <div key={outcome} className="border-t border-white/12 pt-3 text-sm font-semibold text-white/78">{outcome}</div>)}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2" aria-label={`${active.name} integration flow`}>
              {active.flow.map((step, index) => <span key={step} className="contents"><span className="rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/66">{step}</span>{index < active.flow.length - 1 ? <Icon name="arrow-right" className="text-[#ff8af1]" /> : null}</span>)}
            </div>

            <p className="mt-8 border-t border-white/12 pt-5 text-xs leading-5 text-white/48"><strong className="text-white/78">Trust control:</strong> {active.trust}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
