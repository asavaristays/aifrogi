import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { captureIncomingAiBotMessage } from "@/lib/services/lead-service";
import type { WhatsAppBotConfiguration } from "@/lib/whatsapp-bot-config";
import { hashWebsiteVisitorValue, issueWebsiteVisitorToken, verifyWebsiteVisitorToken } from "@/lib/website-visitor-session";
import { guardWebsiteVisitorMessage } from "@/lib/website-message-safety";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { recordSovereignAnswerEvidence } from "@/lib/repositories/sovereign-evidence-repository";
import { resolveSovereignQuestion } from "@/lib/sovereign-intelligence/decision";
import { CATEGORY_BLUEPRINT_VERSION } from "@/lib/sovereign-intelligence/registry";
import { CUSTOMER_SEMANTIC_REPEAT_THRESHOLD, governResolutionOutcome, semanticSimilarity } from "@/lib/sovereign-intelligence/resolution";
import { escalationTierFor, RELIABILITY_FRAMEWORK_VERSION } from "@/lib/reliability/runtime";
import { resolveDemoConnectorTurn } from "@/lib/demo-sandbox/service";
import { evaluateCategoryHardBoundary } from "@/lib/sovereign-intelligence/category-policy";
import type { Prisma } from "@/generated/prisma/client";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { ensureWebsiteHandover, websiteConversationState } from "@/lib/website-handover";
import { withWebsiteTurnLock } from "@/lib/website-turn-lock";
import { persistWebsiteTurn } from "@/lib/website-persistence";

const buckets = new Map<string, { count: number; resetAt: number }>();
const configuration: WhatsAppBotConfiguration = {
  enabled: true, language: "EN", welcomeEnabled: true,
  welcomeMessage: "Welcome. How can I help with your business enquiry today?",
  serviceBuckets: ["WEBSITE_CMS", "WHATSAPP_AUTOMATION", "AI_AUTOMATION", "CONSULTATION_INTEGRATIONS"],
  auditEnabled: false, trialEnabled: false, humanHandoffEnabled: true, collectLeadDetails: true
};

const responseHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function rateLimited(request: Request, tenantKey: string, limit = 12) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${tenantKey}:${request.method}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + 60_000 }); return false; }
  current.count += 1;
  return current.count > limit;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const payload = await request.clone().json().catch(() => null);
  const sessionId = String(payload?.sessionId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!sessionId) return NextResponse.json({ error: "Message and session are required." }, { status: 400 });
  try { return await withWebsiteTurnLock(`${slug}:${hashWebsiteVisitorValue(sessionId)}`, () => handleVisitorTurn(request, context)); }
  catch { return NextResponse.json({ error: "Conversation update could not complete. Please retry shortly." }, { status: 503, headers: responseHeaders }); }
}

