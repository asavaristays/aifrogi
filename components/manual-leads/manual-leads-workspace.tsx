"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { cn, currency } from "@/lib/utils";
import type { GoogleSheetLeadCapture } from "@/lib/services/google-sheet-lead-capture-service";

type ManualLeadFormState = {
  guestName: string;
  phone: string;
  destination: string;
  notes: string;
};

type LeadRailMode = "form" | "detail";
type IntentFilter = "all" | "manual" | "whatsapp" | "ai";
type StatusFilter = "all" | "new" | "active" | "closed";
type ManualLeadIntent = "Manual" | "WhatsApp" | "AI";
type ManualLeadStatus = "NEW" | "ACTIVE" | "CLOSED";

type ManualLeadRow = {
  id: string;
  guestName: string;
  phone: string;
  destination: string;
  channel: string;
  source: string;
  intent: ManualLeadIntent;
  status: ManualLeadStatus;
  value: number;
  lastAction: string;
  timestamp: string;
  notes: string;
  conversationId: string;
  timeline: Array<{ title: string; text: string; time: string }>;
};

const defaultLeadForm: ManualLeadFormState = {
  guestName: "",
  phone: "",
  destination: "",
  notes: ""
};

function normalize(value: string) {
  return String(value || "").trim().toLowerCase();
}

function deriveIntent(capture: GoogleSheetLeadCapture): ManualLeadIntent {
  const source = `${capture.channel} ${capture.source}`.toLowerCase();
  if (source.includes("whatsapp")) return "WhatsApp";
  if (source.includes("ai") || source.includes("web")) return "AI";
  return "Manual";
}

function deriveStatus(capture: GoogleSheetLeadCapture): ManualLeadStatus {
  const status = normalize(capture.status);
  if (["closed", "booked", "done", "converted", "confirmed"].some((item) => status.includes(item))) return "CLOSED";
  if (["active", "contacted", "qualified", "follow", "follow-up", "followup"].some((item) => status.includes(item))) return "ACTIVE";
  return "NEW";
}

