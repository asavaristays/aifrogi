import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";

export const dynamic = "force-dynamic";

export default async function WebsiteBotEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug }, select: { organization: { select: { botProfile: { select: { status: true, channels: true } } } } } }) : null;
  const profile = property?.organization?.botProfile;
  if (!profile || !canServeWebsiteBot(profile.status, profile.channels)) return null;
  return <WebsiteBotEmbed slug={slug} />;
}
