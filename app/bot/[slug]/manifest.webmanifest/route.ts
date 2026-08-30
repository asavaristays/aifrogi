import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const bot = db ? await db.property.findUnique({ where: { slug }, select: { name: true, organization: { select: { name: true, botProfile: { select: { status: true, channels: true } } } } } }) : null;
  const profile = bot?.organization?.botProfile;
  if (!bot || !profile || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Bot unavailable" }, { status: 404 });
  const name = `${bot.organization?.name || bot.name} AI Assistant`;
  return NextResponse.json({
    id: `/bot/${slug}`,
    name,
    short_name: name.slice(0, 30),
    description: "A sovereign AI Business Bot powered by AiFrogi.",
    start_url: `/bot/${slug}`,
    scope: `/bot/${slug}`,
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [{ src: "/brand/aifrogi-favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }]
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
