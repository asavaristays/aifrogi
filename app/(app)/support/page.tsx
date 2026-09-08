import { TopBar } from "@/components/layout/top-bar";
import { SupportAccessPanel } from "@/components/support/support-access-panel";
import { SupportCenter } from "@/components/support/support-center";
import { getCurrentUser } from "@/lib/auth-server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets, markSupportTicketViewed } from "@/lib/repositories/support-repository";
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
      createdAt: ticket.createdAt.toISOString(),
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
  if (organization) await markSupportTicketViewed({ organizationId: organization.id, viewer: "CLIENT" });
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopBar title="Support" subtitle="Guided help for widget onboarding, website conversations, billing, and automation" notificationCount={tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length} />
      <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <SupportCenter initialTickets={serializedTickets} />
        <details className="group overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <span>
              <strong className="block text-sm">Privacy and temporary support access</strong>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">Only use this when support asks for temporary access to diagnose a ticket.</span>
            </span>
            <span className="text-xl text-[#6d5310] transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="border-t border-black/6 p-4 sm:p-6">
            <SupportAccessPanel initialGrants={serializedGrants} initialEvents={serializedEvents} canManage={Boolean(access && canManageWorkspace(access.role))} />
          </div>
        </details>
      </main>
    </div>
  );
}
