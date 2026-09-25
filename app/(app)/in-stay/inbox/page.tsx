import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WhatsAppBotClient } from "@/components/whatsapp/whatsapp-bot-client";
import styles from "@/components/lead-inbox/team-inbox.module.css";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { loadLeads } from "@/lib/services/lead-service";
import type { WhatsAppIntegration } from "@/types";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "In-Stay Service Inbox · AiFrogi", robots: { index: false, follow: false } };

const websiteOnlyIntegration: WhatsAppIntegration = { id:"", provider:"META_CLOUD_API", businessAccountId:null, phoneNumberId:null, displayPhoneNumber:null, webhookVerifyToken:null, status:"NOT_CONFIGURED", approvedBy:null, approvedAtLabel:null, lastValidatedAtLabel:null, notes:null, aiModeEnabled:false };

export default async function InStayInboxPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const query = await searchParams;
  const access = await resolveClientWorkspaceAccess({ propertySlug: await getCurrentWorkspaceSlug() });
  if (!access.ok) redirect("/login?returnTo=%2Fin-stay%2Finbox");
  if (access.organization.botProfile?.category !== "STAY") redirect("/team-inbox");
  const [leads,settings] = await Promise.all([withTenantDatabaseContext(
    { kind:"tenant", organizationId:access.organization.id, actor:`in-stay-inbox:${access.user.username}` },
    () => loadLeads(access.propertySlug)
  ),readKnowledgeSettings(access.propertySlug)]);
  return <div className={styles.page}>
    <div className={styles.journeyHeader}>
      <div><p className={styles.eyebrow}>Guest journey · during stay</p><h1>In-Stay Service Inbox</h1><p>Live requests and complaints for hotel departments, from acknowledgement through guest feedback.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/in-stay" className={styles.journeyLink}>Operations dashboard</Link><Link href="/team-inbox" className="inline-flex min-h-[42px] items-center rounded-xl border border-black/15 bg-white px-4 text-xs font-bold">Pre-Stay Inbox</Link></div>
    </div>
    <WhatsAppBotClient leads={leads.filter(lead=>Boolean(lead.websiteSession))} integration={websiteOnlyIntegration} enabledChannels={[]} teamMode hotelMode initialJourney="in-stay" lockJourney initialLeadId={query.lead||""} hotelQuickReplies={settings.hotelQuickReplies||[]} operatorRole={access.role}/>
  </div>;
}
