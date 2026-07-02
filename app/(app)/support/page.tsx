import { TopBar } from "@/components/layout/top-bar";
import { SupportCenter } from "@/components/support/support-center";
import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();
  const organization = user ? await getOrganizationForMember(user.username) : null;
  const tickets = organization ? await listSupportTickets({ organizationId: organization.id }) : [];
  const serializedTickets = tickets.map((ticket) => ({
    ...ticket,
    updatedAt: ticket.updatedAt.toISOString(),
    messages: ticket.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))
  }));
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopBar title="Support" subtitle="Guided help for onboarding, messaging, billing, campaigns, and automation" notificationCount={tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length} />
      <main className="px-4 py-6 sm:px-6 lg:px-8"><SupportCenter initialTickets={serializedTickets} /></main>
    </div>
  );
}
