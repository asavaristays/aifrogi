'use client';

import { cn, currency } from '@/lib/utils';
import type { DashboardMode, LeadAction, LeadRecord, LeadStatus } from './types';

type LeadTableProps = {
  mode: DashboardMode;
  leads: LeadRecord[];
  activeLeadId: string;
  totalLeads: number;
  conversionRate: number;
  revenue: number;
  onSelectLead: (id: string) => void;
  onAction: (id: string, action: LeadAction) => void;
};

const statusStyles: Record<LeadStatus, string> = {
  New: 'bg-[#d9fbe6] text-[#8a6a16] ring-[#25d366]/20',
  'Follow-up': 'bg-[#fef3c7] text-[#b45309] ring-[#f59e0b]/20',
  Confirmed: 'bg-[#dcfce7] text-[#15803d] ring-[#22c55e]/20',
  Pending: 'bg-[#e5e7eb] text-[#475569] ring-[#94a3b8]/20'
};

const actionStyles: Record<LeadAction, string> = {
  Call: 'border-[#d8dee8] bg-[#edf1f5] text-[#657188] hover:bg-[#e5eaf0]',
  Convert: 'border-[#25d366]/20 bg-[#d9fbe6] text-[#8a6a16] hover:bg-[#c7f7d8]',
  Delete: 'border-[#f4d8dd] bg-[#fdf0f2] text-[#e89aa5] hover:bg-[#fbe6ea]'
};

const tableCopy: Record<DashboardMode, { eyebrow: string; title: string; helper: string; liveLabel: string }> = {
  whatsapp: {
    eyebrow: 'Center workspace',
    title: 'WhatsApp Leads Dashboard',
    helper: 'Every WhatsApp enquiry is scored, assigned, and converted from one control surface.',
    liveLabel: 'Live leads'
  },
  ai: {
    eyebrow: 'Inbound AI workspace',
    title: 'AI Bot Leads Dashboard',
    helper: 'Website AI chat enquiries are captured, qualified, and handled from one inbound chat console.',
    liveLabel: 'Inbound chats'
  }
};

function statCard(label: string, value: string, helper: string) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/48">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-black">{value}</p>
      <p className="mt-2 text-sm font-medium text-black/56">{helper}</p>
    </div>
  );
}

export function LeadTable({ mode, leads, activeLeadId, totalLeads, conversionRate, revenue, onSelectLead, onAction }: LeadTableProps) {
  const copy = tableCopy[mode];

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#25D366]">{copy.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-black sm:text-4xl">{copy.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
              {copy.helper}
            </p>
          </div>
          <div className="rounded-full border border-[#25D366]/15 bg-[#d9fbe6] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8a6a16]">
            {copy.liveLabel} {leads.length}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {statCard('Total Leads', String(totalLeads), 'All captured enquiries')}
          {statCard('Conversion Rate', `${conversionRate}%`, 'Confirmed vs total')}
          {statCard('Revenue', currency(revenue), 'Confirmed revenue')}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/80 text-left text-[10px] font-black uppercase tracking-[0.2em] text-black/50">
              <th className="px-5 py-4 sm:px-6">Lead Name</th>
              <th className="px-5 py-4 sm:px-6">Intent</th>
              <th className="px-5 py-4 sm:px-6">Status</th>
              <th className="px-5 py-4 sm:px-6">Last Action</th>
              <th className="px-5 py-4 sm:px-6">Value (₹)</th>
              <th className="px-5 py-4 sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 px-5 py-8 text-center">
                    <p className="text-sm font-bold text-slate-900">No live lead feed connected yet.</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Connect the property inbox or WhatsApp stream to populate this pipeline with real conversations.
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => {
              const isActive = lead.id === activeLeadId;
              return (
                <tr
                  key={lead.id}
                  className={cn(
                    'cursor-pointer border-t border-slate-100 transition hover:bg-[#f8fafc]',
                    isActive && 'bg-[#f0fbf5]'
                  )}
                  onClick={() => onSelectLead(lead.id)}
                >
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#075E54)] text-sm font-black text-white shadow-[0_10px_20px_rgba(7,94,84,0.16)]">
                        {lead.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                    <p className="text-sm font-bold text-black">{lead.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-black/55">
                          <span>{lead.source}</span>
                          {lead.unread > 0 ? (
                            <span className="rounded-full bg-[#25D366]/12 px-2 py-0.5 font-bold text-[#0f9f5f]">
                              {lead.unread} unread
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-black/72 sm:px-6">{lead.intent}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <span className={cn('inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ring-1 ring-inset', statusStyles[lead.status])}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-black/72 sm:px-6">{lead.lastAction}</td>
                  <td className="px-5 py-4 text-sm font-bold text-black sm:px-6">{currency(lead.value)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex flex-nowrap gap-1.5 overflow-x-auto">
                      {(['Call', 'Convert', 'Delete'] as LeadAction[]).map((action) => (
                        <span
                          key={action}
                          className={cn(
                            'inline-flex h-7 min-w-[72px] shrink-0 cursor-pointer items-center justify-center rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.36em] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20',
                            actionStyles[action]
                          )}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            onAction(lead.id, action);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              onAction(lead.id, action);
                            }
                          }}
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
