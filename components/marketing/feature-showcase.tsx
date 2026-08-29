"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const features = [
  {
    id: "broadcast",
    label: "Broadcasts",
    icon: "megaphone" as const,
    screen: "Campaign studio",
    title: "Broadcast messages at the right moment",
    description: "Segment opted-in audiences, use approved templates, schedule delivery, and see replies without leaving the campaign.",
    metric: "8,940",
    metricLabel: "recipients ready",
    accent: "91.8% delivered",
    steps: ["Choose audience", "Approve template", "Schedule & monitor"],
    activity: [["Monsoon stay offer", "Scheduled · 6:30 PM"], ["VIP repeat guests", "2,140 contacts"], ["Template quality", "High"]]
  },
  {
    id: "chatbot",
    label: "AI Chatbot",
    icon: "sparkles" as const,
    screen: "Chatbot builder",
    title: "Answer, qualify, and hand over with context",
    description: "Build guided conversations from approved knowledge and route high-intent or sensitive chats to the right person.",
    metric: "68%",
    metricLabel: "resolved automatically",
    accent: "32 leads qualified today",
    steps: ["Detect intent", "Answer or collect", "Handover safely"],
    activity: [["Availability assistant", "Live"], ["Low-confidence rule", "Human queue"], ["Knowledge coverage", "94%"]]
  },
  {
    id: "commerce",
    label: "E-commerce",
    icon: "grid" as const,
    screen: "Commerce automation",
    title: "Move customers from catalogue to confirmed order",
    description: "Share products, recover incomplete checkouts, confirm orders, and keep delivery updates inside WhatsApp.",
    metric: "₹1.84L",
    metricLabel: "revenue recovered",
    accent: "74 orders this week",
    steps: ["Show catalogue", "Create checkout", "Confirm & update"],
    activity: [["Abandoned cart flow", "18 recovered"], ["Order confirmations", "100% sent"], ["Inventory sync", "Connected"]]
  },
  {
    id: "retargeting",
    label: "Retargeting",
    icon: "bar-chart-3" as const,
    screen: "Retargeting engine",
    title: "Bring warm buyers back with useful context",
    description: "Create consent-aware segments from clicks, replies, purchases, and drop-offs—then personalize the next message.",
    metric: "3.2×",
    metricLabel: "return on campaign spend",
    accent: "21.6% conversion",
    steps: ["Build segment", "Personalize offer", "Measure revenue"],
    activity: [["Clicked, no purchase", "842 contacts"], ["Repeat-buyer segment", "Ready"], ["Suppression rules", "Active"]]
  },
  {
    id: "reminders",
    label: "Reminders",
    icon: "bell" as const,
    screen: "Reminder automation",
    title: "Send reminders customers can act on",
    description: "Trigger appointment, payment, renewal, and booking reminders with one-tap confirmations and smart follow-ups.",
    metric: "41%",
    metricLabel: "fewer missed appointments",
    accent: "316 confirmations today",
    steps: ["Watch event", "Send reminder", "Confirm or follow up"],
    activity: [["Tomorrow's appointments", "184 queued"], ["Payment due", "42 reminders"], ["Customer confirmations", "86%"]]
  },
  {
    id: "payments",
    label: "Payments",
    icon: "link" as const,
    screen: "Payment collection",
    title: "Collect payment without breaking the conversation",
    description: "Send secure payment links, follow up automatically, capture status, and issue a confirmation in the same thread.",
    metric: "₹3.6L",
    metricLabel: "collected this month",
    accent: "94% payment success",
    steps: ["Create request", "Track payment", "Send receipt"],
    activity: [["Pending payment links", "27"], ["Auto-follow-up", "Tomorrow · 10 AM"], ["Payment provider", "Connected"]]
  },
  {
    id: "forms",
    label: "Forms & surveys",
    icon: "file-text" as const,
    screen: "Conversational forms",
    title: "Collect structured answers inside WhatsApp",
    description: "Turn lead forms, surveys, registrations, and feedback into guided conversations with validated fields and clean exports.",
    metric: "1,248",
    metricLabel: "responses captured",
    accent: "78% completion rate",
    steps: ["Ask naturally", "Validate response", "Sync the record"],
    activity: [["Lead qualification", "12 fields"], ["Guest preference survey", "Live"], ["Google Sheets sync", "Connected"]]
  },
  {
    id: "reviews",
    label: "Review requests",
    icon: "message-circle" as const,
    screen: "Review automation",
    title: "Ask for reviews when satisfaction is highest",
    description: "Trigger a personal request after delivery or checkout, capture private feedback, and guide happy customers to public reviews.",
    metric: "4.8",
    metricLabel: "average customer rating",
    accent: "186 new reviews",
    steps: ["Detect success", "Request feedback", "Route the response"],
    activity: [["Review", "Live"], ["Private feedback", "14 responses"], ["Public review clicks", "63%"]]
  }
] as const;

