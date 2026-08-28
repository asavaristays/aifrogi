import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { captureIncomingAiBotMessage } from "@/lib/services/lead-service";
import type { WhatsAppBotConfiguration } from "@/lib/whatsapp-bot-config";

const buckets = new Map<string, { count: number; resetAt: number }>();
const configuration: WhatsAppBotConfiguration = {
  enabled: true, language: "EN", welcomeEnabled: true,
  welcomeMessage: "Welcome to Webtechnosys. Tell me what you want to improve, build or automate.",
  serviceBuckets: ["WEBSITE_CMS", "WHATSAPP_AUTOMATION", "AI_AUTOMATION", "CONSULTATION_INTEGRATIONS"],
  auditEnabled: false, trialEnabled: false, humanHandoffEnabled: true, collectLeadDetails: true
};

const responseHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function rateLimited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) { buckets.set(ip, { count: 1, resetAt: now + 60_000 }); return false; }
  current.count += 1;
  return current.count > 12;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (rateLimited(request)) return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429, headers: responseHeaders });
  const { slug } = await context.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Business intelligence is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const property = await db.property.findUnique({ where: { slug }, select: { slug: true, organization: { select: { botProfile: true } } } });
  const profile = property?.organization?.botProfile;
  if (!property || !profile || profile.status !== "CONFIGURED" || !profile.channels.includes("WEBSITE")) return NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });

  const payload = await request.json().catch(() => null) as { message?: string; sessionId?: string; name?: string; contact?: string; consent?: boolean } | null;
  const message = String(payload?.message || "").trim().slice(0, 1200);
  const sessionId = String(payload?.sessionId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (message.length < 2 || !sessionId) return NextResponse.json({ error: "Message and session are required." }, { status: 400, headers: responseHeaders });

  const result = await buildWebsiteKnowledgeAnswer({ question: message, propertySlug: slug, configuration }).catch(() => null);
  const answer = result?.answer || "I do not have enough approved Webtechnosys information to answer that confidently. I can arrange a conversation with the team if you share your preferred contact details.";
  await captureIncomingAiBotMessage({
    conversationId: `website:${sessionId}`,
    phone: payload?.consent && payload.contact ? String(payload.contact).slice(0, 120) : undefined,
    profileName: payload?.consent && payload.name ? String(payload.name).slice(0, 100) : "Website visitor",
    message, aiReply: answer, propertySlug: slug
  }).catch(() => null);

  return NextResponse.json({ answer, grounded: Boolean(result), handoffAvailable: true }, { headers: responseHeaders });
}
