import { getCurrentUser } from "@/lib/auth-server";
import { ClientDashboardView, type DashboardAttention } from "@/components/dashboard/client-dashboard-view";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";
import { loadLeads } from "@/lib/services/lead-service";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { buildWhatsAppMetrics, filterWhatsAppLeads } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [propertySlug, user] = await Promise.all([getCurrentWorkspaceSlug(), getCurrentUser()]);
  const organization = user && user.role !== "admin" ? await getOrganizationForMember(user.username) : null;
  const [allLeads, integration, tickets, knowledge] = await Promise.all([
    loadLeads(propertySlug),
    loadWhatsAppIntegration(propertySlug),
    organization ? listSupportTickets({ organizationId: organization.id }) : Promise.resolve([]),
    getKnowledgeWorkspaceSummary(propertySlug)
  ]);
  const leads = filterWhatsAppLeads(allLeads);
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

  const attention: DashboardAttention[] = [];
  if (metrics.unanswered) attention.push({ title: `${metrics.unanswered} conversation${metrics.unanswered === 1 ? "" : "s"} waiting`, reason: "The customer's latest message has not received a reply.", action: "Reply now", href: "/whatsapp-bot", tone: "urgent", owner: "You" });
  if (failedPayment) attention.push({ title: "Meta billing blocked delivery", reason: `${failedPayment} message${failedPayment === 1 ? "" : "s"} failed because billing needs attention.`, action: "Check billing", href: "/setup", tone: "urgent", owner: "You" });
  if (failedTemplate) attention.push({ title: "Use an approved template", reason: `${failedTemplate} outbound attempt${failedTemplate === 1 ? "" : "s"} occurred outside the active reply window.`, action: "Open campaigns", href: "/campaigns", tone: "waiting", owner: "AiFrogi" });
  if (failedEngagement) attention.push({ title: "Campaign delivery was limited", reason: "Reduce frequency and use recent, opted-in contacts before retrying.", action: "Review audience", href: "/campaigns", tone: "waiting", owner: "Meta" });
  if (failedRecipient) attention.push({ title: "A recipient could not receive WhatsApp", reason: "Validate the unavailable number before another attempt.", action: "Review contacts", href: "/contacts", tone: "waiting", owner: "You" });
  if (!connected) attention.push({ title: "WhatsApp setup is incomplete", reason: "Messaging remains unavailable until the secure connection is complete.", action: "Resume setup", href: "/onboarding", tone: "urgent", owner: "You" });
  if (!knowledge.pages.length) attention.push({ title: "Knowledge is not ready", reason: "Sync the approved business website before enabling grounded AI answers.", action: "Set up knowledge", href: "/knowledge", tone: "waiting", owner: "You" });
  if (!attention.length) attention.push({ title: "Messaging is operating normally", reason: "No reply, billing, template, or connection blockers are visible.", action: "Open inbox", href: "/whatsapp-bot", tone: "ready", owner: "AiFrogi" });

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
    metaStatus={metaStatus}
    accessRole={membership?.role || "AGENT"}
    knowledgeReady={knowledge.pages.length > 0 && knowledge.settings.status === "READY" && knowledge.settings.approvedForAi}
    attention={attention}
    readiness={[
      { label: "Business", value: organization?.onboarding?.kycStatus === "APPROVED" || !organization ? "Verified" : "In review", ok: organization?.onboarding?.kycStatus === "APPROVED" || !organization },
      { label: "Meta", value: metaStatus === "LIVE" ? "Live" : metaStatus.replaceAll("_", " "), ok: metaStatus === "LIVE" },
      { label: "WhatsApp", value: connected ? "Connected" : "Needs setup", ok: connected },
      { label: "Billing", value: failedPayment ? "Action required" : "No blocker", ok: !failedPayment },
      { label: "Knowledge", value: knowledge.pages.length ? `${knowledge.pages.length} pages` : "Needs setup", ok: knowledge.pages.length > 0 }
    ]}
    recent={recent}
    metrics={metrics}
    openTicketCount={openTickets.length}
  />;
}
