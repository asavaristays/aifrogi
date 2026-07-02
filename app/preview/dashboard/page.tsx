import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ClientDashboardView, type DashboardAttention } from "@/components/dashboard/client-dashboard-view";
import type { Lead } from "@/types";

export default async function DashboardPreviewPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const state = (await searchParams).state || "warning";
  const disconnected = state === "disconnected";
  const empty = state === "empty";
  const healthy = state === "healthy";
  const leads: Lead[] = empty ? [] : [
    previewLead("preview-1", "Aarav Mehta", "AM", "Can you share what is included in the 30-day trial?", healthy ? "agent" : "guest", 8, !healthy),
    previewLead("preview-2", "Casa Sereno Goa", "CS", "Thank you. We will review the audit link today.", "agent", 24, false),
    previewLead("preview-3", "Palm Grove Villas", "PG", "We need WhatsApp automation for booking enquiries.", healthy ? "agent" : "guest", 41, false)
  ];
  const attention: DashboardAttention[] = disconnected
    ? [{ title: "WhatsApp setup is incomplete", reason: "Messaging remains unavailable until the secure connection is complete.", action: "Resume setup", href: "/onboarding", tone: "urgent", owner: "You" }]
    : healthy
      ? [{ title: "Messaging is operating normally", reason: "No reply, billing, template, or connection blockers are visible.", action: "Open inbox", href: "/whatsapp-bot", tone: "ready", owner: "AiFrogi" }]
      : empty
        ? [{ title: "Run your first messaging test", reason: "Send one approved test message and confirm that the reply returns to AiFrogi.", action: "Start test", href: "/campaigns", tone: "waiting", owner: "You" }]
        : [
            { title: "2 conversations waiting", reason: "The customer's latest message has not received a reply.", action: "Reply now", href: "/whatsapp-bot", tone: "urgent", owner: "You" },
            { title: "Campaign delivery was limited", reason: "Reduce frequency and use recent, opted-in contacts before retrying.", action: "Review audience", href: "/campaigns", tone: "waiting", owner: "Meta" }
          ];
  const connected = !disconnected;

  return <AppShell workspaces={[{ id: "preview", name: "AiFrogi Demo", slug: "hotelradar", status: connected ? "CONNECTED" : "NOT_CONFIGURED", displayPhoneNumber: connected ? "+91 70589 63898" : "" }]} currentWorkspaceSlug="hotelradar"><ClientDashboardView
    ownerName="Manish Purohit"
    greeting="Good afternoon"
    todayLabel="Thursday, 2 July"
    organizationName="AiFrogi Demo"
    workspaceName="AiFrogi"
    displayPhoneNumber={connected ? "+91 70589 63898" : ""}
    connected={connected}
    metaStatus={connected ? "LIVE" : "NOT_STARTED"}
    attention={attention}
    readiness={[
      { label: "Business", value: "Verified", ok: true },
      { label: "Meta", value: connected ? "Live" : "Not started", ok: connected },
      { label: "WhatsApp", value: connected ? "Connected" : "Needs setup", ok: connected },
      { label: "Billing", value: connected ? "No blocker" : "Waiting", ok: connected }
    ]}
    recent={leads}
    metrics={empty || disconnected ? { contacts: 0, incoming: 0, unanswered: 0, averageResponseLabel: "—", readRate: 0, deliveryRate: 0, failed: 0 } : { contacts: 25, incoming: 28, unanswered: healthy ? 0 : 2, averageResponseLabel: "6m", readRate: 62, deliveryRate: 88, failed: healthy ? 0 : 3 }}
    openTicketCount={healthy ? 0 : 1}
  /></AppShell>;
}

function previewLead(id: string, name: string, initials: string, text: string, from: "guest" | "agent", minutesAgo: number, isHighPriority: boolean): Lead {
  const sentAt = new Date(Date.now() - minutesAgo * 60000);
  return { id, name, initials, score: isHighPriority ? 88 : 65, source: "WhatsApp", stage: "NEW", minutesAgo, language: "EN", intent: "WhatsApp enquiry", stay: "Business details pending", party: "Service requirement pending", budget: "Budget not shared", phone: "+910000000000", updatedAtLabel: `${minutesAgo}m`, updatedAtIso: sentAt.toISOString(), tags: [], isHighPriority, transcript: [{ id: `${id}-message`, from, text, time: `${minutesAgo}m`, sentAtIso: sentAt.toISOString(), status: from === "agent" ? "read" : null }] };
}
