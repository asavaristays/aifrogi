import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types";

export function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-extrabold">Recent Leads</h3>
        <span className="text-sm font-semibold text-[var(--primary)]">Live feed</span>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-muted)]">
          No live leads yet. New inquiries from WhatsApp, email, calls, AI bot, or manual entry will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-2xl border border-black/5 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] font-bold text-[var(--primary)]">
                  {lead.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{lead.name}</p>
                    <span className="text-xs text-[var(--text-muted)]">{lead.minutesAgo}m ago</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Last updated: {lead.updatedAtLabel}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{lead.source}</Badge>
                    <Badge tone={lead.stage === "Booked" ? "secondary" : lead.stage === "Qualified" ? "tertiary" : "primary"}>
                      {lead.stage}
                    </Badge>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{lead.score} score</span>
                    <Link
                      href={`/api/leads/${lead.id}`}
                      target="_blank"
                      className="text-xs font-semibold text-[var(--primary)] underline underline-offset-4"
                    >
                      Check
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
