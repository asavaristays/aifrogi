import Link from "next/link";
import type { Lead } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";

function isTodayInKolkata(dateIso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(dateIso));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const formatted = `${year}-${month}-${day}`;

  const todayParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const todayYear = todayParts.find((part) => part.type === "year")?.value ?? "";
  const todayMonth = todayParts.find((part) => part.type === "month")?.value ?? "";
  const todayDay = todayParts.find((part) => part.type === "day")?.value ?? "";

  return formatted === `${todayYear}-${todayMonth}-${todayDay}`;
}

export function CallSummaryCard({ leads }: { leads: Lead[] }) {
  const callLeads = leads.filter((lead) => lead.source.trim().toLowerCase() === "call");
  const todayCalls = callLeads.filter((lead) => isTodayInKolkata(lead.updatedAtIso));
  const answered = todayCalls.filter((lead) => lead.stage !== "New").length;
  const noAnswer = todayCalls.filter((lead) => lead.stage === "New").length;
  const converted = todayCalls.filter((lead) => lead.stage === "Booked").length;
  const callbackQueue = callLeads.filter((lead) => lead.tags.includes("Priority Callback") || lead.stage === "New").slice(0, 3);
  const responseAverage = todayCalls.length
    ? Math.round(todayCalls.reduce((sum, lead) => sum + Math.max(1, lead.minutesAgo), 0) / todayCalls.length)
    : 0;

  return (
    <Card className="overflow-hidden border border-black/5 bg-[linear-gradient(135deg,rgba(56,46,170,0.14),rgba(34,182,122,0.12))] p-0 shadow-[0_20px_65px_rgba(24,18,72,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="secondary">Daily call summary</Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Reservation line pulse
            </span>
          </div>
          <h3 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-[var(--text)]">
            Today’s calls are the fastest route to a booked stay.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            This summary resets around today’s activity in IST and keeps the reservation-line work visible at a glance.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/call-leads">
              <Button iconLeft={<Icon name="phone" />} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)]">
                Open call queue
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button tone="surface">Open Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-0 border-t border-black/5 bg-white/55 p-6 sm:p-7 lg:border-l lg:border-t-0">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Received", todayCalls.length, "primary"],
              ["Answered", answered, "secondary"],
              ["No Answer", noAnswer, "tertiary"],
              ["Converted", converted, "neutral"]
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{value as number}</p>
                <Badge
                  tone={tone as "primary" | "secondary" | "tertiary" | "neutral"}
                  className="mt-3 bg-transparent px-0 py-0 text-[10px] tracking-[0.18em]"
                >
                  Today
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[22px] border border-black/5 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">Average response</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[var(--text)]">{responseAverage}m</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Average time to respond to today’s call leads.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/70 bg-white/55 px-6 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Callback queue</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Priority follow-ups waiting for a team callback.</p>
          </div>
          <Badge tone="primary">{callbackQueue.length} queued</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {callbackQueue.length ? (
            callbackQueue.map((lead) => (
              <div key={lead.id} className="rounded-[20px] border border-black/5 bg-white p-4">
                <p className="font-bold">{lead.name}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{lead.phone}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  {lead.stage}
                </p>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 rounded-[20px] border border-dashed border-black/10 bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-muted)]">
              No urgent callback items right now. New missed calls will appear here automatically.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
