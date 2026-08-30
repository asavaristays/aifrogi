import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebsiteBotDeliveryActions } from "@/components/website-bot/website-bot-delivery-actions";
import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";

export const dynamic = "force-dynamic";

async function loadBot(slug: string) {
  const db = getDb();
  return db ? db.property.findUnique({ where: { slug }, select: { name: true, organization: { select: { name: true, botProfile: { select: { status: true, channels: true } } } } } }) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bot = await loadBot(slug);
  const name = bot?.organization?.name || bot?.name || "AI Business Bot";
  return {
    title: `${name} AI Assistant · AiFrogi`,
    description: `Ask ${name}'s approved AI Business Bot.`,
    manifest: `/bot/${encodeURIComponent(slug)}/manifest.webmanifest`,
    icons: { icon: "/brand/aifrogi-favicon-512.png", apple: "/brand/aifrogi-favicon-512.png" }
  };
}

export default async function StandaloneWebsiteBotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bot = await loadBot(slug);
  const profile = bot?.organization?.botProfile;
  if (!bot || !profile || !canServeWebsiteBot(profile.status, profile.channels)) notFound();
  const name = bot.organization?.name || bot.name;

  return <main className="min-h-dvh bg-[#050505] px-3 py-4 sm:px-6 sm:py-8">
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[460px] flex-col gap-3 sm:min-h-[calc(100dvh-4rem)]">
      <WebsiteBotDeliveryActions botName={`${name} AI Assistant`} />
      <div className="min-h-0 flex-1"><WebsiteBotEmbed slug={slug} /></div>
    </div>
  </main>;
}
