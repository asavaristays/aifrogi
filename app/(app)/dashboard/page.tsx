import { getCurrentUser } from "@/lib/auth-server";
import { ClientDashboardView, type DashboardAttention } from "@/components/dashboard/client-dashboard-view";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";
import { loadLeads } from "@/lib/services/lead-service";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { buildWhatsAppMetrics, filterWhatsAppLeads } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";
import { evaluateBotReadiness } from "@/lib/bot-readiness";
import { buildHumanResponseReport } from "@/lib/human-response-sla";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [propertySlug, user] = await Promise.all([getCurrentWorkspaceSlug(), getCurrentUser()]);
  const organization = user && user.role !== "admin" ? await getOrganizationForMember(user.username) : null;
  const [allLeads, integration, tickets, knowledge, governance] = await Promise.all([
    loadLeads(propertySlug),
    loadWhatsAppIntegration(propertySlug),
    organization ? listSupportTickets({ organizationId: organization.id }) : Promise.resolve([]),
    getKnowledgeWorkspaceSummary(propertySlug),
    getKnowledgeGovernanceSummary(propertySlug)
  ]);
  const whatsappEnabled = organization?.botProfile?.channels.includes("WHATSAPP") ?? false;
  const leads = whatsappEnabled ? filterWhatsAppLeads(allLeads) : allLeads.filter((lead) => /website|ai bot/i.test(lead.source));
  const metrics = buildWhatsAppMetrics(leads);
  const recent = [...leads].sort((a, b) => +new Date(b.updatedAtIso) - +new Date(a.updatedAtIso)).slice(0, 5);
  const connected = integration.status === "CONNECTED";
  const metaStatus = organization?.onboarding?.metaStatus || (connected ? "LIVE" : "NOT_STARTED");
  const messages = leads.flatMap((lead) => lead.transcript);
  const countStatus = (status: string) => messages.filter((message) => message.status === status).length;
  const failedPayment = countStatus("failed_payment_required");
  const failedTemplate = countStatus("failed_template_required");
  const failedEngagement = countStatus("failed_engagement_limit");
  const failedRecipient = countStatus("failed_recipient_unavailable");
  const openTickets = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  const botReadiness = evaluateBotReadiness({ profile: organization?.botProfile, connectors: organization?.botConnectors || [], businessVerified: organization?.onboarding?.kycStatus === "APPROVED", approvedKnowledgeCount: governance.entries.filter((item) => item.status === "APPROVED").length + governance.documents.filter((item) => item.status === "APPROVED").length, websitePageCount: knowledge.pages.length, whatsappConnected: connected });
  const humanResponse = buildHumanResponseReport({ leads: allLeads, slaMinutes: organization?.botProfile?.responseSlaMinutes, reminderPercent: organization?.botProfile?.reminderPercent, fallbackEnabled: organization?.botProfile?.fallbackEnabled });

  const attention: DashboardAttention[] = [];
  if (metrics.unanswered) attention.push({ title: `${metrics.unanswered} conversation${metrics.unanswered === 1 ? "" : "s"} waiting`, reason: "The customer's latest message has not received a reply.", action: "Reply now", href: "/whatsapp-bot", tone: "urgent", owner: "You" });
  if (humanResponse.overdue) attention.unshift({ title: `${humanResponse.overdue} human response SLA ${humanResponse.overdue === 1 ? "breach" : "breaches"}`, reason: `Oldest customer has waited ${humanResponse.oldestWaitingMinutes} minutes. ${humanResponse.fallbackEligible ? `${humanResponse.fallbackEligible} approved fallback candidate${humanResponse.fallbackEligible === 1 ? "" : "s"}.` : "Fallback sending remains disabled."}`, action: "Open response report", href: "/dashboard#human-response", tone: "urgent", owner: "You" });
  if (whatsappEnabled && failedPayment) attention.push({ title: "Meta billing blocked delivery", reason: `${failedPayment} message${failedPayment === 1 ? "" : "s"} failed because billing needs attention.`, action: "Check billing", href: "/setup", tone: "urgent", owner: "You" });
  if (whatsappEnabled && failedTemplate) attention.push({ title: "Use an approved template", reason: `${failedTemplate} outbound attempt${failedTemplate === 1 ? "" : "s"} occurred outside the active reply window.`, action: "Open campaigns", href: "/campaigns", tone: "waiting", owner: "AiFrogi" });
  if (whatsappEnabled && failedEngagement) attention.push({ title: "Campaign delivery was limited", reason: "Reduce frequency and use recent, opted-in contacts before retrying.", action: "Review audience", href: "/campaigns", tone: "waiting", owner: "Meta" });
  if (whatsappEnabled && failedRecipient) attention.push({ title: "A recipient could not receive WhatsApp", reason: "Validate the unavailable number before another attempt.", action: "Review contacts", href: "/contacts", tone: "waiting", owner: "You" });
  if (whatsappEnabled && !connected) attention.push({ title: "WhatsApp setup is incomplete", reason: "Messaging remains unavailable until the secure connection is complete.", action: "Resume setup", href: "/onboarding", tone: "urgent", owner: "You" });
  if (!knowledge.pages.length) attention.push({ title: "Knowledge is not ready", reason: "Sync the approved business website before enabling grounded AI answers.", action: "Set up knowledge", href: "/knowledge", tone: "waiting", owner: "You" });
  if (!botReadiness.ready) attention.push({ title: `Bot readiness is ${botReadiness.percent}%`, reason: `${botReadiness.total - botReadiness.completed} governed onboarding gate${botReadiness.total - botReadiness.completed === 1 ? " remains" : "s remain"} before this bot is fully operational.`, action: "Review bot setup", href: "/onboarding", tone: "waiting", owner: "You" });
  if (!attention.length) attention.push(whatsappEnabled
    ? { title: "Messaging is operating normally", reason: "No reply, billing, template, or connection blockers are visible.", action: "Open inbox", href: "/whatsapp-bot", tone: "ready", owner: "AiFrogi" }
    : { title: "AI Bot is operating normally", reason: "No unanswered conversation or intelligence blocker is visible.", action: "Open inbox", href: "/whatsapp-bot", tone: "ready", owner: "AiFrogi" });

  const workspace = organization?.properties.find((property) => property.slug === propertySlug) || organization?.properties[0];
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
    displayPhoneNumber={integration.displayPhoneNumber || organization?.onboarding?.displayPhoneNumber || ""}
    connected={connected}
    whatsappEnabled={whatsappEnabled}
    metaStatus={metaStatus}
    accessRole={membership?.role || "AGENT"}
    knowledgeReady={knowledge.pages.length > 0 && knowledge.settings.status === "READY" && knowledge.settings.approvedForAi}
    botName={organization?.botProfile?.personaName || "Business Assistant"}
    botCategory={organization?.botProfile?.category || "BUSINESS_AI"}
    botReadiness={botReadiness}
    humanResponse={humanResponse}
    attention={attention}
    readiness={[
      { label: "Business", value: organization?.onboarding?.kycStatus === "APPROVED" || !organization ? "Verified" : "In review", ok: organization?.onboarding?.kycStatus === "APPROVED" || !organization },
      ...(whatsappEnabled ? [{ label: "Meta", value: metaStatus === "LIVE" ? "Live" : metaStatus.replaceAll("_", " "), ok: metaStatus === "LIVE" }, { label: "WhatsApp", value: connected ? "Connected" : "Needs setup", ok: connected }] : []),
      { label: "Billing", value: failedPayment ? "Action required" : "No blocker", ok: !failedPayment },
      { label: "Knowledge", value: knowledge.pages.length ? `${knowledge.pages.length} pages` : "Needs setup", ok: knowledge.pages.length > 0 }
    ]}
    recent={recent}
    metrics={metrics}
    openTicketCount={openTickets.length}
  />;
}