export function FeatureShowcase() {
  const [activeId, setActiveId] = useState<(typeof features)[number]["id"]>("broadcast");
  const active = features.find((feature) => feature.id === activeId) ?? features[0];

  return (
    <div id="product" className="relative mx-auto mt-16 max-w-6xl scroll-mt-24 translate-y-px text-left shadow-[0_45px_100px_rgba(0,0,0,.45)]">
      <div className="overflow-hidden rounded-t-2xl border border-white/15 bg-[#2b2b2b] p-2 pb-0 sm:p-3 sm:pb-0">
        <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
          <i className="h-2.5 w-2.5 rounded-full bg-white/15"/><i className="h-2.5 w-2.5 rounded-full bg-white/15"/><i className="h-2.5 w-2.5 rounded-full bg-white/15"/>
          <span className="ml-2 text-[11px] text-white/30">app.aifrogi.com — {active.screen}</span>
          <span className="ml-auto hidden items-center gap-2 text-[10px] font-semibold text-white/35 sm:flex"><i className="h-1.5 w-1.5 rounded-full bg-[#e2c66d] shadow-[0_0_8px_#e2c66d]"/>Sample UI · hover or tap</span>
        </div>

        <div className="grid min-h-[390px] grid-cols-[54px_1fr] sm:grid-cols-[54px_220px_1fr]">
          <aside className="flex flex-col items-center gap-5 border-r border-white/8 py-5 text-white/24">
            <Icon name="grid" className="text-[#e2c66d]"/><Icon name="message-circle"/><Icon name="megaphone"/><Icon name="bar-chart-3"/><Icon name="settings"/>
          </aside>

          <aside className="hidden border-r border-white/8 p-4 sm:flex sm:flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#e2c66d]">{active.label}</span>
            <p className="mt-4 text-[11px] leading-5 text-white/42">{active.description}</p>
            <div className="mt-auto rounded-xl border border-[#8a6a16]/20 bg-[#8a6a16]/8 p-4">
              <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#e2c66d]">Use case</span>
              <strong className="mt-2 block text-base leading-5 text-white">{active.screen}</strong>
              <p className="mt-3 text-[11px] leading-5 text-white/45">Every reply, status, and next action stays visible to the team.</p>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-5">
              <div><span className="text-[10px] uppercase tracking-[.1em] text-white/28">Automation workspace</span><h2 className="mt-1 text-sm font-semibold tracking-normal text-white sm:text-base">{active.title}</h2></div>
              <span className="shrink-0 rounded-full border border-[#8a6a16]/35 bg-[#8a6a16]/10 px-3 py-1 text-[10px] font-semibold text-[#e2c66d]">Live</span>
            </div>

            <div key={active.id} className="feature-showcase-reveal flex flex-1 flex-col gap-4 p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-3">
                {active.steps.map((step, index) => <div key={step} className="relative rounded-lg border border-white/8 bg-white/[.035] p-3"><span className="text-[9px] font-bold text-[#e2c66d]">0{index + 1}</span><strong className="mt-2 block text-[11px] font-semibold text-white/78">{step}</strong>{index < active.steps.length - 1 ? <span className="absolute -right-2.5 top-1/2 z-10 hidden h-px w-5 bg-[#8a6a16]/45 sm:block"/> : null}</div>)}
              </div>

              <div className="grid flex-1 gap-3 lg:grid-cols-[1.25fr_.75fr]">
                <div className="rounded-xl border border-white/8 bg-[#1c1c1c] p-4">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-white/38">Sample performance view</span><span className="text-[10px] text-[#e2c66d]">Illustrative data</span></div>
                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[36,54,43,68,57,82,72,91,78,96].map((height,index)=><i key={index} style={{height:`${height}%`}} className="flex-1 rounded-t-sm bg-gradient-to-t from-[#8a6a16]/20 to-[#b28728]/80 transition-all duration-500"/>)}
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-white/8 pt-3"><div><strong className="text-xl text-white sm:text-2xl">{active.metric}</strong><span className="ml-2 text-[10px] text-white/32">{active.metricLabel}</span></div><span className="text-[10px] font-semibold text-[#e2c66d]">{active.accent}</span></div>
                </div>

                <div className="space-y-2">
                  {active.activity.map(([label,value],index)=><div key={label} className="rounded-lg border border-white/8 bg-white/[.035] p-3"><div className="flex items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${index===0?"bg-[#e2c66d] shadow-[0_0_8px_#e2c66d]":"bg-white/20"}`}/><span className="text-[9px] text-white/32">{index===0?"Live now":"Connected"}</span></div><strong className="mt-2 block text-[10px] text-white/72">{label}</strong><span className="mt-0.5 block text-[9px] text-white/32">{value}</span></div>)}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div role="tablist" aria-label="AiFrogi platform capabilities" className="overflow-x-auto border-x border-b border-white/10 bg-[#101010] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid min-w-max grid-flow-col auto-cols-[145px] sm:auto-cols-[155px] lg:min-w-0 lg:grid-cols-8">
          {features.map((feature) => {
            const selected = feature.id === active.id;
            return <button key={feature.id} type="button" role="tab" aria-selected={selected} onMouseEnter={() => setActiveId(feature.id)} onFocus={() => setActiveId(feature.id)} onClick={() => setActiveId(feature.id)} className={`group relative flex min-h-[78px] items-center gap-2.5 border-r border-white/6 px-3 text-left transition-all duration-200 ${selected?"bg-white/[.075] text-white":"text-white/38 hover:bg-white/[.035] hover:text-white/72"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${selected?"border-[#8a6a16]/45 bg-[#8a6a16]/15 text-[#e2c66d]":"border-white/8 bg-white/[.025] text-white/35"}`}><Icon name={feature.icon}/></span><span className="text-[11px] font-semibold leading-4">{feature.label}</span><i className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-[#b28728] transition-transform duration-300 ${selected?"scale-x-100":"scale-x-0"}`}/></button>;
          })}
        </div>
      </div>
    </div>
  );
}
