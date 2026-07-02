"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { CALL_FORWARDING_DESTINATION, RESERVATION_PHONE_NUMBER } from "@/lib/channel-config";
import { cn } from "@/lib/utils";

type CallOutcome = "missed" | "answered" | "busy" | "not_reachable";
type CallbackStatus = "called" | "no_answer" | "converted";

type CallFormState = {
  callerName: string;
  callerPhone: string;
  outcome: CallOutcome;
  callbackNote: string;
  priority: boolean;
};

const defaultFormState: CallFormState = {
  callerName: "",
  callerPhone: "",
  outcome: "missed",
  callbackNote: "",
  priority: true
};

const outcomeLabels: Record<CallOutcome, string> = {
  missed: "Missed call",
  answered: "Answered call",
  busy: "Busy line",
  not_reachable: "Not reachable"
};

const outcomeStages: Record<CallOutcome, string> = {
  missed: "New",
  answered: "Contacted",
  busy: "New",
  not_reachable: "New"
};

const callbackStatusConfig: Record<
  CallbackStatus,
  { label: string; stage: string; score: number; tag: string; intent: string }
> = {
  called: {
    label: "Called",
    stage: "Contacted",
    score: 68,
    tag: "Callback Attempted",
    intent: "Callback completed"
  },
  no_answer: {
    label: "No Answer",
    stage: "New",
    score: 58,
    tag: "Callback Needed",
    intent: "Callback attempted but no answer"
  },
  converted: {
    label: "Converted",
    stage: "Booked",
    score: 92,
    tag: "Converted",
    intent: "Call converted to booking"
  }
};

