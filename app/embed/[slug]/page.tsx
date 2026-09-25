import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { resolveTenantWelcomeMessage } from "@/lib/tenant-facing-copy";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";
import hotel from "@/components/website-bot/hotel-guest-shell.module.css";

export const dynamic = "force-dynamic";

export default async function WebsiteBotEmbedPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ mode?: string; qa?: string }> }) {
  const { slug } = await params;
  const { mode, qa } = await searchParams;
  if (process.env.NODE_ENV === "development" && (qa === "hotel-prestay" || qa === "hotel-instay")) {
    const inStay = qa === "hotel-instay";
    const previewMenu = { enabled: true, heading: inStay ? "How can we help during your stay?" : "What would you like to plan?", items: inStay ? [
      { id: "service", label: "Request service", action: "FLOW" as const, icon: "chat" as const, value: "I have an in-stay request: ", featured: true },
      { id: "issue", label: "Report an issue", action: "FLOW" as const, icon: "phone" as const, value: "I want to report an in-stay issue: " },
      { id: "dining", label: "Dining & timings", action: "INFO" as const, icon: "grid" as const, value: "Ask the front desk for today's dining timings." },
      { id: "experience", label: "Experiences", action: "INFO" as const, icon: "sparkles" as const, value: "Explore activities available during your stay." }
    ] : [
      { id: "rooms", label: "Explore rooms", action: "FLOW" as const, icon: "grid" as const, value: "Please help me choose a room.", featured: true },
      { id: "book", label: "Plan my stay", action: "FLOW" as const, icon: "chat" as const, value: "I would like to plan a stay." },
      { id: "experience", label: "Experiences", action: "FLOW" as const, icon: "sparkles" as const, value: "What experiences are available?" },
      { id: "hotel", label: "Hotel information", action: "FLOW" as const, icon: "link" as const, value: "Tell me about the hotel." }
    ] };
    return <main className={hotel.embedStage}><WebsiteBotEmbed slug="hotel-ui-preview" botName={inStay ? "Hotel Front Desk" : "HotelGPT"} welcomeMessage={inStay ? "Welcome back · Room 204. How can we help?" : "Welcome. I can help you plan your stay."} themeColor="#58785f" widgetTheme="light" menu={previewMenu} journeyMode={inStay ? undefined : "pre-stay"} residentMode={inStay} stayAccessToken={inStay ? "preview-token" : ""} /></main>;
  }
  const loaded = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    const property = db ? await db.property.findUnique({ where: { slug }, select: { organization: { select: { name: true, botProfile: { select: { status: true, channels: true, personaName: true, category: true } } } } } }) : null;
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
  const businessName = loaded.property?.organization?.name || "Business";
  const welcomeMessage = resolveTenantWelcomeMessage({ configuredMessage: loaded.settings.welcomeMessage, businessName, hotelMode: loaded.profile.category === "STAY" });
  const embed = <WebsiteBotEmbed slug={slug} botName={loaded.profile.personaName || `${businessName} AI`} welcomeMessage={welcomeMessage} themeColor={loaded.settings.themeColor} widgetTheme={loaded.settings.widgetTheme} logoUrl={loaded.settings.logoUrl} welcomeCardImageUrl={loaded.settings.welcomeCardImageUrl} welcomeCardTitle={loaded.settings.welcomeCardTitle} welcomeCardText={loaded.settings.welcomeCardText} showcaseItems={loaded.settings.showcaseItems} dismissible={mode === "launcher"} menu={loaded.settings.widgetMenu} journeyMode={loaded.profile.category === "STAY" ? "pre-stay" : undefined} />;
  return loaded.profile.category === "STAY" ? <main className={hotel.embedStage}>{embed}</main> : embed;
}