function inferValue(capture: GoogleSheetLeadCapture, status: ManualLeadStatus) {
  const source = `${capture.notes} ${capture.destination} ${capture.source}`.trim();
  const currencyMatch = source.match(/₹\s*([\d,]+)/);
  if (currencyMatch?.[1]) {
    const numeric = Number(currencyMatch[1].replace(/,/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }

  if (status === "CLOSED") {
    const numericMatch = source.match(/(?:value|budget|price)\D*([\d,]+)/i);
    if (numericMatch?.[1]) {
      const numeric = Number(numericMatch[1].replace(/,/g, ""));
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
  }

  return 0;
}

function captureInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "L";
  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(timestamp: string) {
  const value = String(timestamp || "").trim();
  if (!value) return "Just now";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(parsed));
}

function createTimeline(capture: GoogleSheetLeadCapture, intent: ManualLeadIntent, status: ManualLeadStatus) {
  const entries = [
    {
      title: "Lead captured",
      text: `${capture.guestName || "Unnamed lead"} saved from ${intent} intake.`,
      time: formatTimestamp(capture.timestamp)
    },
    {
      title: "Destination",
      text: capture.destination || "Destination not shared yet.",
      time: capture.phone ? capture.phone : "Awaiting contact detail"
    },
    {
      title: "Source",
      text: capture.source || capture.channel || "Shared sheet capture",
      time: capture.conversationId || "Manual tracking"
    }
  ];

  if (capture.notes.trim()) {
    entries.push({
      title: "Notes",
      text: capture.notes,
      time: status === "CLOSED" ? "Converted" : "Open note"
    });
  }

  return entries;
}

function toLeadRow(capture: GoogleSheetLeadCapture, index: number): ManualLeadRow {
  const intent = deriveIntent(capture);
  const status = deriveStatus(capture);
  const id = capture.conversationId || capture.phone || capture.guestName || `lead-${index}`;

  return {
    id,
    guestName: capture.guestName || "Unnamed lead",
    phone: capture.phone || "Not shared",
    destination: capture.destination || "Not shared",
    channel: capture.channel || intent,
    source: capture.source || capture.channel || "Lead capture",
    intent,
    status,
    value: inferValue(capture, status),
    lastAction: capture.notes.trim() || `Captured from ${intent}`,
    timestamp: formatTimestamp(capture.timestamp),
    notes: capture.notes.trim(),
    conversationId: capture.conversationId.trim(),
    timeline: createTimeline(capture, intent, status)
  };
}

function statusTone(status: ManualLeadStatus) {
  switch (status) {
    case "CLOSED":
      return "tertiary" as const;
    case "ACTIVE":
      return "secondary" as const;
    default:
      return "primary" as const;
  }
}

function intentTone(intent: ManualLeadIntent) {
  switch (intent) {
    case "WhatsApp":
      return "secondary" as const;
    case "AI":
      return "primary" as const;
    default:
      return "tertiary" as const;
  }
}

function matchesIntent(row: ManualLeadRow, filter: IntentFilter) {
  if (filter === "all") return true;
  return row.intent.toLowerCase() === filter;
}

function matchesStatus(row: ManualLeadRow, filter: StatusFilter) {
  if (filter === "all") return true;
  return row.status.toLowerCase() === filter;
}

function statusCount(rows: ManualLeadRow[], status: ManualLeadStatus) {
  return rows.filter((row) => row.status === status).length;
}

function searchFields(row: ManualLeadRow) {
  return [row.guestName, row.phone, row.destination, row.channel, row.source, row.status, row.notes, row.conversationId]
    .join(" ")
    .toLowerCase();
}

function StatCard({
  label,
  value,
  helper,
  tone
}: {
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "secondary" | "tertiary";
}) {
  return (
    <div className="rounded-[20px] border border-black/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(247,248,255,0.92)_100%)] p-4 shadow-[0_18px_55px_rgba(24,18,72,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
        <Badge tone={tone} className="px-2 py-0.5 text-[10px] tracking-[0.12em]">
          {label}
        </Badge>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-[var(--text)]">{value}</p>
      <p className="mt-2 text-[13px] text-[var(--text-muted)]">{helper}</p>
    </div>
  );
}

function PillButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition",
        active
          ? "bg-[var(--primary)] text-white shadow-[0_10px_20px_rgba(37,211,102,0.18)]"
          : "border border-black/5 bg-white text-[var(--text-muted)] hover:-translate-y-0.5 hover:shadow-sm"
      )}
    >
      {children}
    </button>
  );
}