export function CallLeadsClient({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [formState, setFormState] = useState<CallFormState>(defaultFormState);
  const [selectedCallId, setSelectedCallId] = useState(leads.find((lead) => lead.source.trim().toLowerCase() === "call")?.id ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [intakeLabel, setIntakeLabel] = useState("Log Missed Call");

  const callLeads = useMemo(() => {
    return leads
      .filter((lead) => lead.source.trim().toLowerCase() === "call")
      .sort((left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime());
  }, [leads]);

  const selectedCall = useMemo(() => {
    if (!selectedCallId) return callLeads[0];
    return callLeads.find((lead) => lead.id === selectedCallId) ?? callLeads[0];
  }, [callLeads, selectedCallId]);

  const receivedCount = callLeads.length;
  const answeredCount = callLeads.filter((lead) => lead.stage !== "New").length;
  const unansweredCount = callLeads.filter((lead) => lead.stage === "New").length;
  const bookedCount = callLeads.filter((lead) => lead.stage === "Booked").length;
  const averageResponse = callLeads.length
    ? Math.round(callLeads.reduce((sum, lead) => sum + Math.max(1, lead.minutesAgo), 0) / callLeads.length)
    : 0;

  async function submitCallLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const callerPhone = formState.callerPhone.trim();
    const callerName = formState.callerName.trim() || callerPhone || "Call Lead";

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: callerName,
          source: "Call",
          stage: outcomeStages[formState.outcome],
          language: "EN",
          intent: formState.callbackNote.trim() || `${outcomeLabels[formState.outcome]} from reservation line`,
          stay: "Dates not shared",
          party: "Caller details pending",
          budget: "Budget not shared",
          phone: callerPhone,
          score: formState.outcome === "answered" ? 66 : 58,
          tags: [
            "Call Lead",
            outcomeLabels[formState.outcome],
            formState.priority ? "Priority Callback" : ""
          ].filter(Boolean),
          isHighPriority: formState.priority
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Could not create call lead");
        return;
      }

      setFormState(defaultFormState);
      setIntakeLabel("Log Missed Call");
      setSelectedCallId(payload.lead?.id ?? "");
      router.refresh();
    } catch {
      setErrorMessage("Network error while creating call lead");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateCallbackStatus(status: CallbackStatus) {
    if (!selectedCall) return;

    setIsSaving(true);
    setErrorMessage(null);

    const config = callbackStatusConfig[status];
    const tags = Array.from(
      new Set([
        ...(selectedCall.tags ?? []).filter(Boolean),
        "Call Lead",
        config.tag
      ])
    );

    try {
      const response = await fetch(`/api/leads/${selectedCall.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: selectedCall.name,
          source: selectedCall.source,
          stage: config.stage,
          language: selectedCall.language,
          intent: config.intent,
          stay: selectedCall.stay,
          party: selectedCall.party,
          budget: selectedCall.budget,
          phone: selectedCall.phone,
          score: config.score,
          tags,
          isHighPriority: true
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Could not update callback status");
        return;
      }

      setSelectedCallId(payload.lead?.id ?? selectedCall.id);
      router.refresh();
    } catch {
      setErrorMessage("Network error while updating callback status");
    } finally {
      setIsSaving(false);
    }
  }

  function openMissedCallIntake() {
    setFormState({
      ...defaultFormState,
      outcome: "missed",
      priority: true
    });
    setIntakeLabel("Log Missed Call");
    const form = document.getElementById("call-intake-form");
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6 bg-white px-4 py-5 text-black sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden border border-black/5 bg-white p-0 shadow-[0_18px_55px_rgba(24,18,72,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="secondary">Reservation line</Badge>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Missed call to callback workflow
                </span>
              </div>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-black">
                Turn a ring on the reservation number into a lead, a callback, and a booking.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
                Keep {RESERVATION_PHONE_NUMBER} visible as the public line. If the team misses a call, AiFrogi can turn
                it into a callback task immediately and keep the follow-up visible in the same workspace.
              </p>
            </div>
            <div className="grid gap-0 border-t border-black/5 bg-white p-6 sm:p-7 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Received", receivedCount, "primary"],
                  ["Answered", answeredCount, "secondary"],
                  ["Unanswered", unansweredCount, "tertiary"],
                  ["Avg response", `${averageResponse}m`, "neutral"]
                ].map(([label, value, tone]) => (
                  <div key={label} className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-black">{value as string}</p>
                    <Badge
                      tone={tone as "primary" | "secondary" | "tertiary" | "neutral"}
                      className="mt-3 bg-transparent px-0 py-0 text-[10px] tracking-[0.16em]"
                    >
                      Today
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Forwarding target</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-black">{CALL_FORWARDING_DESTINATION}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Use No Answer forwarding here, then create the callback lead when the missed call lands.
                </p>
              </div>
              <div className="mt-3 rounded-[22px] border border-black/5 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Booked today</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-black">{bookedCount}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(24,18,72,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Workflow</p>
          <div className="mt-4 space-y-3">
            {[
              "1. Guest calls the reservation line.",
              `2. If unanswered, forward to ${CALL_FORWARDING_DESTINATION}.`,
              "3. Log the missed call here to create a visible callback lead.",
              "4. Open the lead later and mark the callback result."
            ].map((step) => (
              <div key={step} className="flex gap-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black text-white">
                  ✓
                </div>
                <p className="text-sm font-medium leading-6 text-[var(--text-body)]">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.85fr)]">
        <Card className="border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(24,18,72,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">Missed call intake</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Log a missed or answered reservation call as a real AiFrogi record.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">Lead entry</Badge>
              <Button type="button" tone="surface" onClick={openMissedCallIntake}>
                {intakeLabel}
              </Button>
            </div>
          </div>

          <form id="call-intake-form" className="mt-6 space-y-5" onSubmit={submitCallLead}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Caller name
                </span>
                <input
                  value={formState.callerName}
                  onChange={(event) => setFormState((current) => ({ ...current, callerName: event.target.value }))}
                  placeholder="Guest name or caller label"
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Caller number
                </span>
                <input
                  value={formState.callerPhone}
                  onChange={(event) => setFormState((current) => ({ ...current, callerPhone: event.target.value }))}
                  placeholder="+91 98xxxxxx00"
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Call outcome
                </span>
                <select
                  value={formState.outcome}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, outcome: event.target.value as CallOutcome }))
                  }
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
                >
                  <option value="missed">Missed call</option>
                  <option value="answered">Answered</option>
                  <option value="busy">Busy line</option>
                  <option value="not_reachable">Not reachable</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Priority callback
                </span>
                <button
                  type="button"
                  onClick={() => setFormState((current) => ({ ...current, priority: !current.priority }))}
                  className={cn(
                    "flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition",
                    formState.priority
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]/35 text-[var(--primary)]"
                      : "border-black/5 bg-white text-[var(--text-muted)]"
                  )}
                >
                  <span>Keep this call at the top of the queue</span>
                  <span className="text-lg">{formState.priority ? "●" : "○"}</span>
                </button>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Callback note
              </span>
              <textarea
                value={formState.callbackNote}
                onChange={(event) => setFormState((current) => ({ ...current, callbackNote: event.target.value }))}
                placeholder="Dates shared? Room type? Need callback after lunch?"
                rows={4}
                className="w-full rounded-[22px] border border-black/5 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-[var(--error-soft)] bg-[var(--error-soft)]/40 px-4 py-3 text-sm text-[var(--error)]">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create callback lead"}
              </Button>
              <Link href="/dashboard">
                <Button tone="surface" type="button">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        <Card className="border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(24,18,72,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">Callback queue</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                The reservation-line follow-ups waiting for the next call-back action.
              </p>
            </div>
            <Badge tone="primary">{callLeads.length} calls</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {callLeads.length ? (
              callLeads.map((lead) => {
                const selected = lead.id === selectedCall?.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedCallId(lead.id)}
                    className={cn(
                      "w-full rounded-[22px] border p-4 text-left transition",
                      selected
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]/30 shadow-lg"
                        : "border-black/5 bg-white hover:-translate-y-0.5 hover:shadow-lg"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{lead.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{lead.phone}</p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{lead.updatedAtLabel}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="neutral">{lead.stage}</Badge>
                      <Badge tone={lead.score >= 80 ? "secondary" : "tertiary"}>{lead.score} score</Badge>
                      <Badge tone={lead.tags.includes("Priority Callback") ? "primary" : "neutral"}>
                        {lead.tags.includes("Priority Callback") ? "Priority" : "Callback"}
                      </Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-black/10 bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-muted)]">
                No call leads yet. Log the first missed call from the reservation line to start the callback queue.
              </div>
            )}
          </div>

          {selectedCall ? (
            <div className="mt-6 rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Selected lead</p>
              <h4 className="mt-2 text-xl font-extrabold tracking-tight text-black">{selectedCall.name}</h4>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {selectedCall.intent} · {selectedCall.party}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button iconRight={<Icon name="arrow-right" />} className="justify-start">
                    Open in Dashboard
                  </Button>
                </Link>
                <Badge tone="secondary">Last updated {selectedCall.updatedAtLabel}</Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {([
                  ["called", "Called"],
                  ["no_answer", "No Answer"],
                  ["converted", "Converted"]
                ] as Array<[CallbackStatus, string]>).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateCallbackStatus(status)}
                    disabled={isSaving}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      status === "converted"
                        ? "border-[var(--secondary)] bg-[var(--secondary-soft)]/30"
                        : status === "called"
                          ? "border-[var(--primary)] bg-[var(--primary-soft)]/25"
                          : "border-black/5 bg-white"
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Callback status
                    </p>
                    <p className="mt-1 text-base font-black tracking-tight text-black">{label}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {status === "called"
                        ? "Mark when the team has already called back."
                        : status === "no_answer"
                          ? "Use when the callback did not connect."
                          : "Use when the reservation call turned into a booking."}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
