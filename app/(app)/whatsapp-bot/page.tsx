import { TopBar } from "@/components/layout/top-bar";
import { WhatsAppBotClient } from "@/components/whatsapp/whatsapp-bot-client";
import { loadLeads } from "@/lib/services/lead-service";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import type { Lead } from "@/types";
import { getCurrentUser } from "@/lib/auth-server";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WhatsAppBotPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const user = await getCurrentUser();
  const [leads, integration, organization] = await Promise.all([
    loadLeads(propertySlug),
    loadWhatsAppIntegration(propertySlug),
    user ? loadOnboardingForUser(user.username) : null
  ]);
  const conversations = leads.filter((lead): lead is Lead => {
    return Boolean(lead?.id && lead?.source && lead?.stage);
  });
  const unreadCount = conversations.filter((lead) => lead.stage !== "Booked").length;

  return (
    <div className="product-surface min-h-screen">
      <TopBar title={organization?.botProfile?.channels.includes("WHATSAPP") ? "AI Operations Inbox" : "AI Bot Inbox"} subtitle={organization?.botProfile?.channels.includes("WHATSAPP") ? "Website and WhatsApp conversations, human control, actions, intelligence, and verified outcomes" : "Review grounded website conversations, customer intent, feedback and human handover"} notificationCount={unreadCount} tone="light" />
      <div className="px-5 py-6 sm:px-7 lg:px-8">
        <WhatsAppBotClient integration={integration} leads={conversations} enabledChannels={organization?.botProfile?.channels || []} />
      </div>
    </div>
  );
}
