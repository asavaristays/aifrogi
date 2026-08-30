export const KB_FRAMEWORK_VERSION = "1.0" as const;
export const KB_MINIMUM_COVERAGE = 80;
export const KB_FRESHNESS_TARGET = 95;

export type AtomicClaimInput = {
  question: string;
  answer: string;
  category: string;
  claimType?: string;
  valueType?: string;
  currency?: string | null;
  effectiveAt?: Date | null;
  expiresAt?: Date | null;
  refreshDays?: number;
};

export const CATEGORY_QUESTION_BANK: Record<string, string[]> = {
  BUSINESS_AI: ["What services do you provide?", "Who is the service for?", "How does a project start?", "What information is needed?", "What does the service cost?", "How long does delivery take?", "What support is available?", "How can I contact the team?", "What cannot the bot confirm?", "How is customer data handled?"],
  HOSPITALITY: ["What rooms are available?", "What are the room rates?", "What is included?", "What is the cancellation policy?", "What are check-in and check-out times?", "Are children or extra guests allowed?", "What amenities are available?", "How do I make a booking?", "How do I modify a reservation?", "How do I contact the property?"],
  APPOINTMENTS: ["What services can I book?", "Who provides each service?", "What are the consultation fees?", "What are the opening hours?", "How do I book an appointment?", "How do I reschedule or cancel?", "What preparation is required?", "What is the late-arrival policy?", "Which requests need a human?", "How is personal information handled?"],
  RESTAURANT: ["What is on the menu?", "What are the prices?", "What allergens are present?", "What are the opening hours?", "How do I reserve a table?", "What is the cancellation policy?", "Do you accept event bookings?", "What payment methods are accepted?", "Is delivery available?", "How do I contact the restaurant?"],
  EDUCATION: ["Which courses are available?", "Who is eligible?", "What are the fees?", "What are the class dates and timings?", "How do I apply?", "Which documents are required?", "What is the refund policy?", "How are minors and guardian data protected?", "What support is provided?", "How do I contact admissions?"],
  REAL_ESTATE: ["Which properties are available?", "What are the prices?", "Where is the property located?", "What amenities are included?", "What legal information is approved?", "How do I arrange a site visit?", "What payment schedule applies?", "Which documents are required?", "Who handles the enquiry?", "How do I contact the team?"],
  COMMERCE: ["Which products are available?", "What are the prices?", "Is the item in stock?", "What are the delivery options?", "What is the return policy?", "What is the refund policy?", "Which payment methods are accepted?", "How do I place an order?", "How do I track an order?", "How do I contact support?"],
  CUSTOM: ["What does the business provide?", "Who is the service for?", "What does it cost?", "What information is required?", "How does the customer begin?", "What policies apply?", "What can the bot confirm?", "What requires human approval?", "How is customer data handled?", "How can the team be contacted?"]
};

export function normalizeClaimKey(category: string, question: string) {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  return `${category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "general"}:${normalized}`;
}

export function validateAtomicClaim(input: AtomicClaimInput) {
  const errors: string[] = [];
  const question = input.question.trim();
  const answer = input.answer.trim();
  const claimType = (input.claimType || "FACT").toUpperCase();
  const valueType = (input.valueType || "TEXT").toUpperCase();
  if (question.length < 4) errors.push("QUESTION_REQUIRED");
  if (answer.length < 8) errors.push("ANSWER_REQUIRED");
  if (answer.length > 5000) errors.push("ANSWER_TOO_LONG");
  if (/\.{3}$|\b(?:tbd|to be confirmed|unknown)\b/i.test(answer)) errors.push("INCOMPLETE_VALUE");
  if (["PRICE", "FEE", "RATE"].includes(claimType) && !input.currency?.trim()) errors.push("CURRENCY_REQUIRED");
  if (valueType === "NUMBER" && !/\d/.test(answer)) errors.push("NUMBER_REQUIRED");
  if (input.effectiveAt && Number.isNaN(input.effectiveAt.getTime())) errors.push("INVALID_EFFECTIVE_DATE");
  if (input.expiresAt && Number.isNaN(input.expiresAt.getTime())) errors.push("INVALID_EXPIRY_DATE");
  if (input.effectiveAt && input.expiresAt && input.expiresAt <= input.effectiveAt) errors.push("EXPIRY_MUST_FOLLOW_EFFECTIVE_DATE");
  const refreshDays = input.refreshDays ?? 90;
  if (!Number.isInteger(refreshDays) || refreshDays < 1 || refreshDays > 365) errors.push("INVALID_REFRESH_CADENCE");
  return { valid: errors.length === 0, errors, claimKey: normalizeClaimKey(input.category, question) };
}

function terms(value: string) {
  const stop = new Set(["what", "which", "when", "where", "does", "each", "your", "available", "about", "with", "have", "this", "that"]);
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stop.has(term)));
}

export function claimCoversQuestion(claim: { question: string; answer: string; category: string }, expectedQuestion: string) {
  const expected = terms(expectedQuestion);
  const content = terms(`${claim.question} ${claim.answer} ${claim.category}`);
  if (!expected.size) return false;
  return [...expected].filter((term) => content.has(term)).length / expected.size >= 0.34;
}

export function calculateCoverage(category: string, claims: Array<{ question: string; answer: string; category: string }>) {
  const bank = CATEGORY_QUESTION_BANK[category] || CATEGORY_QUESTION_BANK.CUSTOM;
  const covered = bank.filter((question) => claims.some((claim) => claimCoversQuestion(claim, question)));
  const missing = bank.filter((question) => !covered.includes(question));
  const percentage = bank.length ? Math.round((covered.length / bank.length) * 100) : 0;
  return { category, total: bank.length, covered: covered.length, percentage, ready: percentage >= KB_MINIMUM_COVERAGE, missing };
}
