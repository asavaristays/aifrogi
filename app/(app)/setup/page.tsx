import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { BotAppearanceSettings } from "@/components/setup/bot-appearance-settings";
import { BotBehaviourSettings } from "@/components/setup/bot-behaviour-settings";
import { BotMenuSettings } from "@/components/setup/bot-menu-settings";
import { WebsiteBotInstallation } from "@/components/website-bot/website-bot-installation";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getDb } from "@/lib/db";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SetupPage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const appearance = await readKnowledgeSettings(propertySlug);
  const botName = access?.organization.botProfile?.personaName?.trim() || `${access?.organization.name || "Business"} Assistant`;
  const db = getDb();
  const property = access?.organization.properties.find((item) => item.slug === propertySlug);
  const [testActivity, answerEvidence] = db && access && property ? await Promise.all([
    db.onboardingActivity.findFirst({ where: { organizationId: access.organization.id, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } }),
    db.sovereignAnswerEvidence.findFirst({ where: { propertyId: property.id }, select: { id: true } })
  ]) : [null, null];
  const testComplete = Boolean(testActivity || answerEvidence);
  const installationComplete = Boolean(access?.organization.botProfile?.installationDetectedAt || access?.organization.botProfile?.status === "LIVE");
  const behaviourComplete = Boolean(access?.organization.botProfile?.businessObjective && access.organization.botProfile.tone && access.organization.botProfile.languages.length);
  const steps = [
    { number: "1", title: "Choose the appearance", copy: "Set the bot name, logo, brand colour and welcome message.", href: "#bot-appearance", action: "Edit appearance", ready: Boolean(botName && appearance.welcomeMessage) },
    { number: "2", title: "Set bot behaviour", copy: "Define its purpose, tone, languages and safety boundaries.", href: "#bot-behaviour", action: "Edit behaviour", ready: behaviourComplete },
    { number: "3", title: "Add business knowledge", copy: "Connect your website and approve the answers your bot may use.", href: "/knowledge", action: "Open Intelligence", ready: appearance.pageCount > 0 },
    { number: "4", title: "Test customer questions", copy: testComplete ? "A website-bot answer has been tested and recorded." : "Ask real questions and confirm the replies before going live.", href: "/knowledge#test-your-bot", action: testComplete ? "Test another question" : "Test my bot", ready: testComplete },
    { number: "5", title: "Install on your website", copy: installationComplete ? "A valid widget load has been detected on the website." : "Choose an embed option when the appearance and answers are ready.", href: "#website-installation", action: installationComplete ? "View embed options" : "Choose embed option", ready: installationComplete }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopBar title="AI Bot setup" subtitle="Configure, teach, test and install your website bot" />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {access ? <BotAppearanceSettings initialSettings={appearance} initialBotName={botName} canManage={canManageWorkspace(access.role)} /> : null}
        {access?.organization.botProfile ? <BotBehaviourSettings initialProfile={access.organization.botProfile} canManage={canManageWorkspace(access.role)} /> : null}
        {access ? <BotMenuSettings initialMenu={appearance.widgetMenu} canManage={canManageWorkspace(access.role)} /> : null}
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
      </div>
    </div>
  );
}
