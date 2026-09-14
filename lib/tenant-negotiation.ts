import type { NegotiationPolicy, TenantFlowDefinition } from "@/lib/tenant-flow-intelligence";

export type NegotiationOutcome =
  | { kind: "COUNTER"; offeredRate: number; currency: "INR"; round: number; expiresInMinutes: number; message: string }
  | { kind: "ACCEPTED"; offeredRate: number; currency: "INR"; message: string }
  | { kind: "HUMAN_APPROVAL"; message: string }
  | { kind: "NOT_APPLICABLE" };

const requestPattern = /\b(?:best|better|lowest|lower|discount|deal|offer|negotiate|negotiation|reduce|less|final)\b/i;
const rateInquiryPattern = /\b(?:rate|rates|price|pricing|cost|tariff|how much)\b/i;
const acceptancePattern = /^\s*(?:yes|yes please|accept|accepted|i accept|book it|continue|proceed)\s*[.!]?\s*$/i;

function scopeKey(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }

function mentionsScope(text: string, policy: NegotiationPolicy) {
  const normalized = scopeKey(text);
  return normalized.includes(scopeKey(policy.propertyName)) || Boolean(policy.roomName && normalized.includes(scopeKey(policy.roomName)));
}

export function activeNegotiationPolicy(flows: TenantFlowDefinition[], text: string) {
  return flows.find((flow) => flow.status === "PUBLISHED" && flow.templateKey === "COMMERCIAL_NEGOTIATION" && flow.negotiationPolicy?.enabled && mentionsScope(text, flow.negotiationPolicy))?.negotiationPolicy;
}

export function tenantNegotiationAuthority(flows: TenantFlowDefinition[]) {
  return flows.find((flow) => flow.status === "PUBLISHED" && flow.templateKey === "COMMERCIAL_NEGOTIATION" && flow.negotiationPolicy?.enabled)?.negotiationPolicy;
}

export function policyForVerifiedStay(authority: NegotiationPolicy | undefined, propertyName: string, verifiedRate: number) {
  if (!authority?.enabled || !propertyName || verifiedRate <= 0) return undefined;
  const discountSteps = [4, 7, 10].map((percent) => Math.round(verifiedRate * percent / 100));
  return { ...authority, propertyName, publicRate: verifiedRate, floorRate: verifiedRate - discountSteps[2], adjustmentMode: "PERCENT" as const, adjustmentValue: 4, discountSteps, maxRounds: 3 };
}

export function tenantRateInquiry(policy: NegotiationPolicy | undefined, message: string) {
  if (!policy?.enabled || !mentionsScope(message, policy) || !rateInquiryPattern.test(message) || requestPattern.test(message)) return null;
  return `${policy.propertyName} has a tenant-approved starting rate of ₹${policy.publicRate.toLocaleString("en-IN")} per night. The exact rate and availability depend on your stay dates. If you would like a better rate, you may ask me here and I’ll check the approved options.`;
}

export function evaluateTenantNegotiation(input: { policy?: NegotiationPolicy; message: string; priorCustomerMessages: string[]; lastAssistantAnswer: string }): NegotiationOutcome {
  const { policy, message, priorCustomerMessages, lastAssistantAnswer } = input;
  if (!policy || !policy.enabled) return { kind: "NOT_APPLICABLE" };
  const context = `${message}\n${lastAssistantAnswer}`;
  if (!mentionsScope(context, policy)) return { kind: "NOT_APPLICABLE" };
  const priorCounter = /subject to availability remaining unchanged/i.test(lastAssistantAnswer);
  const lastOfferedRate = Number(lastAssistantAnswer.match(/₹\s*([\d,]+)/)?.[1]?.replaceAll(",", "") || 0);
  const proposedRate = Number(message.match(/(?:₹|INR|Rs\.?\s*)?\b([3-9]\d{3,5})\b/i)?.[1] || 0);
  if (priorCounter && proposedRate > 0 && proposedRate < policy.floorRate) {
    return { kind: "HUMAN_APPROVAL", message: `Thank you for sharing your preferred rate. That amount needs manager approval. Please hold while I ask our reservations manager to review it; I can also arrange a callback if you share your name and mobile number with consent.` };
  }
  if (priorCounter && acceptancePattern.test(message) && lastOfferedRate >= policy.floorRate && lastOfferedRate <= policy.publicRate) {
    return { kind: "ACCEPTED", offeredRate: lastOfferedRate, currency: policy.currency, message: `Thank you—I’ve recorded your acceptance of ₹${lastOfferedRate.toLocaleString("en-IN")} per night for ${policy.propertyName}. Availability and rate must now be reverified before an official quote or booking is created. Please continue with your booking details; no room is confirmed until the booking system returns a reference.` };
  }
  if (!requestPattern.test(message) && !(priorCounter && proposedRate > 0)) return { kind: "NOT_APPLICABLE" };
  const publicRatePattern = new RegExp(`(?:₹|INR|Rs\\.?)\\s*${policy.publicRate.toLocaleString("en-IN").replace(",", "[, ]?")}`, "i");
  const verifiedRateContext = (/live availability is confirmed|tenant-approved starting rate/i.test(lastAssistantAnswer) && publicRatePattern.test(lastAssistantAnswer)) || priorCounter;
  if (!verifiedRateContext) return { kind: "HUMAN_APPROVAL", message: `I can check an approved rate for ${policy.propertyName}, but I must first verify availability and the current live rate for your dates. Please share your check-in and check-out dates.` };
  const previousRequests = priorCustomerMessages.filter((item) => requestPattern.test(item) && mentionsScope(`${item}\n${lastAssistantAnswer}`, policy)).length;
  const round = Math.min(policy.maxRounds, previousRequests + 1);
  if (policy.approvalMode === "HUMAN_ALL") return { kind: "HUMAN_APPROVAL", message: `I’ve noted your request for a better rate at ${policy.propertyName}. The reservations team must approve discounted offers; I can arrange their reply or a callback.` };
  const progressiveDiscount = policy.discountSteps?.[round - 1];
  const step = policy.adjustmentMode === "PERCENT" ? Math.round(policy.publicRate * policy.adjustmentValue / 100) : policy.adjustmentValue;
  const offeredRate = Math.max(policy.floorRate, Math.round(policy.publicRate - (progressiveDiscount || step * round)));
  if (previousRequests >= policy.maxRounds) return { kind: "HUMAN_APPROVAL", message: `That is the best automated offer I’m authorised to provide for ${policy.propertyName}. For any further consideration, I can ask the reservations team to review your request.` };
  return { kind: "COUNTER", offeredRate, currency: policy.currency, round, expiresInMinutes: policy.quoteExpiryMinutes, message: `I can offer ${policy.propertyName} at ₹${offeredRate.toLocaleString("en-IN")} per night for the verified dates, subject to availability remaining unchanged. This offer is valid for ${policy.quoteExpiryMinutes} minutes. Would you like to accept it and continue to an official quote?` };
}
