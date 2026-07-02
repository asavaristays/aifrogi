'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { DashboardMode, LeadRecord } from './types';

type ChatDetailProps = {
  mode: DashboardMode;
  lead: LeadRecord;
  typing: boolean;
  activityNote: string;
  sendError: string | null;
  sendFeedback: string | null;
  sendFeedbackKind: 'success' | 'error' | null;
  isSendingMessage: boolean;
  onJoinChat: () => void;
  onCallGuest: () => void;
  onSendMessage: (message: string) => Promise<boolean>;
};

function detailBubbleClass(from: LeadRecord['transcript'][number]['from']) {
  if (from === 'guest') {
    return 'ml-auto bg-[#dcfce7] text-black';
  }

  if (from === 'agent') {
    return 'bg-white text-black';
  }

  return 'bg-[#f0fdf4] text-black';
}

const railCopy: Record<DashboardMode, { eyebrow: string; title: string; helper: string; placeholder: string }> = {
  whatsapp: {
    eyebrow: 'Right rail',
    title: 'Live chat detail',
    helper: 'Selected WhatsApp conversation, timeline, and guest actions.',
    placeholder: 'Type WhatsApp reply...'
  },
  ai: {
    eyebrow: 'Inbound chat',
    title: 'AI bot conversation',
    helper: 'Selected website AI enquiry, timeline, and human reply tools.',
    placeholder: 'Type inbound chat reply...'
  }
};

export function ChatDetail({
  mode,
  lead,
  typing,
  activityNote,
  sendError,
  sendFeedback,
  sendFeedbackKind,
  isSendingMessage,
  onJoinChat,
  onCallGuest,
  onSendMessage
}: ChatDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const copy = railCopy[mode];

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [lead.id, lead.transcript.length, typing]);

  async function submitMessage() {
    const message = draftMessage.trim();
    if (!message || isSendingMessage) return;
    const sent = await onSendMessage(message);
    if (sent) {
      setDraftMessage('');
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_14px_34px_rgba(24,18,72,0.05)]">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--primary)]">{copy.eyebrow}</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-black">{copy.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{copy.helper}</p>
          </div>
            <span className={cn('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]', lead.status === 'Confirmed' ? 'bg-[#dcfce7] text-[#15803d]' : lead.status === 'Follow-up' ? 'bg-[#fef3c7] text-[#b45309]' : lead.status === 'Pending' ? 'bg-[#e5e7eb] text-[#475569]' : 'bg-[#ecfdf3] text-[#c725ba]')}>
              {lead.status}
            </span>
        </div>
        <div className="mt-4 grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Guest</p>
            <p className="mt-1 text-sm font-bold text-black">{lead.name}</p>
            <p className="mt-1 text-sm text-slate-500">{lead.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Activity</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{activityNote}</p>
            <p className="mt-1 text-xs text-slate-500">Updated {lead.updatedAtLabel}</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div
          ref={scrollRef}
          className="max-h-[520px] space-y-3 overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-4"
        >
          {lead.transcript.map((message) => (
            <div
              key={message.id}
              className={cn('w-fit max-w-[86%] rounded-[22px] px-4 py-3 text-[13px] leading-6 shadow-sm', detailBubbleClass(message.from))}
            >
              <p>{message.text}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">{message.time}</p>
            </div>
          ))}

          {typing ? (
            <div className="w-fit rounded-[22px] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#25D366] [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#25D366] [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#25D366]" />
              </div>
            </div>
          ) : null}
        </div>

        {sendFeedback ? (
          <div
            className={cn(
              'mt-4 rounded-[20px] border px-4 py-3 text-sm font-semibold shadow-[0_12px_28px_rgba(15,23,42,0.08)]',
              sendFeedbackKind === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            )}
          >
            {sendFeedback}
          </div>
        ) : null}

          <div className="mt-4 rounded-[24px] border border-[#d8dee8] bg-white p-2 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <input
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-slate-400 focus:border-[#25D366]/60 focus:ring-4 focus:ring-[#25D366]/10"
              value={draftMessage}
              placeholder={copy.placeholder}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
            />
            <span
              className={cn(
                'inline-flex h-9 min-w-[70px] cursor-pointer items-center justify-center rounded-full border border-[#d8dee8] bg-[#d9fbe6] px-3 py-1 text-[8px] font-black uppercase tracking-[0.28em] text-[#c725ba] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition hover:-translate-y-0.5 hover:bg-[#c7f7d8] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20',
                (!draftMessage.trim() || isSendingMessage) && 'pointer-events-none opacity-45'
              )}
              role="button"
              tabIndex={0}
              onClick={() => void submitMessage()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
            >
              {isSendingMessage ? 'Sending' : 'Send'}
            </span>
          </div>
          {sendError ? <p className="mt-2 text-xs font-semibold text-rose-500">{sendError}</p> : null}
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Guest actions</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span
              className="inline-flex h-7 min-w-[86px] cursor-pointer items-center justify-center rounded-full border border-[#d8dee8] bg-[#d9fbe6] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.28em] text-[#c725ba] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition hover:-translate-y-0.5 hover:bg-[#c7f7d8] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
              role="button"
              tabIndex={0}
              onClick={onJoinChat}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onJoinChat();
                }
              }}
            >
              Join Chat
            </span>
            <span
              className="inline-flex h-7 min-w-[86px] cursor-pointer items-center justify-center rounded-full border border-[#d8dee8] bg-[#d9fbe6] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.28em] text-[#c725ba] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition hover:-translate-y-0.5 hover:bg-[#c7f7d8] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
              role="button"
              tabIndex={0}
              onClick={onCallGuest}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onCallGuest();
                }
              }}
            >
              Call Guest
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
