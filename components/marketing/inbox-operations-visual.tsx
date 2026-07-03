import { Icon } from "@/components/icons";

const conversations = [
  ["Broadcast reply", "Interested in the offer"],
  ["Chatbot", "Need product details"],
  ["Payment", "Link sent"],
  ["Review", "Feedback requested"]
];

const lanes = [
  ["Broadcast", "Approved template → audience → replies"],
  ["AI chatbot", "Answer → qualify → handoff"],
  ["Retargeting", "Abandoned cart → useful follow-up"],
  ["Reminders", "Due date → confirmation"],
  ["Payments", "Link → status → receipt"],
  ["Forms & reviews", "Collect answers → sync record"]
];

export function InboxOperationsVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#17131d] text-white shadow-[0_30px_90px_rgba(0,0,0,.35)]">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <i className="h-2.5 w-2.5 rounded-full bg-white/16" />
        <i className="h-2.5 w-2.5 rounded-full bg-white/16" />
        <i className="h-2.5 w-2.5 rounded-full bg-white/16" />
        <span className="ml-2 text-[11px] text-white/35">app.aifrogi.com — Inbox</span>
        <span className="ml-auto rounded-full bg-[#d92bcb]/15 px-3 py-1 text-[10px] font-bold text-[#ff8af1]">Live operations</span>
      </div>

      <div className="grid min-h-[420px] md:grid-cols-[250px_1fr]">
        <aside className="border-b border-white/8 p-4 md:border-b-0 md:border-r">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-white/38">Open conversations</p>
          <div className="mt-5 space-y-3">
            {conversations.map(([title, copy], index) => (
              <div key={title} className={`rounded-xl p-3 ${index === 0 ? "bg-[#d92bcb]/16" : "bg-white/[.045]"}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#5a3561] text-[10px] font-black text-white">{title.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong className="block text-xs">{title}</strong>
                    <span className="text-[10px] text-white/38">{copy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#ff8af1]">One inbox, many outcomes</p>
              <h3 className="mt-2 text-2xl font-semibold">Every reply becomes the right next action.</h3>
            </div>
            <Icon name="message-circle" className="h-6 w-6 text-[#ff8af1]" />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {lanes.map(([title, flow]) => (
              <div key={title} className="border-t border-white/10 pt-4">
                <strong className="text-sm">{title}</strong>
                <p className="mt-2 text-xs leading-5 text-white/48">{flow}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-full bg-white/[.045] px-4 py-3 text-xs text-white/58">
            <span className="h-2 w-2 rounded-full bg-[#ff8af1] shadow-[0_0_12px_#ff8af1]" />
            Human handoff stays available whenever automation is unsure.
          </div>
        </section>
      </div>
    </div>
  );
}
