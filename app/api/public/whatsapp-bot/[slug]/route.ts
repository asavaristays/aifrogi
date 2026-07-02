import { NextResponse } from "next/server";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { getWhatsAppBotConfigurationForProperty } from "@/lib/repositories/bot-configuration-repository";
import { getWhatsAppIntegrationForProperty } from "@/lib/repositories/whatsapp-repository";
import { buildWhatsAppBotMenuOptions } from "@/lib/whatsapp-bot-config";

const PUBLIC_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
};

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const property = await getPropertyBySlug(slug);
  if (!property) {
    return NextResponse.json({ error: "Bot workspace not found" }, { status: 404, headers: PUBLIC_HEADERS });
  }

  const [configuration, integration] = await Promise.all([
    getWhatsAppBotConfigurationForProperty(slug),
    getWhatsAppIntegrationForProperty(slug)
  ]);

  return NextResponse.json({
    enabled: configuration.enabled && Boolean(integration?.displayPhoneNumber),
    language: "EN",
    brandName: property.name,
    welcomeMessage: configuration.welcomeMessage,
    whatsappNumber: String(integration?.displayPhoneNumber || "").replace(/\D/g, ""),
    options: buildWhatsAppBotMenuOptions(configuration)
  }, { headers: PUBLIC_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_HEADERS });
}
