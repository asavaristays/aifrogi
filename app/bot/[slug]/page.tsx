import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebsiteBotDeliveryActions } from "@/components/website-bot/website-bot-delivery-actions";
import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { WEBTECHNOSYS_BOT_SLUG } from "@/lib/webtechnosys-navigation";
import shell from "@/components/website-bot/webtechnosys-shell.module.css";

export const dynamic = "force-dynamic";

async function loadBot(slug: string) {
  const db = getDb();
  return db ? db.property.findUnique({ where: { slug }, select: { name: true, organization: { select: { id: true, name: true, isDemo: true, botProfile: { select: { status: true, channels: true, personaName: true } } } } } }) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bot = await loadBot(slug);
  const name = bot?.organization?.name || bot?.name || "AI Business Bot";
  return {
    title: slug === WEBTECHNOSYS_BOT_SLUG ? "Webtechnosys AI Bot · AiFrogi" : `${name} AI Assistant · AiFrogi`,
    description: `Ask ${name}'s approved AI Business Bot.`,
    manifest: `/bot/${encodeURIComponent(slug)}/manifest.webmanifest`,
    icons: { icon: "/brand/aifrogi-favicon-512.png", apple: "/brand/aifrogi-favicon-512.png" }
  };
}

export default async function StandaloneWebsiteBotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bot = await loadBot(slug);
  const organization = bot?.organization;
  const profile = organization?.botProfile;
  if (!bot || !organization || !profile || !canServeWebsiteBot(profile.status, profile.channels)) notFound();
  const subscription = await getOrganizationSubscriptionAccess(organization.id);
  if (subscription && !subscription.canUsePaidActions) notFound();
  const name = bot.organization?.name || bot.name;
  const settings = await readKnowledgeSettings(slug);

  const premium = slug === WEBTECHNOSYS_BOT_SLUG && organization.isDemo !== true;
  return <main className={premium ? shell.standalone : "min-h-dvh bg-[#050505] px-3 py-4 sm:px-6 sm:py-8"}>
    <div className={premium ? shell.frame : "mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[460px] flex-col gap-3 sm:min-h-[calc(100dvh-4rem)]"}>
      <WebsiteBotDeliveryActions botName={premium ? "Webtechnosys AI Bot" : `${name} AI Assistant`} />
      <div className="min-h-0 flex-1"><WebsiteBotEmbed slug={slug} demo={bot.organization?.isDemo === true} botName={profile.personaName || `${name} AI`} welcomeMessage={settings.welcomeMessage} themeColor={settings.themeColor} widgetTheme={settings.widgetTheme} logoUrl={settings.logoUrl} menu={settings.widgetMenu} /></div>
    </div>
  </main>;
}
