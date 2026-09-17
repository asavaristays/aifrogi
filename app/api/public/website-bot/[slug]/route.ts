import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { recordTenantAnswerUsage } from "@/lib/tenant-usage-metering";
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
import { resolveDemoCommonAnswer, resolveDemoConnectorTurn } from "@/lib/demo-sandbox/service";
import { evaluateCategoryHardBoundary } from "@/lib/sovereign-intelligence/category-policy";
import type { Prisma } from "@/generated/prisma/client";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { acceptedHumanOffer, ensureWebsiteHandover, humanResponseWindow, websiteConversationState } from "@/lib/website-handover";
import { withWebsiteTurnLock } from "@/lib/website-turn-lock";
import { persistWebsiteTurn } from "@/lib/website-persistence";
import { appendQualificationPrompt, normalizeConsentedLeadPhone, qualifyLeadConversation } from "@/lib/lead-qualification";
import { checkOrganizationEntitlement } from "@/lib/billing-super-admin";
import { buildMissingAnswerRecovery, evaluateVisitorAnswerQuality } from "@/lib/sovereign-intelligence/answer-quality-gate";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { approvedBookingLink } from "@/lib/widget-menu";
import { checkTenantStayAvailability } from "@/lib/tenant-availability";
import { planConversation } from "@/lib/sovereign-intelligence/conversation-planner";
import { activeNegotiationPolicy, evaluateTenantNegotiation, policyForVerifiedStay, tenantNegotiationAuthority, tenantRateInquiry } from "@/lib/tenant-negotiation";
import { INTELLIGENCE_ROUTER_VERSION, resolveIntelligenceLayer } from "@/lib/sovereign-intelligence/layer-router";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";

const buckets = new Map<string, { count: number; resetAt: number }>();
const configuration: WhatsAppBotConfiguration = {
  enabled: true, language: "EN", welcomeEnabled: true,
  welcomeMessage: "Welcome. How can I help with your business enquiry today?",
  serviceBuckets: ["WEBSITE_CMS", "AI_AUTOMATION", "CONSULTATION_INTEGRATIONS"],
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
  try {
    const response = await withPublicBotDatabaseContext(slug, () =>
      withWebsiteTurnLock(`${slug}:${hashWebsiteVisitorValue(sessionId)}`, () => handleVisitorTurn(request, context))
    );
    return response || NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });
  }
  catch (error) {
    console.error("[website-bot] Conversation turn failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Conversation update could not complete. Please retry shortly." }, { status: 503, headers: responseHeaders });
  }
}

