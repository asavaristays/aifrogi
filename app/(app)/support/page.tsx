import { TopBar } from "@/components/layout/top-bar";
import { SupportAccessPanel } from "@/components/support/support-access-panel";
import { SupportCenter } from "@/components/support/support-center";
import { getCurrentUser } from "@/lib/auth-server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";
import { listSupportAccessEvents, listSupportAccessGrants } from "@/lib/support-access";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const [user, access] = await Promise.all([getCurrentUser(), getCurrentClientAccess()]);
  const organization = user ? await getOrganizationForMember(user.username) : null;
  const [tickets, grants, events] = organization ? await Promise.all([
    listSupportTickets({ organizationId: organization.id, includeMessages: true }),
    listSupportAccessGrants(organization.id),
    listSupportAccessEvents(organization.id)
  ]) : [[], [], []];
  const serializedTickets = tickets.map((ticket) => {
    const messages = (ticket as typeof ticket & { messages?: Array<{ id: string; authorEmail: string; authorRole: string; body: string; createdAt: Date }> }).messages || [];
    return {
      ...ticket,
      updatedAt: ticket.updatedAt.toISOString(),
      messages: messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))
    };
  });
  const serializedGrants = grants.map((grant) => ({
    ...grant,
    grantedAt: grant.grantedAt.toISOString(),
    expiresAt: grant.expiresAt.toISOString(),
    revokedAt: grant.revokedAt?.toISOString() || null
  }));
  const serializedEvents = events.map((event) => ({
    ...event,
    createdAt: event.createdAt.toISOString()
  }));
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopBar title="Support" subtitle="Guided help for onboarding, messaging, billing, campaigns, and automation" notificationCount={tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length} />
      <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <SupportAccessPanel initialGrants={serializedGrants} initialEvents={serializedEvents} canManage={Boolean(access && canManageWorkspace(access.role))} />
        <SupportCenter initialTickets={serializedTickets} />
      </main>
    </div>
  );
}
