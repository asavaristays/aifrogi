import Link from "next/link";
import {PilotMeasurementPanel} from '@/components/analytics/pilot-measurement-panel';
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { getClientImprovementReport } from "@/lib/repositories/improvement-report-repository";
import { ImprovementAnswerQueue, type ImprovementItem } from "@/components/improve/improvement-answer-queue";

export const dynamic = "force-dynamic";

export default async function ImproveMyBotPage() {
  const access = await resolveClientWorkspaceAccess();
  if (!access.ok) redirect("/login");
  const report = await getClientImprovementReport(access.propertyId);
  const helpfulRate = report.feedbackTotal ? Math.round((report.helpful / report.feedbackTotal) * 100) : null;
  const unresolvedFeedback = report.negativeFeedback.filter((item) => item.evidence.replayCase?.status !== "RESOLVED_BY_CLIENT").length;
  const unresolvedGaps = report.gaps.filter((item) => item.status === "OPEN").length;
  const actionCount = unresolvedFeedback + report.flags.length + unresolvedGaps;
  const feedbackItems: ImprovementItem[] = report.negativeFeedback.map((item) => ({ id: item.id, sourceType: "FEEDBACK", question: item.evidence.resolvedQuestion || item.evidence.question, botAnswer: item.evidence.answer, detail: plainReason(item.reason) || "The visitor marked this answer as not helpful.", badge: item.evidence.failureClassification.replaceAll("_", " ").toLowerCase(), context: stringList(item.evidence.replayCase?.anonymizedPriorTurns), entryId: item.resolutionEntry?.id, savedAnswer: item.resolutionEntry?.answer, category: item.resolutionEntry?.category }));
  const gapItems: ImprovementItem[] = report.gaps.map((gap) => ({ id: gap.id, sourceType: "GAP", question: gap.question, detail: `Asked ${gap.occurrenceCount} time${gap.occurrenceCount === 1 ? "" : "s"}.`, badge: "Knowledge gap", entryId: gap.resolutionEntry?.id, savedAnswer: gap.resolutionEntry?.answer, category: gap.resolutionEntry?.category }));
  return <div className="min-h-screen bg-[var(--background)]"><TopBar title="Improve My Bot" subtitle="Review customer feedback and safely teach your bot" notificationCount={actionCount} /><main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-[28px] bg-[#080808] text-white shadow-[0_28px_80px_rgba(0,0,0,.18)]"><div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#e2c66d]">Governed learning</p><h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Your customers show us what the bot should learn next.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/58">Feedback creates a review item—not an automatic rewrite. You control business facts; AiFrogi controls safety, testing and publication.</p></div><Link href="/knowledge#manual-answer-form" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#b38a20] px-6 text-sm font-bold text-white">Add correct information</Link></div><div className="grid border-t border-white/10 sm:grid-cols-4"><Metric dark label="Helpful answers" value={helpfulRate === null ? "No ratings" : `${helpfulRate}%`} /><Metric dark label="Needs review" value={unresolvedFeedback} /><Metric dark label="Incorrect facts" value={report.flags.length} /><Metric dark label="Missing answers" value={unresolvedGaps} /></div></section>

    {!actionCount ? <section className="rounded-[24px] border border-[#cce9dc] bg-[#effaf5] px-6 py-10 text-center"><span className="text-3xl">✓</span><h2 className="mt-3 text-xl font-semibold">Nothing needs your attention</h2><p className="mt-2 text-sm text-[var(--text-muted)]">New feedback and unanswered questions will appear here automatically.</p></section> : null}

    {report.flags.length ? <ReviewSection eyebrow="Act first" title="Customers flagged incorrect information" copy="The affected answer is paused where possible until it is corrected.">{report.flags.map((flag) => <ReviewRow key={flag.id} title={flag.entry?.question || "Answer reported as incorrect"} answer={flag.entry?.answer} detail={flag.reason} badge="Paused for review" urgent href="/knowledge" action="Review and correct" />)}</ReviewSection> : null}

    {feedbackItems.length ? <ReviewSection eyebrow="Customer feedback" title="Answers that were not helpful" copy="Open a question, enter the better answer, then save and approve it here."><ImprovementAnswerQueue items={feedbackItems} /></ReviewSection> : null}

    {gapItems.length ? <ReviewSection eyebrow="Missing information" title="Questions your bot could not answer" copy="Open a question, add the correct answer, then manage it here."><ImprovementAnswerQueue items={gapItems} /></ReviewSection> : null}

    <section className="rounded-[24px] border border-[var(--border)] bg-white p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="product-eyebrow">Need AiFrogi?</p><h2 className="mt-2 text-xl font-semibold">Request intelligence review</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Use Support when the information is already correct but the bot misunderstood intent, retrieval or handover.</p></div><Link href="/support" className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/12 px-5 text-sm font-bold">Open support</Link></div></section>
    <PilotMeasurementPanel propertyId={access.propertyId}/>
  </main></div>;
}

function ReviewSection({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white"><div className="border-b border-[var(--border)] px-6 py-5"><p className="product-eyebrow">{eyebrow}</p><h2 className="mt-2 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-[var(--text-muted)]">{copy}</p></div><div className="divide-y divide-[var(--border)]">{children}</div></section>; }
function ReviewRow({ title, answer, detail, badge, href, action, urgent = false }: { title: string; answer?: string | null; detail: string; badge: string; href: string; action: string; urgent?: boolean }) { return <article className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{title}</strong><span className={`status-pill ${urgent ? "status-error" : "status-warning"}`}>{badge}</span></div>{answer ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">Bot answered: {answer}</p> : null}<p className="mt-2 text-xs font-medium text-[#6d5310]">{detail}</p></div><Link href={href} className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#101010] px-4 text-xs font-bold text-white">{action}</Link></article>; }
function Metric({ label, value, dark = false }: { label: string; value: string | number; dark?: boolean }) { return <div className={`p-5 ${dark ? "border-white/10 sm:border-r last:border-r-0" : ""}`}><p className={`text-xs ${dark ? "text-white/45" : "text-[var(--text-muted)]"}`}>{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function plainReason(value: string | null) { if (!value) return ""; const marker = value.lastIndexOf("||"); return (marker >= 0 ? value.slice(marker + 2) : value).replace(/^\[SIGNAL[^\]]+\]\s*/i, "").trim(); }
function stringList(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []; }
