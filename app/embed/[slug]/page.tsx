import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";

export const dynamic = "force-dynamic";

export default async function WebsiteBotEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug }, select: { organization: { select: { name: true, botProfile: { select: { status: true, channels: true, personaName: true } } } } } }) : null;
  const profile = property?.organization?.botProfile;
  if (!profile || !canServeWebsiteBot(profile.status, profile.channels)) return null;
  const settings = await readKnowledgeSettings(slug);
  return <WebsiteBotEmbed slug={slug} botName={profile.personaName || `${property?.organization?.name || "Business"} AI`} welcomeMessage={settings.welcomeMessage} themeColor={settings.themeColor} logoUrl={settings.logoUrl} />;
}
