import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { captureIncomingAiBotMessage } from "@/lib/services/lead-service";
import type { WhatsAppBotConfiguration } from "@/lib/whatsapp-bot-config";
import { hashWebsiteVisitorValue, issueWebsiteVisitorToken, verifyWebsiteVisitorToken } from "@/lib/website-visitor-session";
import { guardWebsiteVisitorMessage } from "@/lib/website-message-safety";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";

const buckets = new Map<string, { count: number; resetAt: number }>();
const configuration: WhatsAppBotConfiguration = {
  enabled: true, language: "EN", welcomeEnabled: true,
  welcomeMessage: "Welcome to Webtechnosys. Tell me what you want to improve, build or automate.",
  serviceBuckets: ["WEBSITE_CMS", "WHATSAPP_AUTOMATION", "AI_AUTOMATION", "CONSULTATION_INTEGRATIONS"],
  auditEnabled: false, trialEnabled: false, humanHandoffEnabled: true, collectLeadDetails: true
};

const responseHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function rateLimited(request: Request, limit = 12) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${request.method}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + 60_000 }); return false; }
  current.count += 1;
  return current.count > limit;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (rateLimited(request)) return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429, headers: responseHeaders });
  const { slug } = await context.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Business intelligence is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const property = await db.property.findUnique({ where: { slug }, select: { id: true, slug: true, organization: { select: { botProfile: true } } } });
  const profile = property?.organization?.botProfile;
  if (!property || !profile || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });

  const payload = await request.json().catch(() => null) as { message?: string; sessionId?: string; name?: string; contact?: string; consent?: boolean; requestHuman?: boolean; visitorToken?: string } | null;
  const message = String(payload?.message || "").trim().slice(0, 1200);
  const sessionId = String(payload?.sessionId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (message.length < 2 || !sessionId) return NextResponse.json({ error: "Message and session are required." }, { status: 400, headers: responseHeaders });

  const priorToken = payload?.visitorToken ? verifyWebsiteVisitorToken(payload.visitorToken, slug) : null;
  if (payload?.visitorToken && (!priorToken || priorToken.sessionId !== sessionId)) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  if (payload?.visitorToken) {
    const activeSession = await db.websiteVisitorSession.findFirst({ where: { propertyId: property.id, leadId: priorToken!.leadId, capabilityHash: hashWebsiteVisitorValue(payload.visitorToken), revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } });
    if (!activeSession) return NextResponse.json({ error: "Visitor session is invalid, closed, or expired." }, { status: 401, headers: responseHeaders });
  }

  const priorQuestions = priorToken ? (await db.leadMessage.findMany({
    where: { leadId: priorToken.leadId, sender: "GUEST" }, orderBy: [{ sentAt: "desc" }, { id: "desc" }], take: 6, select: { body: true }
  })).map((item) => item.body) : [];
  const safety = guardWebsiteVisitorMessage(message);
  const result = safety.blocked ? null : await buildWebsiteKnowledgeAnswer({ question: message, propertySlug: slug, configuration, priorQuestions }).catch(() => null);
  const answer = safety.answer || result?.answer || "I do not have enough approved Webtechnosys information to answer that confidently. I can arrange a conversation with the team if you share your preferred contact details.";
  const captured = await captureIncomingAiBotMessage({
    conversationId: `website:${sessionId}`,
    phone: payload?.consent && payload.contact ? String(payload.contact).slice(0, 120) : undefined,
    profileName: payload?.consent && payload.name ? String(payload.name).slice(0, 100) : "Website visitor",
    message: safety.storageText, aiReply: answer, propertySlug: slug
  }).catch(() => null);

  if (!captured?.lead || captured.lead.propertySlug !== slug) return NextResponse.json({ error: "Conversation could not be recorded." }, { status: 503, headers: responseHeaders });
  const humanRequested = Boolean(payload?.requestHuman || priorToken?.humanRequested);
  const visitorToken = issueWebsiteVisitorToken({ slug, sessionId, leadId: captured.lead.id, humanRequested });
  const consented = Boolean(payload?.consent && payload.contact);
  await db.websiteVisitorSession.upsert({
    where: { leadId: captured.lead.id },
    create: {
      propertyId: property.id, leadId: captured.lead.id, sessionIdHash: hashWebsiteVisitorValue(sessionId), capabilityHash: hashWebsiteVisitorValue(visitorToken),
      status: humanRequested ? "HUMAN_REQUESTED" : "AI_READY", expiresAt: new Date((verifyWebsiteVisitorToken(visitorToken, slug)?.exp || 0) * 1000),
      ...(consented ? { contactName: String(payload?.name || "").trim().slice(0, 100) || null, contactValue: String(payload?.contact || "").trim().slice(0, 120), consentText: "Webtechnosys may store these details and contact me about this enquiry.", consentedAt: new Date() } : {})
    },
    update: {
      capabilityHash: hashWebsiteVisitorValue(visitorToken), status: humanRequested ? "HUMAN_REQUESTED" : undefined,
      expiresAt: new Date((verifyWebsiteVisitorToken(visitorToken, slug)?.exp || 0) * 1000), revokedAt: null,
      ...(consented ? { contactName: String(payload?.name || "").trim().slice(0, 100) || null, contactValue: String(payload?.contact || "").trim().slice(0, 120), consentText: "Webtechnosys may store these details and contact me about this enquiry.", consentedAt: new Date() } : {})
    }
  });

  return NextResponse.json({ answer, grounded: Boolean(result), sources: result?.sources.slice(0, 3) || [], knowledgeAsOf: result?.knowledgeAsOf || null, responseSlaMinutes: profile.responseSlaMinutes, handoffAvailable: true, visitorToken, conversationState: humanRequested ? "HUMAN_REQUESTED" : "AI_READY" }, { headers: responseHeaders });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (rateLimited(request, 60)) return NextResponse.json({ error: "Please wait a moment before checking replies." }, { status: 429, headers: responseHeaders });
  const { slug } = await context.params;
  const token = verifyWebsiteVisitorToken(bearerToken(request), slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Conversation is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const session = await db.websiteVisitorSession.findFirst({ where: { property: { slug }, leadId: token.leadId, sessionIdHash: hashWebsiteVisitorValue(token.sessionId), capabilityHash: hashWebsiteVisitorValue(bearerToken(request)), expiresAt: { gt: new Date() } }, select: { id: true, status: true, revokedAt: true } });
  if (!session || session.revokedAt) return NextResponse.json({ messages: [], conversationState: "CLOSED" }, { status: 410, headers: responseHeaders });
  const afterValue = new URL(request.url).searchParams.get("after") || "";
  const afterDate = afterValue ? new Date(afterValue) : null;
  if (afterDate && Number.isNaN(afterDate.getTime())) return NextResponse.json({ error: "Invalid reply cursor." }, { status: 400, headers: responseHeaders });
  const lead = await db.lead.findFirst({
    where: { id: token.leadId, property: { slug } },
    select: {
      stage: true,
      tags: { select: { value: true } },
      messages: {
        where: { sender: "AGENT", ...(afterDate ? { sentAt: { gt: afterDate } } : {}) },
        orderBy: [{ sentAt: "asc" }, { id: "asc" }],
        take: 50,
        select: { id: true, body: true, sentAt: true }
      }
    }
  });
  if (!lead) return NextResponse.json({ error: "Conversation was not found." }, { status: 404, headers: responseHeaders });
  const closed = ["BOOKED", "WON", "LOST"].includes(lead.stage) || lead.tags.some((tag) => ["resolved", "closed"].includes(tag.value.toLowerCase()));
  if (closed) return NextResponse.json({ messages: [], conversationState: "CLOSED" }, { headers: responseHeaders });
  const messageIds = lead.messages.map((message) => message.id);
  if (messageIds.length) await Promise.all([
    db.leadMessage.updateMany({ where: { id: { in: messageIds }, leadId: token.leadId, deliveryStatus: null }, data: { deliveryStatus: "DELIVERED", statusUpdatedAt: new Date() } }),
    db.websiteVisitorSession.update({ where: { id: session.id }, data: { status: "HUMAN_JOINED", lastDeliveredAt: new Date() } })
  ]);
  const conversationState = lead.messages.length ? "HUMAN_JOINED" : token.humanRequested ? "HUMAN_REQUESTED" : "AI_READY";
  return NextResponse.json({ messages: lead.messages.map((message) => ({ id: message.id, body: message.body, sentAt: message.sentAt.toISOString() })), conversationState }, { headers: responseHeaders });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (rateLimited(request, 60)) return NextResponse.json({ error: "Please wait a moment." }, { status: 429, headers: responseHeaders });
  const { slug } = await context.params;
  const token = verifyWebsiteVisitorToken(bearerToken(request), slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  const payload = await request.json().catch(() => null) as { messageIds?: unknown } | null;
  const messageIds = Array.isArray(payload?.messageIds) ? payload.messageIds.filter((id): id is string => typeof id === "string").slice(0, 50) : [];
  if (!messageIds.length) return NextResponse.json({ error: "Message IDs are required." }, { status: 400, headers: responseHeaders });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Conversation is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const session = await db.websiteVisitorSession.findFirst({ where: { property: { slug }, leadId: token.leadId, capabilityHash: hashWebsiteVisitorValue(bearerToken(request)), revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } });
  if (!session) return NextResponse.json({ error: "Conversation is closed or unavailable." }, { status: 410, headers: responseHeaders });
  const result = await db.$transaction(async (transaction) => {
    const updated = await transaction.leadMessage.updateMany({ where: { id: { in: messageIds }, leadId: token.leadId, sender: "AGENT" }, data: { deliveryStatus: "READ", statusUpdatedAt: new Date() } });
    await transaction.websiteVisitorSession.update({ where: { id: session.id }, data: { lastReadAt: new Date() } });
    return updated;
  });
  return NextResponse.json({ read: result.count }, { headers: responseHeaders });
}