async function handleVisitorTurn(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (rateLimited(request, slug)) return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429, headers: responseHeaders });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Business intelligence is temporarily unavailable." }, { status: 503, headers: responseHeaders });
  const property = await db.property.findUnique({ where: { slug }, select: { id: true, slug: true, timezone: true, organization: { select: { id: true, name: true, isDemo: true, publicPhone: true, botProfile: true } } } });
  const organization = property?.organization;
  const profile = organization?.botProfile;
  if (!property || !organization || !profile || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });
  const tenantConfiguration = { ...configuration, welcomeMessage: `Welcome to ${organization.name}. How can I help with your business enquiry today?` };
  const subscription = await getOrganizationSubscriptionAccess(organization.id);
  if (subscription && !subscription.canUsePaidActions) return NextResponse.json({ error: "This AI Bot is temporarily suspended. The business account owner can restore it through billing." }, { status: 402, headers: responseHeaders });
  const replyEntitlement = await checkOrganizationEntitlement(organization.id, "aiReplies", 1);
  if (!replyEntitlement.allowed) return NextResponse.json({ error: "This AI Bot has used its available reply credits. The business account owner can add credits or activate a plan in Billing." }, { status: 402, headers: responseHeaders });

  const payload = await request.json().catch(() => null) as { message?: string; sessionId?: string; name?: string; contact?: string; consent?: boolean; requestHuman?: boolean; visitorToken?: string; visitorTimeZone?: string } | null;
  const message = String(payload?.message || "").trim().slice(0, 1200);
  const sessionId = String(payload?.sessionId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (message.length < 2 || !sessionId) return NextResponse.json({ error: "Message and session are required." }, { status: 400, headers: responseHeaders });
  const consentedContact = payload?.consent ? normalizeConsentedLeadPhone(payload.contact) : null;
  const consentedName = payload?.consent ? String(payload.name || "").trim().slice(0, 100) : "";
  if (payload?.consent && (!consentedName || !consentedContact)) return NextResponse.json({ error: "Enter your name and a valid mobile number for consented follow-up." }, { status: 400, headers: responseHeaders });

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
  const acceptedCallbackOffer = acceptedHumanOffer(message, lastAssistantAnswer);
  const explicitHumanRequest = Boolean(payload?.requestHuman || fallbackDecision.intent === "HUMAN_REQUEST" || acceptedCallbackOffer);
  const hasExplicitActionableOffer = /\bwould you like\b/i.test(lastAssistantAnswer)
    && /\b(?:details?|book|booking|check|schedule|continue|proceed)\b/i.test(lastAssistantAnswer)
    || /https?:\/\/\S+/i.test(lastAssistantAnswer) && /\b(?:book|booking|schedule|register|apply|order|pay)\b/i.test(lastAssistantAnswer);
  const unsupportedAffirmative = /^(?:yes|yes please|yeah|yep|ok|okay|sure|please do)[.!\s]*$/i.test(message)
    && !acceptedCallbackOffer && !hasExplicitActionableOffer;
  const repeatsUnresolvedAffirmative = unsupportedAffirmative
    && existingResolutionState && typeof existingResolutionState === "object" && !Array.isArray(existingResolutionState)
    && "status" in existingResolutionState && existingResolutionState.status === "ACTIVE"
    && "clarifyCount" in existingResolutionState && typeof existingResolutionState.clarifyCount === "number" && existingResolutionState.clarifyCount >= 1;
  const handoffEnabled = profile.humanHandoffEnabled === true;
  // A human-owned conversation must not call the model or generate competing advice.
  if (sessionStatus === "HUMAN_JOINED" && priorToken) {
    return persistWebsiteTurn(async () => {
    const captured = await captureIncomingAiBotMessage({ conversationId: `website:${sessionId}`, message: safety.storageText, propertySlug: slug }).catch(() => null);
    if (!captured?.lead || captured.lead.id !== priorToken.leadId || captured.lead.propertySlug !== slug) return NextResponse.json({ error: "Your message could not be saved. Please retry." }, { status: 503, headers: responseHeaders });
    return NextResponse.json({ answer: "Your message has been saved in this conversation for the human team. AI replies are paused while they assist you.", grounded: false, sources: [], visitorToken: payload?.visitorToken, conversationState: "HUMAN_JOINED", handoffAvailable: handoffEnabled, messageAccepted: true }, { headers: responseHeaders });
    });
  }
  const businessName = property.organization?.name || "the business";
  const knowledgeSettings = await readKnowledgeSettings(slug);
  const bookingLink = approvedBookingLink(knowledgeSettings.widgetMenu);
  const bookingChoices = (bookingLink?.children || []).map((item) => {
    const [destination, stay] = item.label.split("|").map((value) => value.trim());
    return { destination, stay, url: item.value };
  }).filter((item) => item.destination && item.stay && item.url);
  const bookingPlan = planConversation({
    question: message,
    priorQuestions,
    lastAssistantAnswer,
    blueprintVersion: CATEGORY_BLUEPRINT_VERSION,
    operations: bookingLink ? [{
      id: "booking.availability",
      triggerTerms: ["book", "booking", "reserve", "reservation", "availability", "available", "rate", "rates", "price", "pricing", "cost", "room", "rooms", "stay", "stays", "property", "properties", "hotel", "hotels", "villa", "villas"],
      slots: [
        { key: "destination", knownValues: [...new Set(bookingChoices.map((item) => item.destination))], required: true },
        { key: "dates", entityKind: "DATE", required: true }
      ]
    }] : []
  });
  const conversationText = `${message}\n${lastAssistantAnswer}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  const requestedStay = bookingChoices.find((item) => conversationText.includes(item.stay.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const requestedDestination = requestedStay?.destination || (bookingPlan.operation?.id === "booking.availability" ? bookingPlan.operation.slots.destination?.[0] : undefined);
  const destinationStays = requestedDestination ? bookingChoices.filter((item) => item.destination === requestedDestination) : [];
  const destinationBookingUrl = requestedDestination && bookingLink?.value ? (() => { const url = new URL("/destination", bookingLink.value); url.searchParams.set("destination", requestedDestination); return url.toString(); })() : bookingLink?.value;
  const requestedDates = bookingPlan.operation?.id === "booking.availability" ? (bookingPlan.operation.slots.dates || []).slice(0, 2) : [];
  const requestsOnlineBooking = bookingPlan.operation?.id === "booking.availability" && bookingPlan.operation.requested;
  const liveAvailability = requestsOnlineBooking && requestedDestination && requestedDates.length === 2
    ? await checkTenantStayAvailability({ organizationId: organization.id, destination: requestedDestination, checkIn: requestedDates[0], checkOut: requestedDates[1] }).catch(() => null)
    : null;
  const matchingLiveStay = liveAvailability?.properties.find((item) => requestedStay && item.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(requestedStay.stay.toLowerCase().replace(/[^a-z0-9]/g, ""))) || (liveAvailability?.properties.length === 1 ? liveAvailability.properties[0] : undefined);
  const configuredPolicy = activeNegotiationPolicy(knowledgeSettings.tenantFlows || [], `${message}\n${lastAssistantAnswer}`);
  const tenantAuthority = tenantNegotiationAuthority(knowledgeSettings.tenantFlows || []);
  const contextualRate = matchingLiveStay?.fromRate || Number(lastAssistantAnswer.match(/(?:₹|INR)\s*([\d,]+)/i)?.[1]?.replaceAll(",", "") || 0);
  const contextualStayName = matchingLiveStay?.name || requestedStay?.stay || configuredPolicy?.propertyName || "";
  const negotiationPolicy = configuredPolicy || policyForVerifiedStay(tenantAuthority, contextualStayName, contextualRate);
  const negotiation = evaluateTenantNegotiation({ policy: negotiationPolicy, message, priorCustomerMessages: priorQuestions, lastAssistantAnswer });
  const rateInquiryAnswer = tenantRateInquiry(negotiationPolicy, message);
  const categoryBoundary = evaluateCategoryHardBoundary(profile.category, message);
  const demoCommonAnswer = property.organization?.isDemo ? resolveDemoCommonAnswer(profile.category, message) : null;
  const directCommercialHandoff = /\b(?:quote|quotation|proposal|estimate)\b/i.test(message) || /\b(?:schedule|arrange|book)\b[^.!?\n]{0,45}\b(?:consultation|counselling|meeting)\b/i.test(message);
  const explorationOnly = /\b(?:only|just)\s+(?:exploring|browsing|looking)|\bnot\s+(?:decided|ready)\b/i.test(message);
  const demoTurn = !explicitHumanRequest && !safety.blocked && fallbackDecision.intent !== "OFF_TOPIC" && !categoryBoundary && property.organization?.isDemo ? await resolveDemoConnectorTurn({ organizationId: property.organization.id, category: profile.category, question: message, priorQuestions, sessionId }).catch(() => null) : null;
  let result = safety.blocked ? null : categoryBoundary ? {
    answer: categoryBoundary.answer,
    sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "CATEGORY_AUTHORITY_BOUNDARY",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, intent: "SENSITIVE" as const, disposition: "ESCALATE" as const, reason: `Hard category boundary ${categoryBoundary.code}.` },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_1_BUSINESS_ASYNC" as const, degradedMode: false }
  } : unsupportedAffirmative ? {
    answer: `Please tell me what you would like to do next about ${businessName}—for example, ask another question or name the option you want to check.`,
    sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "CONTEXT_CLARIFICATION",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: {
      ...fallbackDecision,
      disposition: "CLARIFY" as const,
      contextUsed: Boolean(existingResolutionState),
      resolvedQuestion: existingResolutionState && typeof existingResolutionState === "object" && !Array.isArray(existingResolutionState) && "resolvedQuestion" in existingResolutionState && typeof existingResolutionState.resolvedQuestion === "string" ? existingResolutionState.resolvedQuestion : fallbackDecision.resolvedQuestion,
      reason: "Affirmative reply had no explicit actionable offer to accept."
    },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_0_SELF_RESOLVE" as const, degradedMode: false }
  } : rateInquiryAnswer ? {
    answer: rateInquiryAnswer,
    sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: knowledgeSettings.updatedAt, usedOpenAi: false, model: "TENANT_APPROVED_RATE_POLICY",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: "ANSWER" as const, reason: "Published tenant negotiation policy supplied the approved starting rate." },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_0_SELF_RESOLVE" as const, degradedMode: false }
  } : negotiation.kind !== "NOT_APPLICABLE" ? {
    answer: negotiation.message,
    sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: negotiation.kind === "COUNTER" || negotiation.kind === "ACCEPTED" ? "TENANT_NEGOTIATION_POLICY" : "TENANT_NEGOTIATION_HANDOVER",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: negotiation.kind === "COUNTER" || negotiation.kind === "ACCEPTED" ? "ANSWER" as const : "CLARIFY" as const, reason: negotiation.kind === "COUNTER" ? "Counteroffer calculated inside the published tenant boundary." : negotiation.kind === "ACCEPTED" ? "Guest acceptance recorded without claiming an unverified booking." : "Negotiation requires verified rate context or human approval." },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: negotiation.kind === "COUNTER" || negotiation.kind === "ACCEPTED" ? "TIER_0_SELF_RESOLVE" as const : "TIER_1_BUSINESS_ASYNC" as const, degradedMode: false }
  } : requestsOnlineBooking && bookingLink ? {
    answer: liveAvailability
      ? liveAvailability.available
        ? `Yes—live availability is confirmed in ${liveAvailability.destination} for ${liveAvailability.checkIn} to ${liveAvailability.checkOut}.\n\n${liveAvailability.properties.filter((item) => !requestedStay || item === matchingLiveStay).map((item) => `${item.name}: ${item.availableCount} room${item.availableCount === 1 ? "" : "s"} available${item.fromRate ? ` from ${item.currency} ${item.fromRate.toLocaleString("en-IN")}` : ""}\nhttps://asavaristays.com/properties/${item.id}?checkIn=${liveAvailability.checkIn}&checkOut=${liveAvailability.checkOut}&adults=2&children=0`).join("\n\n")}\n\nThe verified property card is shown below. Select the stay to continue booking.`
        : `No live availability was returned in ${liveAvailability.destination} for ${liveAvailability.checkIn} to ${liveAvailability.checkOut}. Please select different dates below.`
      : requestedDestination && destinationStays.length
      ? `${businessName} has ${destinationStays.map((item) => item.stay).join(" and ")} in ${requestedDestination}. Select check-in and check-out dates below and I’ll verify live room availability from the booking database.\n\nCheck stays: ${destinationBookingUrl}`
      : `Select your destination and dates below to check live availability from ${businessName}'s approved booking system.\n\nCheck stays: ${bookingLink.value}`,
    sources: [{ title: "Approved online booking page", url: bookingLink.value!, crawledAt: knowledgeSettings.updatedAt, authority: "APPROVED_FIRST_PARTY_WEBSITE" as const, freshness: "CURRENT" as const }], sourceUrls: [bookingLink.value!], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "APPROVED_BOOKING_LINK",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: "ANSWER" as const, reason: "Booking intent routed to the tenant-approved secure booking destination." },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_0_SELF_RESOLVE" as const, degradedMode: false }
  } : explorationOnly ? {
    answer: `No problem. Take your time exploring ${businessName}. Ask me anything about the business whenever you’re ready.`, sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "EXPLORATION_ACKNOWLEDGEMENT",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: "ANSWER" as const, reason: "Low-intent exploration acknowledged without creating a knowledge gap or sales prompt." },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_0_SELF_RESOLVE" as const, degradedMode: false }
  } : directCommercialHandoff && !demoTurn ? {
    answer: "Thank you for your enquiry. I can arrange for the right team member to discuss the requirement and prepare the next step with you.", sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "COMMERCIAL_HANDOFF",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: "ANSWER" as const, reason: "Explicit commercial request routed to consented callback capture." },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_0_SELF_RESOLVE" as const, degradedMode: false }
  } : demoCommonAnswer ? {
    answer: demoCommonAnswer, sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "AIFROGI_DEMO_COMMON_KNOWLEDGE",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: "ANSWER" as const, reason: "Common vertical question answered from the isolated demo fixture." },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE" as const, failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_0_SELF_RESOLVE" as const, degradedMode: false }
  } : demoTurn ? {
    answer: demoTurn.answer, sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "AIFROGI_DEMO_MOCK_CONNECTOR",
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    decision: { ...fallbackDecision, disposition: demoTurn.status === "SUCCEEDED" ? "ANSWER" as const : demoTurn.status === "CLARIFY" ? "CLARIFY" as const : "ESCALATE" as const, reason: `Isolated demo connector ${demoTurn.connectorKey}/${demoTurn.operation} returned ${demoTurn.status}.` },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: demoTurn.status === "SAFE_FAILURE" ? "CONNECTOR" as const : "NONE" as const, failureCode: demoTurn.status === "SAFE_FAILURE" ? "DEMO_CONNECTOR_UNAVAILABLE" : null, latencyMs: 0, attemptCount: demoTurn.status === "CLARIFY" ? 0 : 1, escalationTier: demoTurn.status === "SAFE_FAILURE" ? "TIER_1_BUSINESS_ASYNC" as const : "TIER_0_SELF_RESOLVE" as const, degradedMode: demoTurn.status === "SAFE_FAILURE" }
  } : explicitHumanRequest && !safety.blocked ? null : await buildWebsiteKnowledgeAnswer({ question: message, propertySlug: slug, configuration: tenantConfiguration, priorQuestions, lastAssistantAnswer, visitorTimeZone: payload?.visitorTimeZone || property.timezone }).catch(() => null);
  if (explicitHumanRequest && !safety.blocked) result = {
    answer: handoffEnabled
      ? consentedContact
        ? `Thank you. Your callback request has been saved for the ${profile.category === "PINGBOOK" ? "clinic reception" : profile.category === "STAY" ? "reservations team" : profile.category === "EDUCATION" ? "admissions team" : profile.category === "REAL_ESTATE" ? "property team" : "support team"}. They will contact you ${humanResponseWindow(profile.responseSlaMinutes)}.`
        : `Of course. I’ve alerted the ${profile.category === "PINGBOOK" ? "clinic reception" : profile.category === "STAY" ? "reservations team" : profile.category === "EDUCATION" ? "admissions team" : profile.category === "REAL_ESTATE" ? "property team" : "support team"}. A team member has not joined yet; they will respond here ${humanResponseWindow(profile.responseSlaMinutes)}. If you prefer a callback, share your name and mobile number using the consent fields below.${organization.publicPhone ? ` For immediate assistance, you may also call ${organization.publicPhone}.` : ""}`
      : `Human handover is not enabled for this bot.${organization.publicPhone ? ` Please call ${organization.publicPhone}.` : " Please use the business’s published contact details."}`,
    sources: [], sourceUrls: [], claimIds: [], knowledgeAsOf: new Date().toISOString(), usedOpenAi: false, model: "HANDOVER_CONTROL",
    decision: { ...fallbackDecision, disposition: "ESCALATE", reason: handoffEnabled ? "Explicit human request; persisted before acknowledgment." : "Human handover is disabled; no connection promised." },
    retrieval: { candidates: [], retrievedClaimIds: [], usedClaimIds: [], nearMissClaimIds: [] },
    reliability: { frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE", failureCode: null, latencyMs: 0, attemptCount: 0, escalationTier: "TIER_1_BUSINESS_ASYNC", degradedMode: false }
  };
  const qualification = qualifyLeadConversation({
    messages: [...priorQuestions].reverse().concat(message),
    previousState: existingResolutionState,
    contact: consentedContact || undefined,
    enabled: (profile.capabilities || []).includes("CAPTURE_LEADS") && (profile.capabilities || []).includes("QUALIFY_LEADS") && !explicitHumanRequest && !safety.blocked && !categoryBoundary && !["OFF_TOPIC", "GREETING", "IDENTITY"].includes(fallbackDecision.intent)
  });
  if (result) {
    const quality = evaluateVisitorAnswerQuality({ question: message, answer: result.answer, decision: result.decision });
    if (!quality.passed) result = null;
  }
  const verifiedResultAnswer = explicitHumanRequest || (result && ["ANSWER", "CLARIFY", "ESCALATE"].includes(result.decision.disposition)) || negotiation.kind === "HUMAN_APPROVAL" ? result?.answer : "";
  const fallbackContactPath = buildMissingAnswerRecovery({ businessName, category: profile.category, publicPhone: organization.publicPhone, handoffEnabled });
  const baseAnswer = safety.answer || verifiedResultAnswer || (fallbackDecision.intent === "OFF_TOPIC"
    ? `I’m focused on ${businessName} services and cannot provide weather, sports, market, entertainment, or other unrelated live information. Please ask me about this business.`
    : fallbackDecision.disposition === "CLARIFY"
      ? `What would you like help with about ${businessName}? Please share the service, product or booking detail you mean.`
      : fallbackContactPath);
  const hasVerifiedAnswer = result?.decision.disposition === "ANSWER" && Boolean(result.sources.length || result.claimIds.length || result.reliability.failureLayer === "NONE");
  const proposedAnswer = qualification.state && hasVerifiedAnswer ? appendQualificationPrompt(baseAnswer, qualification.prompt) : baseAnswer;
  const proposedDecision = result?.decision || (safety.blocked
    ? { ...fallbackDecision, disposition: "ESCALATE" as const, reason: "Sensitive input guard returned the approved safety response and requires human governance." }
    : fallbackDecision.intent === "OFF_TOPIC" || fallbackDecision.disposition === "CLARIFY" ? fallbackDecision : { ...fallbackDecision, disposition: "FALLBACK" as const, reason: "No sufficient approved answer context or model result was available." });
  const assistedFallback = !explicitHumanRequest && !safety.blocked && fallbackDecision.intent !== "OFF_TOPIC" && proposedDecision.disposition !== "ANSWER";
  const resolution = governResolutionOutcome({
    question: message,
    answer: proposedAnswer,
    decision: proposedDecision,
    previousState: existingResolutionState,
    maxClarifyCycles: repeatsUnresolvedAffirmative ? 1 : undefined,
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
    phone: consentedContact || undefined,
    profileName: payload?.consent && payload.name ? String(payload.name).slice(0, 100) : "Website visitor",
    message: safety.storageText, aiReply: answer, propertySlug: slug
  }).catch(() => null);

  if (!captured?.lead || captured.lead.propertySlug !== slug) return NextResponse.json({ error: "Conversation could not be recorded." }, { status: 503, headers: responseHeaders });
  if ((explicitHumanRequest || assistedFallback || evidenceDecision.disposition === "ESCALATE") && handoffEnabled) {
    try { await ensureWebsiteHandover({ propertyId: property.id, leadId: captured.lead.id, responseSlaMinutes: profile.responseSlaMinutes }); }
    catch { return NextResponse.json({ error: "Your human-help request could not be saved. Please retry." }, { status: 503, headers: responseHeaders }); }
  }
  const evidence = await recordSovereignAnswerEvidence({
    propertyId: property.id, leadId: captured.lead.id, sessionIdHash: hashWebsiteVisitorValue(sessionId), question: safety.storageText,
    answer, decision: evidenceDecision, grounded: Boolean(result?.sources.length || result?.claimIds.length), model: result?.model || (safety.blocked ? "SAFETY_GUARD" : "FALLBACK"),
    sources: result?.sources || [], knowledgeAsOf: result?.knowledgeAsOf || null,
    confidence: result?.model === "APPROVED_CLAIM_FALLBACK" ? 0.98 : reliability.failureLayer !== "NONE" ? 0.2 : result?.sources.length || result?.claimIds.length ? 0.9 : safety.blocked || result ? 0.98 : 0.2,
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
  await recordTenantAnswerUsage({ organizationId: organization.id, evidenceId: evidence.id, usage: { inputTokens: result?.modelUsage?.inputTokens || 0, outputTokens: result?.modelUsage?.outputTokens || 0, model: result?.model || "NON_MODEL", attempts: reliability.attemptCount, latencyMs: reliability.latencyMs } }).catch((error) => console.error("Tenant usage metering failed", { organizationId: organization.id, evidenceId: evidence.id, error }));
  const humanRequested = handoffEnabled && Boolean(explicitHumanRequest || assistedFallback || evidenceDecision.disposition === "ESCALATE" || sessionStatus === "HUMAN_REQUESTED");
  const visitorToken = issueWebsiteVisitorToken({ slug, sessionId, leadId: captured.lead.id, humanRequested });
  const consented = Boolean(consentedContact);
  const preserveActiveState = ["OFF_TOPIC", "GREETING", "IDENTITY"].includes(evidenceDecision.intent) && Boolean(existingResolutionState);
  const baseResolutionState = preserveActiveState ? existingResolutionState : resolution.state;
  const intelligenceLayer = resolveIntelligenceLayer({
    safetyBlocked: safety.blocked,
    humanRequested: explicitHumanRequest || sessionStatus === "HUMAN_REQUESTED",
    flowMatched: negotiation.kind !== "NOT_APPLICABLE" || Boolean(rateInquiryAnswer),
    connectorMatched: Boolean(requestsOnlineBooking || demoTurn),
    tenantGrounded: Boolean(result?.sources.length || result?.claimIds.length),
    coreAnswered: Boolean(result)
  });
  const sessionResolutionState = {
    ...((baseResolutionState && typeof baseResolutionState === "object" && !Array.isArray(baseResolutionState)) ? baseResolutionState : {}),
    ...(qualification.state ? { qualification: qualification.state } : {}),
    intelligenceRouter: { version: INTELLIGENCE_ROUTER_VERSION, layer: intelligenceLayer }
  } as Prisma.InputJsonValue;
  await persistenceDb.websiteVisitorSession.upsert({
    where: { leadId: captured.lead.id },
    create: {
      propertyId: property.id, leadId: captured.lead.id, sessionIdHash: hashWebsiteVisitorValue(sessionId), capabilityHash: hashWebsiteVisitorValue(visitorToken),
      status: humanRequested ? "HUMAN_REQUESTED" : "AI_READY", resolutionState: sessionResolutionState, expiresAt: new Date((verifyWebsiteVisitorToken(visitorToken, slug)?.exp || 0) * 1000),
      ...(consented ? { contactName: consentedName, contactValue: consentedContact, consentText: `${businessName} may store these details and contact me about this enquiry.`, consentedAt: new Date() } : {})
    },
    update: {
      capabilityHash: hashWebsiteVisitorValue(visitorToken), status: humanRequested ? "HUMAN_REQUESTED" : undefined, resolutionState: sessionResolutionState,
      expiresAt: new Date((verifyWebsiteVisitorToken(visitorToken, slug)?.exp || 0) * 1000), revokedAt: null,
      ...(consented ? { contactName: consentedName, contactValue: consentedContact, consentText: `${businessName} may store these details and contact me about this enquiry.`, consentedAt: new Date() } : {})
    }
  });

  if (qualification.state) {
    const facts = qualification.state.facts;
    await persistenceDb.lead.update({
      where: { id: captured.lead.id },
      data: {
        score: qualification.state.score,
        intent: facts.need || captured.lead.intent,
        stayLabel: facts.location ? `Market: ${facts.location}` : captured.lead.stay,
        partyLabel: facts.timeline ? `Timeline: ${facts.timeline}` : captured.lead.party,
        budgetLabel: facts.budget ? `Budget: ${facts.budget}` : captured.lead.budget,
        isHighPriority: qualification.state.tier === "HOT",
        stage: ["QUALIFIED", "HANDOFF_READY"].includes(qualification.state.status) ? "QUALIFIED" : undefined,
        lastActivityAt: new Date()
      }
    });
  }

  const bookingContext = { ...(requestedDestination ? { destination: requestedDestination } : {}), ...(requestedDates[0] ? { checkIn: requestedDates[0] } : {}), ...(requestedDates[1] ? { checkOut: requestedDates[1] } : {}), ...(contextualStayName ? { stay: contextualStayName } : {}) };
  return NextResponse.json({ answer, ...((requestsOnlineBooking || negotiation.kind === "ACCEPTED") && bookingLink?.action === "BOOKING" ? { uiAction: "OPEN_BOOKING", bookingContext } : {}), grounded: Boolean(result?.sources.length || result?.claimIds.length), sources: result?.sources.slice(0, 3) || [], knowledgeAsOf: result?.knowledgeAsOf || null, answerEvidenceId: evidence?.id || null, governance: { constitutionVersion: evidenceDecision.constitutionVersion, blueprintVersion: evidenceDecision.blueprintVersion, intent: evidenceDecision.intent, disposition: evidenceDecision.disposition, resolutionState: resolution.state.status, clarifyCount: resolution.state.clarifyCount, circuitBreaker: resolution.state.circuitBreakerTriggered }, qualification: (explicitHumanRequest || assistedFallback) && !consentedContact ? { contactEligible: true, nextField: "contact" } : qualification.state ? { contactEligible: qualification.state.contactEligible, nextField: qualification.state.nextField } : null, responseSlaMinutes: profile.responseSlaMinutes, handoffAvailable: handoffEnabled, visitorToken, conversationState: humanRequested ? "HUMAN_REQUESTED" : "AI_READY" }, { headers: responseHeaders });
  });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (rateLimited(request, slug, 60)) return NextResponse.json({ error: "Please wait a moment before checking replies." }, { status: 429, headers: responseHeaders });
  const token = verifyWebsiteVisitorToken(bearerToken(request), slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  const scopedResponse = await withPublicBotDatabaseContext(slug, async () => {
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
  });
  return scopedResponse || NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (rateLimited(request, slug, 60)) return NextResponse.json({ error: "Please wait a moment." }, { status: 429, headers: responseHeaders });
  const token = verifyWebsiteVisitorToken(bearerToken(request), slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers: responseHeaders });
  const payload = await request.json().catch(() => null) as { messageIds?: unknown } | null;
  const messageIds = Array.isArray(payload?.messageIds) ? payload.messageIds.filter((id): id is string => typeof id === "string").slice(0, 50) : [];
  if (!messageIds.length) return NextResponse.json({ error: "Message IDs are required." }, { status: 400, headers: responseHeaders });
  const scopedResponse = await withPublicBotDatabaseContext(slug, async () => {
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
  });
  return scopedResponse || NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers: responseHeaders });
}
