"use client";

import { useState, type FormEvent } from "react";

type Message = { role: "visitor" | "bot"; text: string; evidenceId?: string | null; feedback?: boolean | null; feedbackNotice?: string };

export function WebsiteBotEmbed({ slug }: { slug: string }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", text: "Hello. How can I help with your business enquiry today?" }]);
  const [text, setText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID().replaceAll("-", ""));
  const [visitorToken, setVisitorToken] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || waiting) return;
    setText(""); setWaiting(true); setMessages((current) => [...current, { role: "visitor", text: message }]);
    const response = await fetch(`/api/public/website-bot/${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, sessionId, visitorToken: visitorToken || undefined }) });
    const payload = await response.json().catch(() => null) as { answer?: string; error?: string; visitorToken?: string; answerEvidenceId?: string | null } | null;
    if (payload?.visitorToken) setVisitorToken(payload.visitorToken);
    setMessages((current) => [...current, { role: "bot", text: response.ok ? payload?.answer || "I could not prepare an answer." : payload?.error || "The bot is temporarily unavailable.", evidenceId: response.ok ? payload?.answerEvidenceId : null }]);
    setWaiting(false);
  }

  async function submitFeedback(index: number, helpful: boolean) {
    const message = messages[index];
    if (!message?.evidenceId || !visitorToken || message.feedback !== undefined) return;
    setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, feedback: helpful, feedbackNotice: "Saving feedback…" } : item));
    const response = await fetch(`/api/public/website-bot/${encodeURIComponent(slug)}/feedback`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${visitorToken}` }, body: JSON.stringify({ evidenceId: message.evidenceId, helpful }) });
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, feedback: response.ok ? helpful : undefined, feedbackNotice: response.ok ? payload?.message || "Feedback saved." : payload?.error || "Could not save feedback." } : item));
  }

  return <main className="flex h-screen min-h-[520px] flex-col overflow-hidden rounded-[22px] border border-[#8a6a16]/45 bg-[#101010] text-white">
    <header className="border-b border-white/10 px-5 py-4"><p className="text-[10px] uppercase tracking-[.18em] text-[#e2c66d]">Sovereign Business Bot</p><h1 className="mt-1 text-lg font-semibold">AI Business Assistant</h1><p className="mt-1 text-xs text-white/48">AI ready · Human handover available</p></header>
    <section aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-5">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "visitor" ? "ml-auto max-w-[88%]" : "max-w-[88%]"}><p className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "visitor" ? "bg-[#8a6a16]" : "bg-white/8 text-white/86"}`}>{message.text}</p>{message.role === "bot" && message.evidenceId ? <div className="mt-1.5 px-2 text-[11px] text-white/48">{message.feedback === undefined ? <div className="flex items-center gap-2"><span>Did this answer help?</span><button type="button" onClick={() => submitFeedback(index, true)} className="rounded-full border border-white/15 px-2.5 py-1 text-white/75 hover:border-[#e2c66d] hover:text-[#e2c66d]">Yes</button><button type="button" onClick={() => submitFeedback(index, false)} className="rounded-full border border-white/15 px-2.5 py-1 text-white/75 hover:border-[#e2c66d] hover:text-[#e2c66d]">No</button></div> : <p className={message.feedback ? "text-[#78d9b7]" : "text-[#e2c66d]"}>{message.feedbackNotice || "Feedback saved."}</p>}</div> : null}</div>)}{waiting ? <p className="w-fit rounded-2xl bg-white/8 px-4 py-3 text-sm text-[#e2c66d]">AI responding ···</p> : null}</section>
    <form onSubmit={send} className="border-t border-white/10 p-3"><div className="flex gap-2"><input aria-label="Message" value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask the business…" className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/7 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-[#8a6a16]" /><button disabled={waiting || !text.trim()} className="rounded-xl bg-[#8a6a16] px-4 text-sm font-semibold disabled:opacity-40">Send</button></div><p className="mt-2 text-center text-[10px] text-white/38">Do not share passwords, OTPs or payment details.</p><p className="mt-1 text-center text-[10px] text-[#e2c66d]">Powered by AiFrogi</p></form>
  </main>;
}
