import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";

export const dynamic = "force-dynamic";

export default async function WebsiteBotEmbedPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ mode?: string; qa?: string }> }) {
  const { slug } = await params;
  const { mode, qa } = await searchParams;
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug }, select: { organization: { select: { name: true, botProfile: { select: { status: true, channels: true, personaName: true } } } } } }) : null;
  const profile = property?.organization?.botProfile;
  if (!profile || !canServeWebsiteBot(profile.status, profile.channels)) {
    if (process.env.NODE_ENV === "development" && qa === "responsive") {
      return <WebsiteBotEmbed slug={slug} botName="Responsive QA Bot" welcomeMessage="Welcome. Ask a question to test the responsive widget." themeColor="#8a6a16" dismissible={mode === "launcher"} />;
    }
    return null;
  }
  const settings = await readKnowledgeSettings(slug);
  return <WebsiteBotEmbed slug={slug} botName={profile.personaName || `${property?.organization?.name || "Business"} AI`} welcomeMessage={settings.welcomeMessage} themeColor={settings.themeColor} widgetTheme={settings.widgetTheme} logoUrl={settings.logoUrl} welcomeCardImageUrl={settings.welcomeCardImageUrl} welcomeCardTitle={settings.welcomeCardTitle} welcomeCardText={settings.welcomeCardText} dismissible={mode === "launcher"} menu={settings.widgetMenu} />;
}
