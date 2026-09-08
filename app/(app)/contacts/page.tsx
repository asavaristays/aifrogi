import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadLeads } from "@/lib/services/lead-service";
import { gradeCapturedLead, isCapturedLead, leadGradeLabel, type LeadGrade } from "@/lib/lead-insights";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const leads = (await loadLeads(propertySlug)).filter(isCapturedLead);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f1fbf5_0%,#ffffff_50%,#eef8f5_100%)]">
      <TopBar title="Leads" subtitle="Visitors who asked for follow-up and explicitly shared their details" />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border border-black/5 p-0 shadow-[0_20px_60px_rgba(15,61,53,0.08)]">
          <div className="flex flex-col gap-3 border-b border-black/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a6a16]">Consented lead capture</p>
              <h2 className="mt-2 text-2xl font-black">{leads.length} qualified lead{leads.length === 1 ? "" : "s"}</h2>
              <p className="mt-2 text-xs text-[var(--text-muted)]">A = Hot · B = Warm · C = Nurture. Grades use the bot&apos;s recorded qualification score.</p>
            </div>
            <Link href="/team-inbox" className="rounded-2xl bg-[#8a6a16] px-4 py-3 text-sm font-black text-white">
              Open Team Inbox
            </Link>
          </div>

          {leads.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#f4faf7] text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Lead</th>
                    <th className="px-6 py-4">Need and context</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {leads.map((lead) => {
                    const grade = gradeCapturedLead(lead);
                    return <tr key={lead.id} className="bg-white transition hover:bg-[#f8fcfa]">
                      <td className="px-6 py-4"><LeadGradeBadge grade={grade} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dcfce7] text-sm font-black text-[#8a6a16]">{lead.initials}</span>
                          <div>
                            <p className="text-sm font-black">{lead.websiteSession?.contactName || lead.name}</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">{lead.websiteSession?.contactValue}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[280px] px-6 py-4"><p className="text-sm font-semibold">{lead.intent || "Follow-up requested"}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{[lead.stay, lead.party, lead.budget].filter((value) => value && value !== "—").join(" · ") || "Captured from website AI Bot"}</p></td>
                      <td className="px-6 py-4 text-sm font-black">{lead.score}</td>
                      <td className="px-6 py-4"><Badge tone={lead.transcript.at(-1)?.from === "guest" ? "error" : "secondary"}>{lead.transcript.at(-1)?.from === "guest" ? "Awaiting reply" : lead.stage.replaceAll("_", " ")}</Badge></td>
                      <td className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]">{lead.updatedAtLabel}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-[var(--text-muted)]">
              No captured leads yet. A lead appears only after the bot identifies meaningful intent and the visitor shares a name, mobile number and consent for follow-up.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function LeadGradeBadge({ grade }: { grade: LeadGrade }) {
  const tone = grade === "A" ? "error" : grade === "B" ? "secondary" : "neutral";
  return <Badge tone={tone}>{grade} · {leadGradeLabel(grade)}</Badge>;
}
