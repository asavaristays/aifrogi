import { NextRequest, NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { loadLeads } from "@/lib/services/lead-service";
import { buildWhatsAppMetrics } from "@/lib/whatsapp-metrics";
import { resolveReportPeriod, websiteLeadsForPeriod, websiteMonthlyReport, websiteOutcomeSummary } from "@/lib/website-reporting";
import { createSimplePdf, type PdfLine } from "@/lib/pdf-report";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await resolveClientWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const period = resolveReportPeriod(request.nextUrl.searchParams.get("period") || undefined);
  const allLeads = await loadLeads(access.propertySlug);
  const leads = websiteLeadsForPeriod(allLeads, period.since);
  const metrics = buildWhatsAppMetrics(leads);
  const outcomes = websiteOutcomeSummary(leads);
  const monthly = websiteMonthlyReport(allLeads);
  const answered = Math.max(metrics.contacts - metrics.unanswered, 0);
  const answerRate = metrics.contacts ? Math.round((answered / metrics.contacts) * 100) : 0;
  const pages: PdfLine[][] = [];
  let page: PdfLine[] = [];
  let y = 795;
  const add = (text: string, x = 45, size = 10, bold = false) => { page.push({ text, x, y, size, bold }); y -= size + 8; };
  const newPage = () => { if (page.length) pages.push(page); page = []; y = 795; };

  add("AiFrogi Website-Bot Report", 45, 20, true);
  add(access.property.name || access.organization.name, 45, 13, true);
  add(`Reporting period: ${period.label}`);
  add(`Generated: ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date())}`);
  y -= 10;
  add("Selected-period summary", 45, 14, true);
  add(`Conversations: ${metrics.contacts}    Visitor messages: ${metrics.incoming}    Bot / team replies: ${metrics.outgoing}`);
  add(`Answer rate: ${answerRate}%    Awaiting reply: ${metrics.unanswered}    Average response: ${metrics.averageResponseLabel}`);
  add(`Qualified leads: ${outcomes.qualified} (${outcomes.qualificationRate}%)    Contacts captured: ${outcomes.captured} (${outcomes.captureRate}%)`);
  y -= 12;
  add("Monthly history - latest 12 calendar months", 45, 14, true);
  add("Month          Chats   Visitor   Replies   Qualified   Captured   Answer rate", 45, 9, true);
  monthly.forEach((row) => add(`${row.label.padEnd(14)} ${String(row.conversations).padStart(5)}   ${String(row.incoming).padStart(7)}   ${String(row.outgoing).padStart(7)}   ${String(row.qualified).padStart(9)}   ${String(row.captured).padStart(8)}   ${String(row.answerRate).padStart(9)}%`, 45, 9));
  y -= 12;
  add("Notes", 45, 12, true);
  add("Figures are calculated from this workspace's recorded website-bot conversations.", 45, 9);
  add("Qualified leads use the current governed lead score; captured contacts require recorded consent.", 45, 9);
  newPage();

  const pdf = createSimplePdf(pages);
  const filename = `aifrogi-${access.propertySlug}-${period.period}-report.pdf`.replace(/[^a-z0-9._-]/gi, "-");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
