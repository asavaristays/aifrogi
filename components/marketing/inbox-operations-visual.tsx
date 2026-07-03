"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const useCases = [
  {
    title: "Broadcast message",
    conversation: "Broadcast reply",
    message: "Interested in the offer",
    short: "Approved campaign → replies in inbox",
    detail: "Send approved WhatsApp campaigns to opted-in audiences and continue every response as a normal customer conversation.",
    outcome: "More replies, less manual follow-up"
  },
  {
    title: "AI chatbot",
    conversation: "Chatbot enquiry",
    message: "Need product details",
    short: "Answer → qualify → handoff",
    detail: "Handle common questions instantly, qualify intent, collect details, and pass sensitive or high-value chats to a person.",
    outcome: "Faster response without losing control"
  },
  {
    title: "E-commerce retargeting",
    conversation: "Cart recovery",
    message: "Still thinking",
    short: "Cart / interest → useful follow-up",
    detail: "Bring back buyers who viewed, clicked, abandoned, or purchased with a relevant next message instead of a generic blast.",
    outcome: "Higher conversion from warm customers"
  },
  {
    title: "Reminders",
    conversation: "Reminder reply",
    message: "Confirming today",
    short: "Due date → confirmation",
    detail: "Send appointment, booking, payment, renewal, and service reminders with simple customer replies and team visibility.",
    outcome: "Fewer misses, clearer operations"
  },
  {
    title: "Payment collection",
    conversation: "Payment pending",
    message: "Link sent",
    short: "Payment link → status → receipt",
    detail: "Share payment links, watch status, follow up when pending, and confirm collection inside the same WhatsApp thread.",
    outcome: "Less chasing, faster collection"
  },
  {
    title: "Forms, survey, review",
    conversation: "Review request",
    message: "Feedback requested",
    short: "Answers → record → feedback",
    detail: "Collect lead forms, surveys, preferences, feedback, and review requests conversationally without sending customers elsewhere.",
    outcome: "Better data and better customer experience"
  }
];

export function InboxOperationsVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = useCases[activeIndex];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#17131d] text-white shadow-[0_30px_90px_rgba(0,0,0,.35)]">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <i className="h-2.5 w-2.5 rounded-full bg-white/16" />
        <i className="h-2.5 w-2.5 rounded-full bg-white/16" />
        <i className="h-2.5 w-2.5 rounded-full bg-white/16" />
        <span className="ml-2 text-[11px] text-white/35">app.aifrogi.com — Inbox</span>
        <span className="ml-auto rounded-full bg-[#d92bcb]/15 px-3 py-1 text-[10px] font-bold text-[#ff8af1]">Live operations</span>
      </div>

      <div className="grid md:min-h-[420px] md:grid-cols-[250px_1fr]">
        <aside className="border-b border-white/8 p-4 md:border-b-0 md:border-r">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-white/38">Open conversations</p>
          <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:mt-5 md:block md:space-y-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
            {useCases.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className={`w-[184px] shrink-0 snap-start rounded-xl p-3 text-left transition md:w-full ${index === activeIndex ? "bg-[#d92bcb]/18 shadow-[inset_0_0_0_1px_rgba(255,138,241,.25)]" : "bg-white/[.045] hover:bg-white/[.075]"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-black text-white ${index === activeIndex ? "bg-[#d92bcb]" : "bg-[#5a3561]"}`}>{item.conversation.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong className="block text-xs">{item.conversation}</strong>
                    <span className="text-[10px] text-white/38">{item.message}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#ff8af1]">One inbox, many outcomes</p>
              <h3 className="mt-2 text-xl font-semibold sm:text-2xl">Every reply becomes the right next action.</h3>
            </div>
            <Icon name="message-circle" className="h-6 w-6 text-[#ff8af1]" />
          </div>

          <div className="mt-6 grid gap-2 sm:mt-8 sm:grid-cols-2">
            {useCases.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className={`border-t pt-4 text-left transition ${index === activeIndex ? "border-[#ff8af1] text-white" : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"}`}
              >
                <strong className="text-sm">{item.title}</strong>
                <p className="mt-2 text-xs leading-5 text-white/48">{item.short}</p>
              </button>
            ))}
          </div>

          <div key={active.title} className="feature-showcase-reveal mt-6 border-l-2 border-[#ff8af1] pl-4 sm:mt-8">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#ff8af1]">Use case detail</p>
            <h4 className="mt-2 text-xl font-semibold">{active.title}</h4>
            <p className="mt-3 text-sm leading-6 text-white/58">{active.detail}</p>
            <p className="mt-4 text-sm font-semibold text-white">{active.outcome}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