function ManualLeadTable({
  leads,
  activeLeadId,
  query,
  intentFilter,
  statusFilter,
  onQueryChange,
  onIntentFilterChange,
  onStatusFilterChange,
  onSelectLead,
  onAction
}: {
  leads: ManualLeadRow[];
  activeLeadId: string;
  query: string;
  intentFilter: IntentFilter;
  statusFilter: StatusFilter;
  onQueryChange: (value: string) => void;
  onIntentFilterChange: (value: IntentFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSelectLead: (leadId: string) => void;
  onAction: (leadId: string, action: "Call" | "Convert" | "Delete") => void;
}) {
  return (
    <Card className="overflow-hidden border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,249,255,0.96)_100%)] p-0 shadow-[0_20px_60px_rgba(24,18,72,0.08)]">
      <div className="border-b border-black/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--primary)]">Center workspace</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl">Manual lead table</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              All manual, AI, and WhatsApp captured leads appear in one shared table, using the same AiFrogi visual system as the WhatsApp dashboard.
            </p>
          </div>
          <div className="rounded-full border border-black/5 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {leads.length} in view
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2.5 shadow-sm lg:min-w-[280px]">
            <Icon name="search" className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search name, phone, destination..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(["all", "manual", "whatsapp", "ai"] as IntentFilter[]).map((intent) => (
              <PillButton key={intent} active={intentFilter === intent} onClick={() => onIntentFilterChange(intent)}>
                {intent === "all" ? "All intents" : intent}
              </PillButton>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "new", "active", "closed"] as StatusFilter[]).map((status) => (
            <PillButton key={status} active={statusFilter === status} onClick={() => onStatusFilterChange(status)}>
              {status === "all" ? "All status" : status}
            </PillButton>
          ))}
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/80 text-left text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
                    <p className="text-sm font-bold text-slate-900">No captured leads found</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Fresh Google Sheet records will appear here as soon as they are captured.
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
                    "cursor-pointer border-t border-slate-100 transition hover:bg-[#f8fafc]",
                    isActive && "bg-[#effdf5]"
                  )}
                  onClick={() => onSelectLead(lead.id)}
                >
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#075E54)] text-sm font-black text-white shadow-[0_10px_24px_rgba(7,94,84,0.22)]">
                        {captureInitials(lead.guestName)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-950">{lead.guestName}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{lead.source}</span>
                          {lead.conversationId ? (
                            <span className="rounded-full bg-[#25D366]/12 px-2 py-0.5 font-bold text-[#0f9f5f]">
                              {lead.conversationId}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <Badge tone={intentTone(lead.intent)} className="px-2 py-0.5 text-[10px] tracking-[0.12em]">{lead.intent}</Badge>
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <Badge tone={statusTone(lead.status)} className="px-2 py-0.5 text-[10px] tracking-[0.12em]">{lead.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{lead.lastAction}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900 sm:px-6">{currency(lead.value)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex flex-nowrap gap-1.5 overflow-x-auto">
                      {(["Call", "Convert", "Delete"] as const).map((action) => (
                <Button
                  key={action}
                  type="button"
                  tone={action === "Delete" ? "danger" : action === "Convert" ? "primary" : "surface"}
                  className={cn(
                            "h-7 min-w-[64px] shrink-0 rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.22em]",
                            action === "Delete" && "border border-[#f4d8dd] bg-[#fdf0f2] text-[#e89aa5]"
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            onAction(lead.id, action);
                          }}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {leads.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 px-5 py-8 text-center">
            <p className="text-sm font-bold text-slate-900">No captured leads found</p>
            <p className="mt-2 text-sm text-slate-500">Fresh Google Sheet records will appear here as soon as they are captured.</p>
          </div>
        ) : null}

        {leads.map((lead) => {
          const isActive = lead.id === activeLeadId;
          return (
            <button
              key={lead.id}
              type="button"
              onClick={() => onSelectLead(lead.id)}
              className={cn(
                "w-full rounded-[24px] border border-black/5 bg-white p-4 text-left shadow-none transition hover:-translate-y-0.5 hover:shadow-sm",
                isActive && "bg-[#effdf5]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#075E54)] text-sm font-black text-white shadow-[0_10px_24px_rgba(7,94,84,0.22)]">
                  {captureInitials(lead.guestName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-950">{lead.guestName}</p>
                    <Badge tone={intentTone(lead.intent)}>{lead.intent}</Badge>
                    <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-900">Phone:</span> {lead.phone}
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-900">Destination:</span> {lead.destination}
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-900">Value:</span> {currency(lead.value)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      tone="surface"
                      className="h-7 rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.22em]"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction(lead.id, "Call");
                      }}
                    >
                      Call
                    </Button>
                    <Button
                      type="button"
                      tone="primary"
                      className="h-7 rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.22em]"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction(lead.id, "Convert");
                      }}
                    >
                      Convert
                    </Button>
                    <Button
                      type="button"
                      tone="danger"
                      className="h-7 rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.22em]"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction(lead.id, "Delete");
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function ManualLeadDetailPanel({
  lead,
  activityNote,
  onAction,
  onBackToForm
}: {
  lead: ManualLeadRow;
  activityNote: string;
  onAction: (leadId: string, action: "Call" | "Convert" | "Delete") => void;
  onBackToForm: () => void;
}) {
  const statusCopy = lead.status === "CLOSED" ? "Closed" : lead.status === "ACTIVE" ? "Active" : "New";

  return (
    <Card className="overflow-hidden border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,249,255,0.96)_100%)] p-0 shadow-[0_20px_60px_rgba(24,18,72,0.08)]">
      <div className="border-b border-black/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--primary)]">Right rail</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-[var(--text)]">Live lead detail</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Selected lead, activity timeline, and team actions.</p>
          </div>
          <Badge tone={statusTone(lead.status)}>{statusCopy}</Badge>
        </div>

        <div className="mt-4 grid gap-3 rounded-[24px] border border-black/5 bg-white/70 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Guest</p>
            <p className="mt-1 text-sm font-bold text-[var(--text)]">{lead.guestName}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{lead.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Activity</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{activityNote}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Captured {lead.timestamp}</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Timeline</p>
          <div className="mt-4 space-y-3">
            {lead.timeline.map((item) => (
              <div key={`${lead.id}-${item.title}-${item.time}`} className="flex items-start gap-3 rounded-[20px] bg-white px-4 py-3 shadow-sm">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[var(--text)]">{item.title}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Conversation</p>
          <div className="mt-4 space-y-3">
            <div className="w-fit max-w-[88%] rounded-[22px] bg-[#ecfdf3] px-4 py-3 text-[13px] leading-6 text-slate-900">
              <p className="font-semibold">{lead.destination}</p>
              <p className="mt-1">{lead.notes || "No extra conversation captured yet."}</p>
            </div>
            <div className="w-fit max-w-[88%] rounded-[22px] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-slate-900">
              <p className="font-semibold">{lead.source}</p>
              <p className="mt-1">
                {lead.status === "CLOSED"
                  ? "Lead marked as closed and ready for booking follow-up."
                  : "Lead is open and ready for the next concierge action."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-black/5 bg-white p-3">
          <div className="flex flex-wrap gap-2">
          <Button
            tone="surface"
            className="rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
            onClick={() => onAction(lead.id, "Call")}
          >
            Call
          </Button>
          <Button
            tone="primary"
            className="rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
            onClick={() => onAction(lead.id, "Convert")}
          >
            Convert
          </Button>
          <Button
            tone="danger"
            className="rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
            onClick={() => onAction(lead.id, "Delete")}
          >
            Delete
          </Button>
          <Button
            tone="ghost"
            className="ml-auto rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
            onClick={onBackToForm}
          >
            Add Lead
          </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LeadFormPanel({
  formState,
  isSaving,
  errorMessage,
  successMessage,
  onFieldChange,
  onSubmit,
  onViewDetail
}: {
  formState: ManualLeadFormState;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onFieldChange: <K extends keyof ManualLeadFormState>(key: K, value: ManualLeadFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onViewDetail: () => void;
}) {
  return (
    <Card className="border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,249,255,0.96)_100%)] p-6 shadow-[0_20px_60px_rgba(24,18,72,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-[var(--text)]">Add lead</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Same strict 3-field intake used across manual, AI-bot, and WhatsApp-bot.
          </p>
        </div>
        <Badge tone="secondary" className="text-[10px] tracking-[0.12em]">Manual</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          tone="ghost"
          className="rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
          onClick={onViewDetail}
          type="button"
        >
          Lead Detail
        </Button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Guest Name</span>
          <input
            value={formState.guestName}
            onChange={(event) => onFieldChange("guestName", event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            placeholder="Enter guest name"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Phone</span>
          <input
            value={formState.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            placeholder="+91 98XXXXXXXX"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Destination</span>
          <input
            value={formState.destination}
            onChange={(event) => onFieldChange("destination", event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            placeholder="Jawai, Coorg, Jodhpur..."
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Notes (optional)</span>
          <textarea
            value={formState.notes}
            onChange={(event) => onFieldChange("notes", event.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            placeholder="Any context from the call, walk-in, or referral"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-[var(--error)]/15 bg-white px-4 py-3 text-sm text-[var(--error)]">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-[var(--secondary)]/15 bg-white px-4 py-3 text-sm text-[var(--secondary)]">
            {successMessage}
          </div>
        ) : null}

        <Button className="w-full justify-center rounded-2xl py-2.5 text-[10px] shadow-lg shadow-[rgba(79,70,229,0.18)]" disabled={isSaving} type="submit">
          {isSaving ? "Saving lead..." : "Save To Shared Sheet"}
        </Button>
      </form>
    </Card>
  );
}

export function ManualLeadsWorkspace({ captures }: { captures: GoogleSheetLeadCapture[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [railMode, setRailMode] = useState<LeadRailMode>("form");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [rows, setRows] = useState<ManualLeadRow[]>(() => captures.map((capture, index) => toLeadRow(capture, index)));
  const [formState, setFormState] = useState<ManualLeadFormState>(defaultLeadForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState("Select a lead to inspect the live timeline.");

  useEffect(() => {
    setRows(captures.map((capture, index) => toLeadRow(capture, index)));
  }, [captures]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const closed = rows.filter((row) => row.status === "CLOSED").length;
    const conversionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    const revenue = rows.reduce((sum, row) => sum + row.value, 0);
    return {
      total,
      closed,
      conversionRate,
      revenue,
      newCount: statusCount(rows, "NEW"),
      activeCount: statusCount(rows, "ACTIVE"),
      closedCount: statusCount(rows, "CLOSED"),
      manualCount: rows.filter((row) => row.intent === "Manual").length,
      whatsappCount: rows.filter((row) => row.intent === "WhatsApp").length,
      aiCount: rows.filter((row) => row.intent === "AI").length
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = needle ? searchFields(row).includes(needle) : true;
      return matchesQuery && matchesIntent(row, intentFilter) && matchesStatus(row, statusFilter);
    });
  }, [intentFilter, query, rows, statusFilter]);

  const selectedLead = useMemo(() => rows.find((row) => row.id === selectedLeadId) ?? null, [rows, selectedLeadId]);
  useEffect(() => {
    if (selectedLeadId && railMode === "detail" && !rows.some((row) => row.id === selectedLeadId)) {
      setSelectedLeadId("");
      setRailMode("form");
      setActivityNote("Select a lead to inspect the live timeline.");
    }
  }, [railMode, rows, selectedLeadId]);

  function updateField<K extends keyof ManualLeadFormState>(key: K, value: ManualLeadFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/manual-leads/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify(formState)
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Could not save lead");
        return;
      }

      setSuccessMessage(`${formState.guestName.trim() || "Lead"} was saved to the shared Google Sheet.`);
      setFormState(defaultLeadForm);
      setRailMode("form");
      setActivityNote("Lead saved to the shared sheet.");
      router.refresh();
    } catch {
      setErrorMessage("Network error while saving lead");
    } finally {
      setIsSaving(false);
    }
  }

  function updateLeadRow(leadId: string, updater: (row: ManualLeadRow) => ManualLeadRow | null) {
    setRows((current) => {
      const next = current
        .map((row) => (row.id === leadId ? updater(row) : row))
        .filter((row): row is ManualLeadRow => Boolean(row));

      if (railMode === "detail" && selectedLeadId && !next.some((row) => row.id === selectedLeadId)) {
        setSelectedLeadId("");
        setRailMode("form");
        setActivityNote("Select a lead to inspect the live timeline.");
      }

      return next;
    });
  }

  function handleLeadAction(leadId: string, action: "Call" | "Convert" | "Delete") {
    const now = new Date().toISOString();
    setSelectedLeadId(leadId);
    setRailMode("detail");

    if (action === "Delete") {
      updateLeadRow(leadId, () => null);
      setActivityNote("Lead removed from the visible workspace.");
      return;
    }

    updateLeadRow(leadId, (row) => {
      if (action === "Call") {
        const nextTimeline = [
          ...row.timeline,
          {
            title: "Call requested",
            text: "Front desk is calling the guest for a quick confirmation.",
            time: formatTimestamp(now)
          }
        ];
        return {
          ...row,
          lastAction: "Call requested",
          timeline: nextTimeline
        };
      }

      const nextTimeline = [
        ...row.timeline,
        {
          title: "Converted",
          text: "Lead has been marked as closed and ready for booking follow-up.",
          time: formatTimestamp(now)
        }
      ];
      return {
        ...row,
        status: "CLOSED",
        lastAction: "Converted to booking",
        timeline: nextTimeline
      };
    });

    setActivityNote(`${action} action triggered for ${rows.find((row) => row.id === leadId)?.guestName ?? "selected lead"}.`);
  }

  const selectedCount = filteredRows.length;

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-black/5 bg-white p-2 text-black shadow-[0_14px_34px_rgba(24,18,72,0.06)]">
        <Link
          href="/manual-leads"
          className="inline-flex items-center rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black shadow-sm"
        >
          Manual Leads
        </Link>
        <Link
          href="/whatsapp-bot"
          className="inline-flex items-center rounded-full border border-black/5 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black/70 transition hover:border-black/10 hover:bg-black/5 hover:text-black"
        >
          WhatsApp Bot
        </Link>
        <Link
          href="/ai-bot"
          className="inline-flex items-center rounded-full border border-black/5 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black/70 transition hover:border-black/10 hover:bg-black/5 hover:text-black"
        >
          AI Bot
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-semibold text-black/70">
        <span className="rounded-full border border-black/5 bg-white px-2 py-1 shadow-sm">{metrics.total} active leads</span>
        <span className="rounded-full border border-black/5 bg-white px-2 py-1 shadow-sm">{metrics.newCount} new</span>
        <span className="rounded-full border border-black/5 bg-white px-2 py-1 shadow-sm">{metrics.activeCount} active</span>
        <span className="rounded-full border border-black/5 bg-white px-2 py-1 shadow-sm">{metrics.closedCount} closed</span>
        <span className="rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">
          {selectedLead ? `Selected: ${selectedLead.guestName}` : "No lead selected"}
        </span>
        <span className="rounded-full border border-black/5 bg-white px-2 py-1 shadow-sm text-[10px]">Manual leads workspace</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <ManualLeadTable
          leads={filteredRows}
          activeLeadId={selectedLeadId}
          query={query}
          intentFilter={intentFilter}
          statusFilter={statusFilter}
          onQueryChange={setQuery}
          onIntentFilterChange={setIntentFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectLead={(leadId) => {
            setSelectedLeadId(leadId);
            setRailMode("detail");
            const lead = rows.find((item) => item.id === leadId);
            setActivityNote(`Selected ${lead?.guestName ?? "lead"} for live action.`);
          }}
          onAction={handleLeadAction}
        />

        {railMode === "detail" && selectedLead ? (
          <ManualLeadDetailPanel
            lead={selectedLead}
            activityNote={activityNote}
            onAction={handleLeadAction}
            onBackToForm={() => {
              setSelectedLeadId("");
              setRailMode("form");
              setActivityNote("Select a lead to inspect the live timeline.");
            }}
          />
        ) : (
          <LeadFormPanel
            formState={formState}
            isSaving={isSaving}
            errorMessage={errorMessage}
            successMessage={successMessage}
            onFieldChange={updateField}
            onSubmit={submitLead}
            onViewDetail={() => {
              if (selectedLeadId) {
                setRailMode("detail");
              } else if (filteredRows[0]) {
                setSelectedLeadId(filteredRows[0].id);
                setRailMode("detail");
                setActivityNote(`Selected ${filteredRows[0].guestName} for live action.`);
              }
            }}
          />
        )}
      </div>

      <div className="md:hidden">
        <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_18px_55px_rgba(24,18,72,0.06)]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">Mobile view</p>
          <p className="mt-2 text-sm text-black/65">
            {selectedCount} lead{selectedCount === 1 ? "" : "s"} in the current filter. Tap any row above to open the detail rail.
          </p>
        </div>
      </div>
    </div>
  );
}
