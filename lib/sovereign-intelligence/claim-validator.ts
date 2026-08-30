export type ClaimValidation = { valid: true; violations: [] } | { valid: false; violations: string[] };

function canonical(value: string) {
  return value.toLowerCase().replace(/,/g, "").replace(/\s+/g, " ").replace(/₹\s*/g, "₹").trim();
}

export function validateGeneratedClaims(input: { answer: string; approvedContext: string; connectorVerified?: boolean }): ClaimValidation {
  const context = canonical(input.approvedContext);
  const violations: string[] = [];
  const urls = input.answer.match(/https?:\/\/[^\s)\]}>,]+/gi) || [];
  for (const url of urls) {
    const clean = url.replace(/[.;!?]+$/, "");
    if (!input.approvedContext.includes(clean)) violations.push(`UNAPPROVED_URL:${clean}`);
  }
  const numericClaims = input.answer.match(/(?:₹|rs\.?|inr|\$)?\s*\d[\d,]*(?:\.\d+)?(?:\s*%|\s*(?:minutes?|hours?|days?|weeks?|months?|years?))?/gi) || [];
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
  return violations.length ? { valid: false, violations: [...new Set(violations)] } : { valid: true, violations: [] };
}
