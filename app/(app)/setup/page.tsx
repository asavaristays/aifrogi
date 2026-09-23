import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { BotAppearanceSettings } from "@/components/setup/bot-appearance-settings";
import { BotBehaviourSettings } from "@/components/setup/bot-behaviour-settings";
import { BotMenuSettings } from "@/components/setup/bot-menu-settings";
import { BotReviewSubmission } from "@/components/setup/bot-review-submission";
import { WebsiteBotInstallation } from "@/components/website-bot/website-bot-installation";
import { HotelGptStayDelivery } from "@/components/website-bot/hotelgpt-stay-delivery";
import { canManageWorkspace, getCurrentClientAccess, withClientDatabaseContext } from "@/lib/client-access";
import { getDb } from "@/lib/db";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { BotConnectorPlan } from "@/components/bot-profile/bot-connector-plan";
import { BotShowcaseSettings } from "@/components/setup/bot-showcase-settings";
import { BotCertificationPanel } from "@/components/setup/bot-certification-panel";
import { AgentGatewaySettings } from "@/components/setup/agent-gateway-settings";
import { getTenantKnowledgeRevision, readTenantCertification, tenantCertificationStatus } from "@/lib/tenant-intelligence/certification";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SetupPage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  if (!access) redirect("/login");
  const appearance = await readKnowledgeSettings(propertySlug);
  const certification = await readTenantCertification(propertySlug);
  const botName = access?.organization.botProfile?.personaName?.trim() || `${access?.organization.name || "Business"} Assistant`;
  const property = access.organization.properties.find((item) => item.slug === propertySlug);
  const [testActivity, answerEvidence, subscription, verification, knowledgeRevision] = property ? await withClientDatabaseContext(access, "client-setup", async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    return Promise.all([
      db.onboardingActivity.findFirst({ where: { organizationId: access.organization.id, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } }),
      db.sovereignAnswerEvidence.findFirst({ where: { propertyId: property.id }, select: { id: true } }),
      getOrganizationSubscriptionAccess(access.organization.id),
      getKnowledgeVerificationReadiness(property.id, access.organization.botProfile?.category === "STAY" ? "HOSPITALITY" : access.organization.botProfile?.category === "PINGBOOK" ? "APPOINTMENTS" : access.organization.botProfile?.category || "BUSINESS_AI"),
      getTenantKnowledgeRevision(propertySlug)
    ]);
  }) : [null, null, null, null, ""];
  const certificationStatus = tenantCertificationStatus(certification, knowledgeRevision);
  const testComplete = Boolean(testActivity || answerEvidence);
  const deliveryReady = Boolean(access?.organization.botProfile?.installationKey);
  const behaviourComplete = Boolean(access?.organization.botProfile?.businessObjective && access.organization.botProfile.tone && access.organization.botProfile.languages.length);
  const steps = [
    { number: "1", title: "Choose the appearance", copy: "Set the bot name, logo, brand colour and welcome message.", href: "#bot-appearance", action: "Edit appearance", ready: Boolean(botName && appearance.welcomeMessage) },
    { number: "2", title: "Set bot behaviour", copy: "Define its purpose, tone, languages and safety boundaries.", href: "#bot-behaviour", action: "Edit behaviour", ready: behaviourComplete },
    { number: "3", title: "Add business knowledge", copy: "Connect your website and approve the answers your bot may use.", href: "/knowledge", action: "Open Intelligence", ready: appearance.pageCount > 0 },
    { number: "4", title: "Test customer questions", copy: testComplete ? "A website-bot answer has been tested and recorded." : "Ask real questions and confirm the replies before going live.", href: "/knowledge#test-your-bot", action: testComplete ? "Test another question" : "Test my bot", ready: testComplete },
    { number: "5", title: "Choose delivery", copy: deliveryReady ? "Standalone link and optional website embed codes are ready." : "Generate the standalone link and optional website embed choices.", href: "#website-installation", action: "View delivery options", ready: deliveryReady }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopBar title="AI Bot setup" subtitle="Configure, teach, test and install your website bot" />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {subscription?.planCode === "TRIAL" ? <section className="rounded-2xl border border-[#d7c27d] bg-[#fff9e8] p-5"><p className="product-eyebrow">15-day trial boundary</p><h2 className="mt-1 text-lg font-semibold">Starter Bot without connectors</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Your trial includes approved business answers, lead capture, human handover, standalone web app and website widget. Connector-backed bookings, payments or external actions require an eligible paid setup after the trial.</p></section> : null}
        {access ? <BotAppearanceSettings initialSettings={appearance} initialBotName={botName} canManage={canManageWorkspace(access.role)} /> : null}
        {access ? <BotShowcaseSettings initialItems={appearance.showcaseItems} canManage={canManageWorkspace(access.role)} /> : null}
        {access?.organization.botProfile ? <BotBehaviourSettings initialProfile={access.organization.botProfile} canManage={canManageWorkspace(access.role)} /> : null}
        {access ? <BotMenuSettings initialMenu={appearance.widgetMenu} canManage={canManageWorkspace(access.role)} /> : null}
        {access?.organization.botConnectors?.length ? <BotConnectorPlan connectors={access.organization.botConnectors} management="customer" canManage={canManageWorkspace(access.role)} /> : null}
        {access?.organization.botProfile ? <AgentGatewaySettings slug={propertySlug} canManage={canManageWorkspace(access.role)} live={access.organization.botProfile.status === "LIVE"} /> : null}
        {access ? <BotCertificationPanel initialRecord={certification} initialStatus={certificationStatus} canManage={canManageWorkspace(access.role)} /> : null}
        {access ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <p className="product-eyebrow">Website bot checklist</p>
          <h2 className="mt-1 text-xl font-semibold">Five steps to prepare your bot</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Only the settings needed for your website bot are included here.</p>
          <ol className="mt-6 grid gap-3 lg:grid-cols-2">
            {steps.map((step) => <li key={step.number} className="flex min-h-36 flex-col rounded-xl border border-[var(--border)] bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${step.ready ? "bg-[#dff4eb] text-[#126452]" : "bg-[#f2ead5] text-[#6d5310]"}`}>{step.ready ? "✓" : step.number}</span><div><h3 className="font-semibold">{step.title}</h3><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{step.copy}</p></div></div>
              <Link href={step.href} className="mt-auto pt-4 text-sm font-semibold text-[var(--primary-strong)]">{step.action} →</Link>
            </li>)}
          </ol>
        </section> : <section className="rounded-lg border border-[var(--border)] bg-white p-6"><h2 className="text-xl font-semibold">Setup unavailable</h2><p className="mt-2 text-sm text-[var(--text-muted)]">AiFrogi could not locate an active website-bot workspace for this account.</p></section>}
        {access ? <WebsiteBotInstallation sectionId="website-installation" slug={propertySlug} profile={access.organization.botProfile} /> : null}
        {access?.organization.botProfile?.category === "STAY" ? <HotelGptStayDelivery slug={propertySlug} propertyName={property?.name || access.organization.name} status={access.organization.botProfile.status} enabled={access.organization.botProfile.stayAccessEnabled === true} /> : null}
        {access?.organization.botProfile ? <BotReviewSubmission status={access.organization.botProfile.status} ready={Boolean(subscription?.planCode === "TRIAL" ? verification?.trialReady : verification?.ready)} tested={testComplete} certified={certificationStatus.eligible} canManage={canManageWorkspace(access.role)} evidence={{ pageCount: appearance.pageCount, published: verification?.published || 0, coveragePercent: verification?.coverage.percentage || 0, freshnessRate: verification?.freshnessRate || 0, conflicts: verification?.conflicts || 0, unsigned: verification?.unsigned || 0, openFlags: verification?.openFlags || 0, previewPending: verification?.previewPending || 0, missingEssentials: verification?.essentials.missing || [] }} /> : null}
      </div>
    </div>
  );
}
