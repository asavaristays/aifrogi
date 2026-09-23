export type ClaimValidation = { valid: true; violations: [] } | { valid: false; violations: string[] };

function canonical(value: string) {
  return value.toLowerCase().replace(/,/g, "").replace(/₹\s*/g, "₹").replace(/\s*%/g, "%").replace(/\s+/g, " ").trim();
}

const entitlementTopics = ["parking", "breakfast", "wifi", "wi-fi", "internet", "transfer", "laundry", "meal", "tax", "fee", "room", "service"];
const entitlementTerms = /\b(?:free|complimentary|included|without (?:an? )?(?:extra )?(?:charge|cost|fee)|no (?:extra )?(?:charge|cost|fee))\b/i;
const approvedEntitlementTerms = /\b(?:free|complimentary|included (?:in|with) (?:the )?(?:rate|price|package|booking|stay)|without (?:an? )?(?:extra )?(?:charge|cost|fee)|no (?:extra )?(?:charge|cost|fee))\b/i;

function contextExplicitlySupportsEntitlement(context: string, topicPattern: RegExp) {
  for (const segment of context.split(/(?<=[.!?])\s+|\n+|[,;|]/)) {
    for (const match of segment.matchAll(new RegExp(topicPattern.source, `${topicPattern.flags.replace("g", "")}g`))) {
      const start = Math.max(0, (match.index || 0) - 40);
      const end = Math.min(segment.length, (match.index || 0) + match[0].length + 40);
      if (approvedEntitlementTerms.test(segment.slice(start, end))) return true;
    }
  }
  return false;
}

function unsupportedEntitlements(answer: string, approvedContext: string) {
  const violations: string[] = [];
  const answerSentences = answer.split(/(?<=[.!?])\s+|\n+/);
  for (const sentence of answerSentences) {
    const positiveClaims = sentence.replace(/\b(?:(?:is|are|was|were)\s+)?(?:not|never)\s+(?:free|complimentary|included)\b/gi, "");
    if (!entitlementTerms.test(positiveClaims)) continue;
    const topic = entitlementTopics.find((candidate) => new RegExp(`\\b${candidate.replace("-", "[- ]?")}\\b`, "i").test(positiveClaims));
    if (!topic) continue;
    const topicPattern = new RegExp(`\\b${topic.replace("-", "[- ]?")}\\b`, "i");
    const supported = contextExplicitlySupportsEntitlement(approvedContext, topicPattern);
    if (!supported) violations.push(`UNSUPPORTED_ENTITLEMENT:${topic}`);
  }
  return violations;
}

export function validateGeneratedClaims(input: { answer: string; approvedContext: string; connectorVerified?: boolean }): ClaimValidation {
  const context = canonical(input.approvedContext);
  const violations: string[] = [];
  const urls = input.answer.match(/https?:\/\/[^\s)\]}>,]+/gi) || [];
  for (const url of urls) {
    const clean = url.replace(/[.;!?]+$/, "");
    if (!input.approvedContext.includes(clean)) violations.push(`UNAPPROVED_URL:${clean}`);
  }
  const numericClaims = input.answer.match(/(?:(?:₹|\brs\.?|\binr\b|\$)\s*)?\d[\d,]*(?:\.\d+)?(?:\s*%|\s*(?:minutes?|hours?|days?|weeks?|months?|years?))?/gi) || [];
  for (const claim of numericClaims) {
    const normalized = canonical(claim);
    if (normalized && !context.includes(normalized)) violations.push(`UNSUPPORTED_NUMBER:${claim.trim()}`);
  }
  if (!input.connectorVerified && /\b(your|the)\s+(booking|appointment|reservation|order|payment|refund)\s+(is|has been|was)\s+(confirmed|completed|successful|placed|processed|refunded)\b/i.test(input.answer)) {
    violations.push("UNVERIFIED_ACTION_COMPLETION");
  }
  if (!input.connectorVerified && /\b(room|slot|table|item|product)\b.{0,30}\b(is|are)\s+(available|free|in stock)\b/i.test(input.answer)) {
    violations.push("UNVERIFIED_LIVE_AVAILABILITY");
  }
  violations.push(...unsupportedEntitlements(input.answer, input.approvedContext));
  return violations.length ? { valid: false, violations: [...new Set(violations)] } : { valid: true, violations: [] };
}
