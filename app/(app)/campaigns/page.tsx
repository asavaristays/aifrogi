import { BroadcastBuilder } from "@/components/campaigns/broadcast-builder";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadLeads } from "@/lib/services/lead-service";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { listWhatsAppTestContacts } from "@/lib/repositories/whatsapp-test-contact-repository";
import { getCampaignSummary, listCampaignRuns } from "@/lib/repositories/campaign-repository";
import { CAMPAIGN_TEMPLATES, CONSENT_SOURCES } from "@/lib/campaign-compliance";
import { filterWhatsAppLeads } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CampaignsPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const [allLeads, integration, testContacts, property] = await Promise.all([
    loadLeads(propertySlug),
    loadWhatsAppIntegration(propertySlug),
    listWhatsAppTestContacts(),
    getPropertyBySlug(propertySlug)
  ]);
  const [campaignRuns, campaignSummary] = property
    ? await Promise.all([listCampaignRuns(property.id, 8), getCampaignSummary(property.id)])
    : [[], { total: 0, sent: 0, failed: 0, delivered: 0, read: 0, estimatedCostPaisa: 0 }];
  const contacts = filterWhatsAppLeads(allLeads);
  const connected = integration.status === "CONNECTED";
  const broadcastContacts = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    stage: contact.stage
  }));

  return (
    <div className="min-h-screen bg-[#f4f8f6]">
      <TopBar title="Campaigns" subtitle="Broadcast approved WhatsApp templates and track replies" />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Audience" value={String(contacts.length)} helper="WhatsApp contacts" />
          <Metric label="Campaign runs" value={String(campaignSummary.total)} helper={`${campaignSummary.sent} accepted`} />
          <Metric label="Read rate" value={campaignSummary.sent ? `${Math.round((campaignSummary.read / campaignSummary.sent) * 100)}%` : "0%"} helper={`${campaignSummary.read} reads tracked`} />
          <Metric label="Status" value={connected ? "Ready" : "Blocked"} helper={connected ? "Connection active" : "Review WhatsApp setup"} />
        </section>

        <Card className="border border-black/6 bg-white p-6 shadow-[0_16px_44px_rgba(15,61,53,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="secondary">SaaS model</Badge>
              <h2 className="mt-3 text-2xl font-black">Client sends campaigns without handling credentials</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                Your team completes the WhatsApp Business setup through the verified Meta access flow. The client sees simple actions: choose audience, select approved template, confirm consent, send, and handle replies from the inbox.
              </p>
            </div>
            <Badge tone={connected ? "secondary" : "error"}>{connected ? "API connected" : "Needs setup"}</Badge>
          </div>
        </Card>

        <BroadcastBuilder
          connected={connected}
          contacts={broadcastContacts}
          testContacts={testContacts}
          propertySlug={propertySlug}
          templates={CAMPAIGN_TEMPLATES}
          consentSources={CONSENT_SOURCES}
          campaignRuns={campaignRuns.map((campaign) => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            templateName: campaign.templateName,
            requestedCount: campaign.requestedCount,
            sentCount: campaign.sentCount,
            deliveredCount: campaign.deliveredCount,
            readCount: campaign.readCount,
            failedCount: campaign.failedCount,
            estimatedCostPaisa: campaign.estimatedCostPaisa,
            consentSource: campaign.consentSource,
            testMode: campaign.testMode,
            createdAt: campaign.createdAt.toISOString(),
            scheduledFor: campaign.scheduledFor?.toISOString() || null
          }))}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5 shadow-[0_16px_40px_rgba(15,61,53,0.06)]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{helper}</p>
    </Card>
  );
}
