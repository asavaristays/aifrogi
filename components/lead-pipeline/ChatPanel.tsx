'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardMode, LeadRecord } from './types';

type ChatPanelProps = {
  lead: LeadRecord;
  draftMessage: string;
  onDraftChange: (value: string) => void;
  onSend: (value: string) => void;
  typing: boolean;
  mode: DashboardMode;
  collapsed?: boolean;
};

function bubbleClass(from: LeadRecord['transcript'][number]['from']) {
  if (from === 'guest') {
    return 'ml-auto bg-[#DCF8C6] text-[#111827]';
  }

  if (from === 'agent') {
    return 'bg-white text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.08)]';
  }

  return 'bg-[#e8f4ff] text-[#0f172a]';
}

export function ChatPanel({
  lead,
  draftMessage,
  onDraftChange,
  onSend,
  typing,
  mode,
  collapsed = false
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const transcript = useMemo(() => lead.transcript, [lead.transcript]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [lead.id, transcript.length, typing]);

  return (
    <section className={cn('overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]', collapsed && 'xl:block')}>
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#075E54,#0f172a)] p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-lg font-black text-[#25D366] shadow-inner shadow-black/10 ring-1 ring-white/10">
              A
            </div>
            <div>
              <p className="text-base font-black tracking-tight">AiFrogi</p>
              <p className="text-xs font-medium uppercase tracking-[0.26em] text-white/60">
                {mode === 'whatsapp' ? 'AI Assistant' : 'AI Front Desk'}
              </p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-[#25D366]">
            Online
          </div>
        </div>
      </div>

      <div className="bg-[#efeae2] p-3 sm:p-4">
        <div
          ref={scrollRef}
          className="max-h-[430px] space-y-3 overflow-y-auto rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_45%),linear-gradient(180deg,#f5efe7,#efe8de)] p-3 pr-2 shadow-inner sm:max-h-[520px]"
        >
          {transcript.map((message) => (
            <div
              key={message.id}
              className={cn(
                'w-fit max-w-[86%] rounded-[22px] px-4 py-3 text-[13px] leading-6 shadow-sm sm:text-sm',
                bubbleClass(message.from)
              )}
            >
              <p>{message.text}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">{message.time}</p>
            </div>
          ))}

          {typing ? (
            <div className="w-fit rounded-[22px] bg-white px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#25D366] [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#25D366] [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#25D366]" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 rounded-[18px] bg-[#f8fafc] p-2">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500 transition hover:-translate-y-0.5 hover:text-[#075E54]"
              aria-label="Attach message"
            >
              +
            </button>
            <input
              value={draftMessage}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSend(draftMessage);
                }
              }}
              placeholder="Type a message..."
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <Button
              type="button"
              className="h-8 rounded-full bg-[#25D366] px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(37,211,102,0.26)] transition hover:-translate-y-0.5 hover:bg-[#1fb85a]"
              onClick={() => onSend(draftMessage)}
            >
              Send
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] font-medium text-slate-500">Press Enter to send. Replies stay inside the same live chat.</p>
        </div>
      </div>
    </section>
  );
}
