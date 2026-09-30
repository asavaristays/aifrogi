export type ClaimValidation = { valid: true; violations: [] } | { valid: false; violations: string[] };
export type MaterialClaimDecision = { claim: string; supported: boolean; matchedTerms: string[]; missingNumbers: string[] };

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
  // Catch categorical permission and its negation, even without a number. The
  // independent evidence review covers the remaining free-form assertions.
  const petClaim = /\b(?:pets?|dogs?|cats?)\b.{0,35}\b(?:welcome|allowed|permitted|accepted)\b|\bpet[- ]friendly\b/i;
  const deniesPets = /\b(?:no pets|pets? (?:are )?(?:not|never) (?:allowed|welcome|permitted)|not pet[- ]friendly)\b/i;
  if (petClaim.test(input.answer) && !/\b(?:can.t|cannot|unable to|not able to)\s+confirm|\b(?:check|confirm|ask)\b.{0,35}\b(?:whether|if)\b/i.test(input.answer)) {
    const supportsPets = input.approvedContext.split(/(?<=[.!?])\s+|\n/).some((sentence) => petClaim.test(sentence) && deniesPets.test(sentence) === deniesPets.test(input.answer));
    if (!supportsPets) violations.push("UNSUPPORTED_PET_POLICY");
  }
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
  const unconditionalCompletionText = input.answer
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => !/\b(?:if|after|once|when|upon|before)\b/i.test(sentence))
    .join(" ");
  if (!input.connectorVerified && /\b(your|the)\s+(booking|appointment|reservation|order|payment|refund)\s+(is|has been|was)\s+(confirmed|completed|successful|placed|processed|refunded)\b/i.test(unconditionalCompletionText)) {
    violations.push("UNVERIFIED_ACTION_COMPLETION");
  }
  if (!input.connectorVerified && /\b(room|slot|table|item|product)\b.{0,30}\b(is|are)\s+(available|free|in stock)\b/i.test(input.answer)) {
    violations.push("UNVERIFIED_LIVE_AVAILABILITY");
  }
  violations.push(...unsupportedEntitlements(input.answer, input.approvedContext));
  return violations.length ? { valid: false, violations: [...new Set(violations)] } : { valid: true, violations: [] };
}

const claimStopWords = new Set(["about","after","again","also","and","are","because","been","before","being","but","can","could","for","from","have","here","into","its","may","more","not","our","please","that","the","their","there","these","they","this","through","to","was","we","were","will","with","would","you","your"]);

function claimTerms(value: string) {
  return [...new Set((value.toLowerCase().match(/[a-z0-9@.+-]+/g) || []).filter(term => term.length >= 3 && !claimStopWords.has(term)))];
}

export function validateMaterialClaimCoverage(input: { answer: string; evidenceUnits: string[] }) {
  const evidence = canonical(input.evidenceUnits.join("\n"));
  const decisions: MaterialClaimDecision[] = [];
  for (const raw of input.answer.split(/(?<=[.!?])\s+|\n+/)) {
    const claim = raw.trim();
    if (claim.length < 12) continue;
    const terms = claimTerms(claim);
    const numbers = claim.match(/\d[\d,.]*(?:\s*%|\s*(?:minutes?|hours?|days?|weeks?|months?|years?))?/gi) || [];
    const factualShape = numbers.length > 0 || /\b(?:is|are|has|have|offers?|provides?|located|founded|serves?|speciali[sz]es?|works?|supports?|contact|email|phone|address)\b/i.test(claim);
    if (!factualShape) continue;
    const matchedTerms = terms.filter(term => evidence.includes(canonical(term)));
    const missingNumbers = numbers.filter(number => !evidence.includes(canonical(number)));
    const supported = missingNumbers.length === 0 && terms.length >= 2 && matchedTerms.length / terms.length >= 0.5;
    decisions.push({ claim, supported, matchedTerms, missingNumbers });
  }
  return { valid: decisions.length > 0 && decisions.every(decision => decision.supported), decisions };
}