async function handleVisitorTurn(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (rateLimited(request, slug)) return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429, headers: responseHeaders });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Business intelligence is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const property = await db.property.findUnique({ where: { slug }, select: { id: true, slug: true, organization: { select: { id: true, name: true, isDemo: true, botProfile: true } } } });
  const organization = property?.organization;
  const profile = organization?.botProfile;
  if (!property || !organization || !profile || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });
  const tenantConfiguration = { ...configuration, welcomeMessage: `Welcome to ${organization.name}. How can I help with your business enquiry today?` };
  const subscription = await getOrganizationSubscriptionAccess(organization.id);
  if (subscription && !subscription.canUsePaidActions) return NextResponse.json({ error: "This AI Bot is temporarily suspended. The business account owner can restore it through billing." }, { status: 402, headers: responseHeaders });

  const payload = await request.json().catch(() => null) as { message?: string; sessionId?: string; name?: string; contact?: string; consent?: boolean; requestHuman?: boolean; visitorToken?: string } | null;
  const message = String(payload?.message || "").trim().slice(0, 1200);
  const sessionId = String(payload?.sessionId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (message.length < 2 || !sessionId) return NextResponse.json({ error: "Message and session are required." }, { status: 400, headers: responseHeaders });

  const priorToken = payload?.visitorToken ? verifyWebsiteVisitorToken(payload.visitorToken, slug) : null;
  let existingResolutionState: unknown = null;
  let lastAssistantAnswer = "";
  let sessionStatus = "AI_READY";
  if (payload?.visitorToken && (!priorToken || priorToken.sessionId !== sessionId)) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  if (payload?.visitorToken) {
    const activeSession = await db.websiteVisitorSession.findFirst({ where: { propertyId: property.id, leadId: priorToken!.leadId, capabilityHash: hashWebsiteVisitorValue(payload.visitorToken), revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, resolutionState: true, status: true } });
    if (!activeSession) return NextResponse.json({ error: "Visitor session is invalid, closed, or expired." }, { status: 401, headers: responseHeaders });
    existingResolutionState = activeSession.resolutionState;
    sessionStatus = activeSession.status;
    if (sessionStatus === "CLOSED") return NextResponse.json({ error: "This conversation is closed.", conversationState: "CLOSED" }, { status: 410, headers: responseHeaders });
    const latestEvidence = await db.sovereignAnswerEvidence.findFirst({ where: { propertyId: property.id, sessionIdHash: hashWebsiteVisitorValue(sessionId) }, orderBy: { createdAt: "desc" }, select: { circuitBreaker: true, circuitBreakerReason: true, question: true, resolvedQuestion: true, answer: true } });
    lastAssistantAnswer = latestEvidence?.answer || "";
    const explicitlyResumed = existingResolutionState && typeof existingResolutionState === "object" && !Array.isArray(existingResolutionState) && "aiResumedAt" in existingResolutionState && typeof existingResolutionState.aiResumedAt === "string";
    if (!explicitlyResumed && latestEvidence?.circuitBreaker && semanticSimilarity(latestEvidence.question, message) >= CUSTOMER_SEMANTIC_REPEAT_THRESHOLD) {
      existingResolutionState = { ...((existingResolutionState && typeof existingResolutionState === "object" && !Array.isArray(existingResolutionState)) ? existingResolutionState : {}), version: "1.1", status: "ESCALATED", circuitBreakerTriggered: true, circuitBreakerReason: latestEvidence.circuitBreakerReason || "CUSTOMER_REPEAT", resolvedQuestion: latestEvidence.resolvedQuestion, lastCustomerText: latestEvidence.question };
    }
  }

  const priorQuestions = priorToken ? (await db.leadMessage.findMany({
    where: { leadId: priorToken.leadId, sender: "GUEST" }, orderBy: [{ sentAt: "desc" }, { id: "desc" }], take: 6, select: { body: true }
  })).map((item) => item.body) : [];
  const safety = guardWebsiteVisitorMessage(message);
  const fallbackDecision = resolveSovereignQuestion(message, priorQuestions, CATEGORY_BLUEPRINT_VERSION, lastAssistantAnswer);
  const explicitHumanRequest = Boolean(payload?.requestHuman || fallbackDecision.intent === "HUMAN_REQUEST");
  const handoffEnabled = profile.humanHandoffEnabled === true;
  // A human-owned conversation must not call the model or generate competing advice.
  if (sessionStatus === "HUMAN_JOINED" && priorToken) {
    return persistWebsiteTurn(async () => {
    const captured = await captureIncomingAiBotMessage({ conversationId: `website:${sessionId}`, message: safety.storageText, propertySlug: slug }).catch(() => null);
    if (!captured?.lead || captured.lead.id !== priorToken.leadId || captured.lead.propertySlug !== slug) return NextResponse.json({ error: "Your message could not be saved. Please retry." }, { status: 503, headers: responseHeaders });
    return NextResponse.json({ answer: "Your message has been saved in this conversation for the human team. AI replies are paused while they assist you.", grounded: false, sources: [], visitorToken: payload?.visitorToken, conversationState: "HUMAN_JOINED", handoffAvailable: handoffEnabled, messageAccepted: true }, { headers: responseHeaders });
    });
  }
  const categoryBoundary = evaluateCategoryHardBoundary(profile.category, message);
  const demoTurn = !explicitHumanRequest && !safety.blocked && fallbackDecision.intent !== "OFF_TOPIC" && !categoryBoundary && property.organization?.isDemo ? await resolveDemoConnectorTurn({ organizationId: property.organization.id, category: profile.category, question: message, priorQuestions, sessionId }).catch(() => null) : null;
  let result = safety.blocked ? null : demoTurn ? {
    answer: demoTurn.answer, sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "AIFROGI_DEMO_MOCK_CONNECTOR",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: demoTurn.status === "SUCCEEDED" ? "ANSWER" as const : demoTurn.status === "CLARIFY" ? "CLARIFY" as const : "ESCALATE" as const, reason: `Isolated demo connector ${demoTurn.connectorKey}/${demoTurn.operation} returned ${demoTurn.status}.` },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: demoTurn.status === "SAFE_FAILURE" ? "CONNECTOR" as const : "NONE" as const, failureCode: demoTurn.status === "SAFE_FAILURE" ? "DEMO_CONNECTOR_UNAVAILABLE" : null, latencyMs: 0, attemptCount: demoTurn.status === "CLARIFY" ? 0 : 1, escalationTier: demoTurn.status === "SAFE_FAILURE" ? "TIER_1_BUSINESS_ASYNC" as const : "TIER_0_SELF_RESOLVE" as const, degradedMode: demoTurn.status === "SAFE_FAILURE" }
  } : explicitHumanRequest && !safety.blocked ? null : await buildWebsiteKnowledgeAnswer({ question: message, propertySlug: slug, configuration: tenantConfiguration, priorQuestions, lastAssistantAnswer }).catch(() => null);
  if (explicitHumanRequest && !safety.blocked) result = {
    answer: handoffEnabled ? "Your request is saved for the business team to review in this conversation. A human has not joined yet. Contact details are optional for in-chat help; share them with consent only if you want a callback." : "Human handover is not enabled for this bot. Please contact the business through its published contact details. No live connection has been made.",
    sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "HANDOVER_CONTROL",
    decision: { ...fallbackDecision, disposition: "ESCALATE", reason: handoffEnabled ? "Explicit human request; persisted before acknowledgment." : "Human handover is disabled; no connection promised." },
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE", failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_1_BUSINESS_ASYNC", degradedMode: false }
  };
  const businessName = property.organization?.name || "the business";
  const proposedAnswer = safety.answer || result?.answer || (fallbackDecision.intent === "OFF_TOPIC" ? `I’m focused on ${businessName} services and cannot provide weather, sports, market, entertainment, or other unrelated live information. Please ask me about this business.` : `I do not have enough approved ${businessName} information to answer that confidently. I can arrange a conversation with the team if you share your preferred contact details.`);
  const proposedDecision = result?.decision || (safety.blocked
    ? { ...fallbackDecision, disposition: "ESCALATE" as const, reason: "Sensitive input guard returned the approved safety response and requires human governance." }
    : fallbackDecision.intent === "OFF_TOPIC" ? fallbackDecision : { ...fallbackDecision, disposition: "FALLBACK" as const, reason: "No sufficient approved answer context or model result was available." });
  const resolution = governResolutionOutcome({
    question: message,
    answer: proposedAnswer,
    decision: proposedDecision,
    previousState: existingResolutionState,
    consentedFacts: payload?.consent ? { name: String(payload.name || ""), contact: String(payload.contact || "") } : {}
  });
  const answer = resolution.answer;
  const evidenceDecision = resolution.decision;
  // Evidence describes the response actually served, not a discarded model answer.
  // Keep retrieval candidates for diagnosis, but never attribute their use to a breaker reply.
  if (answer !== proposedAnswer && result) {
    result = { ...result, answer, decision: evidenceDecision, sources: [], sourceUrls: [], claimIds: [], usedOpenAi: false, model: "BOUNDED_RESOLUTION",
      retrieval: { ...result.retrieval, usedClaimIds: [] },
      reliability: { ...result.reliability, failureLayer: "CONVERSATION_STATE", failureCode: resolution.state.circuitBreakerReason || "RESOLUTION_OVERRIDE", escalationTier: "TIER_1_BUSINESS_ASYNC" }
    };
  }
  const reliability = result?.reliability || { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: safety.blocked ? "NONE" as const : "INFRASTRUCTURE" as const, failureCode: safety.blocked ? null : "UNATTRIBUTED_RUNTIME_FAILURE", latencyMs: 0, attemptCount: 0, escalationTier: escalationTierFor({ failureLayer: safety.blocked ? "NONE" : "INFRASTRUCTURE", disposition: evidenceDecision.disposition }), degradedMode: false };
  return persistWebsiteTurn(async () => {
  const persistenceDb = getDb()!;
  const captured = await captureIncomingAiBotMessage({
    conversationId: `website:${sessionId}`,
    phone: payload?.consent && payload.contact ? String(payload.contact).slice(0, 120) : undefined,
    profileName: payload?.consent && payload.name ? String(payload.name).slice(0, 100) : "Website visitor",
    message: safety.storageText, aiReply: answer, propertySlug: slug
  }).catch(() => null);

  if (!captured?.lead || captured.lead.propertySlug !== slug) return NextResponse.json({ error: "Conversation could not be recorded." }, { status: 503, headers: responseHeaders });
  if ((explicitHumanRequest || evidenceDecision.disposition === "ESCALATE") && handoffEnabled) {
    try { await ensureWebsiteHandover({ propertyId: property.id, leadId: captured.lead.id, responseSlaMinutes: profile.responseSlaMinutes }); }
    catch { return NextResponse.json({ error: "Your human-help request could not be saved. Please retry." }, { status: 503, headers: responseHeaders }); }
  }
  const evidence = await recordSovereignAnswerEvidence({
    propertyId: property.id, leadId: captured.lead.id, sessionIdHash: hashWebsiteVisitorValue(sessionId), question: safety.storageText,
    answer, decision: evidenceDecision, grounded: Boolean(result?.sources.length || result?.claimIds.length), model: result?.model || (safety.blocked ? "SAFETY_GUARD" : "FALLBACK"),
    sources: result?.sources || [], knowledgeAsOf: result?.knowledgeAsOf || null,
    confidence: reliability.failureLayer !== "NONE" ? 0.2 : result?.sources.length || result?.claimIds.length ? 0.9 : safety.blocked || result ? 0.98 : 0.2,
    safetyClassification: safety.safetyClassification || (evidenceDecision.intent === "OFF_TOPIC" ? "BOUNDED_OFF_TOPIC" : "STANDARD"),
    permittedOperation: demoTurn?.status === "SUCCEEDED" ? "ACT" : evidenceDecision.disposition,
    actionPerformed: demoTurn?.status === "SUCCEEDED",
    resolutionState: resolution.state.status,
    clarifyCount: resolution.state.clarifyCount,
    circuitBreaker: resolution.state.circuitBreakerTriggered,
    circuitBreakerReason: resolution.state.circuitBreakerReason,
    knowledgeClaimIds: result?.claimIds || [],
    personaCategory: profile.category,
    personaVersion: profile.personaPackVersion,
    retrieval: result?.retrieval || { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    reliability
  }).catch(() => null);
  if (!evidence?.id) return NextResponse.json({ error: "Answer verification could not be recorded. Please try again shortly." }, { status: 503, headers: responseHeaders });
  const humanRequested = handoffEnabled && Boolean(explicitHumanRequest || evidenceDecision.disposition === "ESCALATE" || sessionStatus === "HUMAN_REQUESTED");
  const visitorToken = issueWebsiteVisitorToken({ slug, sessionId, leadId: captured.lead.id, humanRequested });
  const consented = Boolean(payload?.consent && payload.contact);
  const preserveActiveState = ["OFF_TOPIC", "GREETING", "IDENTITY"].includes(evidenceDecision.intent) && Boolean(existingResolutionState);
  const sessionResolutionState = (preserveActiveState ? existingResolutionState : resolution.state) as Prisma.InputJsonValue;
  await persistenceDb.websiteVisitorSession.upsert({
    where: { leadId: captured.lead.id },
    create: {
      propertyId: property.id, leadId: captured.lead.id, sessionIdHash: hashWebsiteVisitorValue(sessionId), capabilityHash: hashWebsiteVisitorValue(visitorToken),
      status: humanRequested ? "HUMAN_REQUESTED" : "AI_READY", resolutionState: resolution.state, expiresAt: new Date((verifyWebsiteVisitorToken(visitorToken, slug)?.exp || 0) * 1000),
      ...(consented ? { contactName: String(payload?.name || "").trim().slice(0, 100) || null, contactValue: String(payload?.contact || "").trim().slice(0, 120), consentText: `${businessName} may store these details and contact me about this enquiry.`, consentedAt: new Date() } : {})
    },
    update: {
      capabilityHash: hashWebsiteVisitorValue(visitorToken), status: humanRequested ? "HUMAN_REQUESTED" : undefined, resolutionState: sessionResolutionState,
      expiresAt: new Date((verifyWebsiteVisitorToken(visitorToken, slug)?.exp || 0) * 1000), revokedAt: null,
      ...(consented ? { contactName: String(payload?.name || "").trim().slice(0, 100) || null, contactValue: String(payload?.contact || "").trim().slice(0, 120), consentText: `${businessName} may store these details and contact me about this enquiry.`, consentedAt: new Date() } : {})
    }
  });

  return NextResponse.json({ answer, grounded: Boolean(result?.sources.length || result?.claimIds.length), sources: result?.sources.slice(0, 3) || [], knowledgeAsOf: result?.knowledgeAsOf || null, answerEvidenceId: evidence?.id || null, governance: { constitutionVersion: evidenceDecision.constitutionVersion, blueprintVersion: evidenceDecision.blueprintVersion, intent: evidenceDecision.intent, disposition: evidenceDecision.disposition, resolutionState: resolution.state.status, clarifyCount: resolution.state.clarifyCount, circuitBreaker: resolution.state.circuitBreakerTriggered }, responseSlaMinutes: profile.responseSlaMinutes, handoffAvailable: handoffEnabled, visitorToken, conversationState: humanRequested ? "HUMAN_REQUESTED" : "AI_READY" }, { headers: responseHeaders });
  });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (rateLimited(request, slug, 60)) return NextResponse.json({ error: "Please wait a moment before checking replies." }, { status: 429, headers: responseHeaders });
  const token = verifyWebsiteVisitorToken(bearerToken(request), slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Conversation is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const session = await db.websiteVisitorSession.findFirst({ where: { property: { slug }, leadId: token.leadId, sessionIdHash: hashWebsiteVisitorValue(token.sessionId), capabilityHash: hashWebsiteVisitorValue(bearerToken(request)), expiresAt: { gt: new Date() } }, select: { id: true, status: true, revokedAt: true } });
  if (!session || session.revokedAt) return NextResponse.json({ messages: [], conversationState: "CLOSED" }, { status: 410, headers: responseHeaders });
  const afterValue = new URL(request.url).searchParams.get("after") || "";
  const afterDate = afterValue ? new Date(afterValue) : null;
  const afterId = new URL(request.url).searchParams.get("afterId") || "";
  if (afterId && (!afterDate || !/^[a-zA-Z0-9_-]{1,100}$/.test(afterId))) return NextResponse.json({ error: "Invalid reply cursor." }, { status: 400, headers: responseHeaders });
  if (afterDate && Number.isNaN(afterDate.getTime())) return NextResponse.json({ error: "Invalid reply cursor." }, { status: 400, headers: responseHeaders });
  const lead = await db.lead.findFirst({
    where: { id: token.leadId, property: { slug } },
    select: {
      stage: true,
      tags: { select: { value: true } },
      messages: {
        where: { sender: "AGENT", ...(afterDate ? afterId ? { OR: [{ sentAt: { gt: afterDate } }, { sentAt: afterDate, id: { gt: afterId } }] } : { sentAt: { gt: afterDate } } : {}) },
        orderBy: [{ sentAt: "asc" }, { id: "asc" }],
        take: 51,
        select: { id: true, body: true, sentAt: true }
      }
    }
  });
  if (!lead) return NextResponse.json({ error: "Conversation was not found." }, { status: 404, headers: responseHeaders });
  const closed = ["BOOKED", "WON", "LOST"].includes(lead.stage) || lead.tags.some((tag) => ["resolved", "closed"].includes(tag.value.toLowerCase()));
  const hasMore = lead.messages.length > 50;
  const page = lead.messages.slice(0, 50);
  const messageIds = page.map((message) => message.id);
  if (messageIds.length) await Promise.all([
    db.leadMessage.updateMany({ where: { id: { in: messageIds }, leadId: token.leadId, deliveryStatus: null }, data: { deliveryStatus: "DELIVERED", statusUpdatedAt: new Date() } }),
    db.websiteVisitorSession.update({ where: { id: session.id }, data: { lastDeliveredAt: new Date() } })
  ]);
  // Fetching historical replies must never undo an explicit owner/admin AI resume.
  const conversationState = websiteConversationState(session.status, closed, false);
  return NextResponse.json({ messages: page.map((message) => ({ id: message.id, body: message.body, sentAt: message.sentAt.toISOString() })), conversationState, hasMore }, { headers: responseHeaders });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (rateLimited(request, slug, 60)) return NextResponse.json({ error: "Please wait a moment." }, { status: 429, headers: responseHeaders });
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
