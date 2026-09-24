import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { HotelGptResidentEntry } from "@/components/website-bot/hotelgpt-resident-entry";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;return {title:"HotelGPT · In-stay Assistant",manifest:`/stay/${encodeURIComponent(slug)}/manifest.webmanifest`,appleWebApp:{capable:true,title:"HotelGPT"},icons:{apple:"/brand/aifrogi-favicon-512.png"}};}

export default async function HotelGptStayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    return db?.property.findUnique({ where: { slug }, select: { name: true, organization: { select: { name: true, botProfile: true } } } }) || null;
  });
  const profile = property?.organization?.botProfile;
  if (!property || !profile || profile.category !== "STAY" || !profile.stayAccessEnabled || !canServeWebsiteBot(profile.status, profile.channels)) notFound();
  const settings = await withPublicBotDatabaseContext(slug, () => readKnowledgeSettings(slug));
  if (!settings) notFound();
  const propertyName = property.organization?.name || property.name;
  return <HotelGptResidentEntry slug={slug} propertyName={propertyName} botName={profile.personaName || `${propertyName} HotelGPT`} themeColor={settings.themeColor} widgetTheme={settings.widgetTheme || "dark"} logoUrl={settings.logoUrl} menu={settings.widgetMenu || { enabled: false, heading: "", items: [] }} welcomeCardImageUrl={settings.welcomeCardImageUrl} welcomeCardTitle={settings.welcomeCardTitle} welcomeCardText={settings.welcomeCardText} showcaseItems={settings.showcaseItems} />;
}
