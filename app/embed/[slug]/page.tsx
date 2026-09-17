import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";

export const dynamic = "force-dynamic";

export default async function WebsiteBotEmbedPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ mode?: string; qa?: string }> }) {
  const { slug } = await params;
  const { mode, qa } = await searchParams;
  const loaded = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    const property = db ? await db.property.findUnique({ where: { slug }, select: { organization: { select: { name: true, botProfile: { select: { status: true, channels: true, personaName: true } } } } } }) : null;
    const profile = property?.organization?.botProfile;
    if (!profile || !canServeWebsiteBot(profile.status, profile.channels)) return null;
    const settings = await readKnowledgeSettings(slug);
    return { property, profile, settings };
  });
  if (!loaded) {
    if (process.env.NODE_ENV === "development" && qa === "responsive") {
      return <WebsiteBotEmbed slug={slug} botName="Responsive QA Bot" welcomeMessage="Welcome. Ask a question to test the responsive widget." themeColor="#8a6a16" dismissible={mode === "launcher"} />;
    }
    notFound();
  }
  return <WebsiteBotEmbed slug={slug} botName={loaded.profile.personaName || `${loaded.property?.organization?.name || "Business"} AI`} welcomeMessage={loaded.settings.welcomeMessage} themeColor={loaded.settings.themeColor} widgetTheme={loaded.settings.widgetTheme} logoUrl={loaded.settings.logoUrl} welcomeCardImageUrl={loaded.settings.welcomeCardImageUrl} welcomeCardTitle={loaded.settings.welcomeCardTitle} welcomeCardText={loaded.settings.welcomeCardText} showcaseItems={loaded.settings.showcaseItems} dismissible={mode === "launcher"} menu={loaded.settings.widgetMenu} />;
}
