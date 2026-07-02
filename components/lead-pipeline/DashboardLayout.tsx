'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, currency } from '@/lib/utils';
import type { Lead as BaseLead } from '@/types';
import { ChatDetail } from './ChatDetail';
import { LeadTable } from './LeadTable';
import type { DashboardMode, LeadAction, LeadRecord, LeadStatus } from './types';

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusBucket(status: LeadStatus) {
  return status === 'Confirmed' ? 'Confirmed' : status === 'Follow-up' ? 'Follow-up' : status === 'Pending' ? 'Pending' : 'New';
}

type DashboardLayoutProps = {
  mode: DashboardMode;
  initialLeads: BaseLead[];
  notificationCount?: number;
};

function statusFromStage(stage: string): LeadStatus {
  const normalized = stage.toLowerCase();
  if (normalized.includes('confirm') || normalized.includes('book')) return 'Confirmed';
  if (normalized.includes('follow') || normalized.includes('quote') || normalized.includes('propos')) return 'Follow-up';
  if (normalized.includes('pending') || normalized.includes('new')) return 'New';
  return 'Pending';
}

function numericValueFromBudget(budget: string, fallback: number) {
  const numeric = Number(budget.replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback;
}

function isModeLead(lead: LeadRecord, mode: DashboardMode) {
  const source = lead.source.toLowerCase();
  if (mode === 'ai') {
    return source.includes('ai');
  }
  return source.includes('whatsapp');
}

function toDashboardLead(lead: BaseLead, index: number): LeadRecord {
  const transcript: LeadRecord['transcript'] = lead.transcript.map((message, messageIndex) => ({
    id: message.id ?? `${lead.id}-${messageIndex}`,
    from: message.from === 'guest' ? 'guest' : message.from === 'agent' ? 'agent' : 'ai',
    text: message.text,
    time: message.time,
    sentAtIso: message.sentAtIso,
    status: message.status ?? null,
    attachment: message.attachment ?? null
  }));

  const latestTranscript = transcript[transcript.length - 1];
  const status = statusFromStage(lead.stage);
  const source = lead.source || 'Website';

  return {
    id: lead.id,
    propertyId: lead.propertyId,
    propertySlug: lead.propertySlug,
    name: lead.name,
    intent: lead.intent || 'Inquiry',
    status,
    lastAction: latestTranscript?.from === 'guest' ? 'Awaiting reply' : 'Conversation active',
    value: numericValueFromBudget(lead.budget, Math.max(6500 + index * 1500, 6500)),
    updatedAtLabel: lead.updatedAtLabel || 'Just now',
    updatedAtIso: lead.updatedAtIso,
    unread: latestTranscript?.from === 'guest' ? 1 : 0,
    channel: source,
    phone: lead.phone,
    source,
    transcript: transcript.map((message) => ({
      id: message.id,
      from: message.from,
      text: message.text,
      time: message.time,
      sentAtIso: message.sentAtIso,
      status: message.status ?? null,
      attachment: message.attachment ?? null
    }))
  };
}

export function DashboardLayout({ mode, initialLeads, notificationCount }: DashboardLayoutProps) {
  const router = useRouter();
  const mappedInitialLeads = useMemo(() => initialLeads.map((lead, index) => toDashboardLead(lead, index)), [initialLeads]);
  const visibleInitialLeads = useMemo(
    () => mappedInitialLeads.filter((lead) => isModeLead(lead, mode)),
    [mappedInitialLeads, mode]
  );
  const preferredLeadId = useMemo(() => {
    const ordered = [...visibleInitialLeads].sort((left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime());
    return ordered[0]?.id ?? '';
  }, [visibleInitialLeads]);
  const [leads, setLeads] = useState<LeadRecord[]>(visibleInitialLeads);
  const [deletedLeadIds, setDeletedLeadIds] = useState<string[]>([]);
  const [activeLeadId, setActiveLeadId] = useState(preferredLeadId);
  const [activityNote, setActivityNote] = useState('Select any lead to inspect the existing conversation feed.');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);
  const [sendFeedbackKind, setSendFeedbackKind] = useState<'success' | 'error' | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('lead-os.deleted-leads');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setDeletedLeadIds(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    if (deletedLeadIds.length === 0) {
      setLeads(visibleInitialLeads);
      return;
    }

    setLeads(visibleInitialLeads.filter((lead) => !deletedLeadIds.includes(lead.id)));
  }, [deletedLeadIds, visibleInitialLeads]);

  useEffect(() => {
    if (leads.some((lead) => lead.id === activeLeadId)) {
      return;
    }
    setActiveLeadId(preferredLeadId);
  }, [activeLeadId, leads, preferredLeadId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [router]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === activeLeadId) ?? leads[0] ?? null,
    [activeLeadId, leads]
  );

  const recentChats = useMemo(
    () =>
      [...leads]
        .sort((left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime())
        .slice(0, 6),
    [leads]
  );

  const metrics = useMemo(() => {
    const total = leads.length;
    const confirmed = leads.filter((lead) => lead.status === 'Confirmed').length;
    const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const revenue = leads.filter((lead) => lead.status === 'Confirmed').reduce((sum, lead) => sum + lead.value, 0);

    return { total, confirmed, conversionRate, revenue };
  }, [leads]);

  function updateLead(leadId: string, updater: (lead: LeadRecord) => LeadRecord) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? updater(lead) : lead)));
  }

  function handleLeadAction(leadId: string, action: LeadAction) {
    setActiveLeadId(leadId);
    const now = new Date().toISOString();

    if (action === 'Delete') {
      setLeads((current) => {
        const next = current.filter((lead) => lead.id !== leadId);
        const nextActive = next[0]?.id ?? '';
        setActiveLeadId(nextActive);
        setActivityNote(`Deleted ${current.find((lead) => lead.id === leadId)?.name ?? 'lead'}.`);
        setDeletedLeadIds((currentDeleted) => {
          const nextDeleted = currentDeleted.includes(leadId) ? currentDeleted : [...currentDeleted, leadId];
          try {
            window.localStorage.setItem('lead-os.deleted-leads', JSON.stringify(nextDeleted));
          } catch {
            // ignore storage issues
          }
          return nextDeleted;
        });
        return next;
      });
      return;
    }

    updateLead(leadId, (lead) => {
      if (action === 'Convert') {
        return {
          ...lead,
          status: 'Confirmed',
          unread: 0,
          lastAction: 'Converted to booking',
          updatedAtIso: now,
          updatedAtLabel: 'Just now',
          transcript: [
            ...lead.transcript,
            {
              id: createId(`${lead.id}-convert`),
              from: 'agent',
              text: 'Booking converted and payment follow-up shared.',
              time: 'Just now',
              sentAtIso: now
            }
          ]
        };
      }

      return {
        ...lead,
        lastAction: 'Call requested',
        unread: 0,
        updatedAtIso: now,
        updatedAtLabel: 'Just now',
        transcript: [
          ...lead.transcript,
          {
            id: createId(`${lead.id}-call`),
            from: 'agent',
            text: 'Guest is being called now for a quick confirmation.',
            time: 'Just now',
            sentAtIso: now
          }
        ]
      };
    });

    setActivityNote(`${action} action triggered for ${leads.find((lead) => lead.id === leadId)?.name ?? 'selected lead'}.`);
  }

  function joinChat() {
    if (!selectedLead) return;
    const now = new Date().toISOString();
    updateLead(selectedLead.id, (lead) => ({
      ...lead,
      lastAction: 'Human joined chat',
      updatedAtIso: now,
      updatedAtLabel: 'Just now',
      transcript: [
        ...lead.transcript,
        {
          id: createId(`${lead.id}-join`),
          from: 'agent',
          text: 'Concierge joined the live chat thread.',
          time: 'Just now',
          sentAtIso: now
        }
      ]
    }));
    setActivityNote(`Joined ${selectedLead.name}'s live chat.`);
  }

  function callGuest() {
    if (!selectedLead) return;
    const now = new Date().toISOString();
    updateLead(selectedLead.id, (lead) => ({
      ...lead,
      lastAction: 'Calling guest',
      updatedAtIso: now,
      updatedAtLabel: 'Just now',
      transcript: [
        ...lead.transcript,
        {
          id: createId(`${lead.id}-call-now`),
          from: 'agent',
          text: 'Calling guest now to close the next step.',
          time: 'Just now',
          sentAtIso: now
        }
      ]
    }));
    setActivityNote(`Calling ${selectedLead.name} now.`);
  }

  async function sendInboundMessage(message: string) {
    if (!selectedLead || isSendingMessage) return false;

    setIsSendingMessage(true);
    setSendError(null);
    setSendFeedback(null);
    setSendFeedbackKind(null);

    try {
      const endpoint =
        mode === 'whatsapp'
          ? '/api/integrations/whatsapp/operator-message'
          : '/api/integrations/ai-bot/reply';
      const requestBody =
        mode === 'whatsapp'
          ? {
              to: selectedLead.phone,
              message,
              leadId: selectedLead.id,
              propertyId: selectedLead.propertyId ?? '',
              propertySlug: selectedLead.propertySlug ?? '',
              operatorId: 'lead-os-operator'
            }
          : {
              leadId: selectedLead.id,
              message,
              propertySlug: selectedLead.propertySlug ?? '',
              conversationId: selectedLead.phone
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      const payload = await response.json();

      if (!response.ok || !payload.lead) {
        const errorMessage = payload.error ?? (mode === 'whatsapp' ? 'Could not send this WhatsApp reply.' : 'Could not send this AI bot reply.');
        setSendError(errorMessage);
        setSendFeedback(errorMessage);
        setSendFeedbackKind('error');
        return false;
      }

      const updatedLead = toDashboardLead(payload.lead, leads.findIndex((lead) => lead.id === selectedLead.id));
      setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
      setActiveLeadId(updatedLead.id);
      setActivityNote(mode === 'whatsapp' ? `WhatsApp reply sent for ${updatedLead.name}.` : `Reply saved for ${updatedLead.name}.`);
      const deliveryStatus = String(payload.result?.status ?? payload.result?.deliveryStatus ?? '').trim();
      const feedbackMessage =
        mode === 'whatsapp'
          ? deliveryStatus
            ? `WhatsApp ${deliveryStatus.replace(/_/g, ' ')} • to ${updatedLead.phone}`
            : `WhatsApp reply sent to ${updatedLead.phone}`
          : `AI reply sent for ${updatedLead.name}.`;
      setSendFeedback(feedbackMessage);
      setSendFeedbackKind('success');
      return true;
    } catch {
      const errorMessage = mode === 'whatsapp' ? 'Could not send this WhatsApp reply.' : 'Could not send this AI bot reply.';
      setSendError(errorMessage);
      setSendFeedback(errorMessage);
      setSendFeedbackKind('error');
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }

  const sortedLeads = [...leads].sort((left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime());
  const unreadTotal = leads.reduce((sum, lead) => sum + lead.unread, 0);
  const unreadBadgeTotal = typeof notificationCount === 'number' ? Math.max(notificationCount, unreadTotal) : unreadTotal;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(18,140,126,0.06),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-black">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-semibold text-black/72">
          <span className="rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">{metrics.total} active leads</span>
          <span className="rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">{unreadBadgeTotal} unread replies</span>
          <span className="rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">
            {selectedLead ? `Selected: ${selectedLead.name}` : 'No lead selected'}
          </span>
          <span className="rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">
            {mode === 'whatsapp' ? 'WhatsApp-first view' : 'AI-first view'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-black/5 bg-white p-2 text-black shadow-[0_14px_34px_rgba(24,18,72,0.06)]">
          <Link
            href="/whatsapp-bot"
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition',
              mode === 'whatsapp'
                ? 'bg-[linear-gradient(135deg,rgba(37,211,102,0.18),rgba(18,140,126,0.14))] text-black shadow-sm'
                : 'bg-white text-black/70 hover:bg-black/5 hover:text-black'
            )}
          >
            WhatsApp Bot
          </Link>
          <Link
            href="/ai-bot"
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition',
              mode === 'ai'
                ? 'bg-[linear-gradient(135deg,rgba(37,211,102,0.18),rgba(18,140,126,0.14))] text-black shadow-sm'
                : 'bg-white text-black/70 hover:bg-black/5 hover:text-black'
            )}
          >
            AI Bot
          </Link>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white p-4 text-black shadow-[0_14px_34px_rgba(24,18,72,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--primary)]">
                {mode === 'ai' ? 'Old chat retrieval' : 'Recent chat retrieval'}
              </p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-black">
                {mode === 'ai' ? 'Reopen old AI chats' : 'Reopen old WhatsApp chats'}
              </h3>
              <p className="mt-1 text-sm text-black/60">
                Tap any conversation below to restore the full transcript in the right rail.
              </p>
            </div>
            <span className="rounded-full border border-black/5 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-black/72 shadow-sm">
              {recentChats.length} found
            </span>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {recentChats.length > 0 ? (
              recentChats.map((lead) => {
                const active = lead.id === selectedLead?.id;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      setActiveLeadId(lead.id);
                      setActivityNote(`Restored chat with ${lead.name}.`);
                    }}
                    className={cn(
                      'min-w-[220px] rounded-[22px] border px-4 py-3 text-left transition hover:-translate-y-0.5',
                      active
                        ? 'border-[var(--primary)]/20 bg-[linear-gradient(135deg,rgba(37,211,102,0.14),rgba(18,140,126,0.08))] shadow-[0_12px_30px_rgba(37,211,102,0.12)]'
                        : 'border-black/5 bg-white hover:bg-black/5'
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">{lead.source}</p>
                    <p className="mt-2 text-sm font-black text-black">{lead.name}</p>
                    <p className="mt-1 text-xs leading-5 text-black/62 line-clamp-2">
                      {lead.transcript[lead.transcript.length - 1]?.text || 'No transcript available.'}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/40">
                      {lead.updatedAtLabel}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-3 text-sm text-black/62">
                No old chats found yet.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <LeadTable
            mode={mode}
            leads={sortedLeads}
            activeLeadId={selectedLead?.id ?? ''}
            totalLeads={metrics.total}
            conversionRate={metrics.conversionRate}
            revenue={metrics.revenue}
            onSelectLead={(leadId) => {
              setActiveLeadId(leadId);
              const lead = leads.find((item) => item.id === leadId);
              setActivityNote(`Selected ${lead?.name ?? 'lead'} for live action.`);
            }}
            onAction={handleLeadAction}
          />

          {selectedLead ? (
            <ChatDetail
              mode={mode}
              lead={selectedLead}
              typing={false}
              activityNote={activityNote}
              sendError={sendError}
              sendFeedback={sendFeedback}
              sendFeedbackKind={sendFeedbackKind}
              isSendingMessage={isSendingMessage}
              onJoinChat={joinChat}
              onCallGuest={callGuest}
              onSendMessage={sendInboundMessage}
            />
          ) : (
            <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#075E54]">Right rail</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">No lead selected</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select a live lead in the center table to open the conversation timeline and actions here.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
