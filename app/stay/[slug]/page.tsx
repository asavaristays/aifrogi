import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { HotelGptResidentEntry } from "@/components/website-bot/hotelgpt-resident-entry";

export const dynamic = "force-dynamic";

export default async function HotelGptStayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    return db?.property.findUnique({ where: { slug }, select: { name: true, organization: { select: { name: true, botProfile: true } } } }) || null;
  });
  const profile = property?.organization?.botProfile;
  if (!property || !profile || profile.category !== "STAY" || !canServeWebsiteBot(profile.status, profile.channels)) notFound();
  const settings = await withPublicBotDatabaseContext(slug, () => readKnowledgeSettings(slug));
  if (!settings) notFound();
  const propertyName = property.organization?.name || property.name;
  return <HotelGptResidentEntry slug={slug} propertyName={propertyName} botName={profile.personaName || `${propertyName} HotelGPT`} themeColor={settings.themeColor} widgetTheme={settings.widgetTheme || "dark"} logoUrl={settings.logoUrl} menu={settings.widgetMenu || { enabled: false, heading: "", items: [] }} />;
}
