import { getCurrentUser } from "@/lib/auth-server";
import { ClientDashboardView, type DashboardAttention } from "@/components/dashboard/client-dashboard-view";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";
import { loadLeads } from "@/lib/services/lead-service";
import { buildWhatsAppMetrics } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";
import { evaluateBotReadiness } from "@/lib/bot-readiness";
import { buildHumanResponseReport } from "@/lib/human-response-sla";
import { getDb } from "@/lib/db";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { getClientSupportUpdates } from "@/lib/support-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [propertySlug, user] = await Promise.all([getCurrentWorkspaceSlug(), getCurrentUser()]);
  const organization = user && user.role !== "admin" ? await getOrganizationForMember(user.username) : null;
  const db = getDb();
  const workspaceProperty = organization?.properties.find(property => property.slug === propertySlug) || organization?.properties[0];
  const [allLeads, tickets, knowledge, governance, subscription, testActivity, answerEvidence] = await Promise.all([
    loadLeads(propertySlug),
    organization ? listSupportTickets({ organizationId: organization.id, includeMessages: true }) : Promise.resolve([]),
    getKnowledgeWorkspaceSummary(propertySlug),
    getKnowledgeGovernanceSummary(propertySlug),
    organization ? getOrganizationSubscriptionAccess(organization.id) : Promise.resolve(null),
    db && organization ? db.onboardingActivity.findFirst({ where: { organizationId: organization.id, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } }) : Promise.resolve(null),
    db && workspaceProperty ? db.sovereignAnswerEvidence.findFirst({ where: { propertyId: workspaceProperty.id }, select: { id: true } }) : Promise.resolve(null)
  ]);
  const leads = allLeads.filter((lead) => Boolean(lead.websiteSession) || /website|ai bot/i.test(lead.source));
  const metrics = buildWhatsAppMetrics(leads);
  const recent = [...leads].sort((a, b) => +new Date(b.updatedAtIso) - +new Date(a.updatedAtIso)).slice(0, 5);
  const connected = organization?.botProfile?.status === "LIVE";
  const openTickets = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  const supportUpdates = getClientSupportUpdates(tickets);
  const botReadiness = evaluateBotReadiness({ profile: organization?.botProfile, connectors: organization?.botConnectors || [], appearanceConfigured: Boolean(organization?.botProfile?.personaName && knowledge.settings.welcomeMessage && knowledge.settings.themeColor), approvedKnowledgeCount: governance.entries.filter((item) => item.status === "APPROVED").length + governance.documents.filter((item) => item.status === "APPROVED").length, websitePageCount: knowledge.pages.length, testComplete: Boolean(testActivity || answerEvidence), installationComplete: Boolean(organization?.botProfile?.installationDetectedAt || organization?.botProfile?.status === "LIVE") });
  const humanResponse = buildHumanResponseReport({ leads: allLeads, slaMinutes: organization?.botProfile?.responseSlaMinutes, reminderPercent: organization?.botProfile?.reminderPercent, fallbackEnabled: organization?.botProfile?.fallbackEnabled });

  const attention: DashboardAttention[] = [];
  if (metrics.unanswered) attention.push({ title: `${metrics.unanswered} conversation${metrics.unanswered === 1 ? "" : "s"} waiting`, reason: "The customer's latest message has not received a reply.", action: "Reply now", href: "/team-inbox", tone: "urgent", owner: "You" });
  if (humanResponse.overdue) attention.unshift({ title: `${humanResponse.overdue} human response SLA ${humanResponse.overdue === 1 ? "breach" : "breaches"}`, reason: `Oldest customer has waited ${humanResponse.oldestWaitingMinutes} minutes. ${humanResponse.fallbackEligible ? `${humanResponse.fallbackEligible} approved fallback candidate${humanResponse.fallbackEligible === 1 ? "" : "s"}.` : "Fallback sending remains disabled."}`, action: "Open response report", href: "/dashboard#human-response", tone: "urgent", owner: "You" });
  if (!knowledge.pages.length) attention.push({ title: "Knowledge is not ready", reason: "Sync the approved business website before enabling grounded AI answers.", action: "Set up knowledge", href: "/knowledge", tone: "waiting", owner: "You" });
  if (!botReadiness.ready) attention.push({ title: `Bot readiness is ${botReadiness.percent}%`, reason: `${botReadiness.total - botReadiness.completed} website-bot readiness item${botReadiness.total - botReadiness.completed === 1 ? " remains" : "s remain"} before this bot is fully operational.`, action: "Review bot setup", href: "/setup", tone: "waiting", owner: "You" });
  if (!attention.length) attention.push({ title: "AI Bot is operating normally", reason: "No unanswered conversation or intelligence blocker is visible.", action: "Open inbox", href: "/team-inbox", tone: "ready", owner: "AiFrogi" });

  const workspace = workspaceProperty;
  const membership = organization?.members.find((member) => member.email.toLowerCase() === user?.username.toLowerCase());
  const indiaHour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = indiaHour < 12 ? "Good morning" : indiaHour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());
  return <ClientDashboardView
    ownerName={organization?.ownerName || user?.label || "Operator"}
    greeting={greeting}
    todayLabel={todayLabel}
    organizationName={organization?.name || "HotelRADAR"}
    workspaceName={workspace?.name || propertySlug}
    displayPhoneNumber={organization?.publicPhone || organization?.ownerMobile || ""}
    connected={connected}
    whatsappEnabled={false}
    metaStatus="NOT_STARTED"
    accessRole={membership?.role || "AGENT"}
    knowledgeReady={knowledge.pages.length > 0 && knowledge.settings.status === "READY" && knowledge.settings.approvedForAi}
    botName={organization?.botProfile?.personaName || "Business Assistant"}
    botCategory={organization?.botProfile?.category || "BUSINESS_AI"}
    botReadiness={botReadiness}
    humanResponse={humanResponse}
    supportUpdates={supportUpdates}
    attention={attention}
    readiness={[
      { label: "Website bot", value: organization?.botProfile?.status === "LIVE" ? "Live" : "Needs setup", ok: organization?.botProfile?.status === "LIVE" },
      { label: "Plan", value: subscription?.canUsePaidActions ? subscription.planName : "Action required", ok: Boolean(subscription?.canUsePaidActions) },
      { label: "Intelligence", value: knowledge.pages.length ? `${knowledge.pages.length} pages` : "Needs setup", ok: knowledge.pages.length > 0 },
      { label: "Usage matrix", value: organization?.subscription ? organization.subscription.overageApproved ? "Approved overage" : "Hard-stop protected" : "Unavailable", ok: Boolean(organization?.subscription) }
    ]}
    recent={recent}
    metrics={metrics}
    openTicketCount={openTickets.length}
  />;
}
