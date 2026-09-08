export const LEAD_QUALIFICATION_VERSION = "1.0";

export type QualificationField = "need" | "timeline" | "budget" | "location" | "decisionRole" | "contact";
export type QualificationStatus = "IDLE" | "COLLECTING" | "QUALIFIED" | "HANDOFF_READY";

export type LeadQualificationState = {
  version: string;
  status: QualificationStatus;
  active: boolean;
  score: number;
  tier: "COLD" | "WARM" | "HOT";
  facts: Partial<Record<QualificationField, string>>;
  asked: Partial<Record<QualificationField, number>>;
  nextField: QualificationField | null;
  progress: number;
  contactEligible: boolean;
  recommendedAction: "CONTINUE_QUALIFICATION" | "REVIEW_LEAD" | "PRIORITY_FOLLOW_UP";
};

const activationTerms = [
  "quote", "quotation", "price", "pricing", "cost", "project", "proposal", "consultation",
  "interested", "need", "want", "looking for", "hire", "start", "book", "demo", "callback"
];

const needPatterns: Array<[RegExp, string]> = [
  [/\b(ai bot|chatbot|business bot|customer support bot)\b/i, "AI Business Bot"],
  [/\b(website|web site|landing page|web development)\b/i, "Website development"],
  [/\b(seo|search engine|google ranking)\b/i, "SEO and online visibility"],
  [/\b(automation|automate|workflow)\b/i, "Business automation"],
  [/\b(training|workshop|course)\b/i, "AI training"],
  [/\b(video|film|reel|animation)\b/i, "AI film or video"],
  [/\b(booking|appointment|reservation)\b/i, "Booking workflow"]
];

const questions: Record<QualificationField, string> = {
  need: "What outcome or service would you like help with?",
  timeline: "When would you ideally like to start or complete this?",
  budget: "Do you have an approximate budget range? You may say ‘not decided’.",
  location: "Which city or market is this project for?",
  decisionRole: "Are you the decision-maker, or are other team members involved?",
  contact: "To connect you with the business team, please share your name and mobile number using the consent fields below."
};

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

function firstMatch(messages: string[], expression: RegExp) {
  for (const message of [...messages].reverse()) {
    const match = message.match(expression);
    if (match?.[1]) return clean(match[1]);
  }
  return undefined;
}

function extractFacts(messages: string[], existing: LeadQualificationState["facts"], contact?: string) {
  const facts = { ...existing };
  const joined = messages.join("\n");
  if (!facts.need) {
    for (const [pattern, label] of needPatterns) if (pattern.test(joined)) { facts.need = label; break; }
  }
  facts.timeline ||= firstMatch(messages, /(?:timeline|start|complete|launch|needed|require(?:d)?)[\s:,-]*(?:is|by|within)?\s*([^.!?\n]{2,60})/i)
    || firstMatch(messages, /\b(today|immediately|urgent|this week|next week|this month|next month|within \d+ (?:day|days|week|weeks|month|months)|not decided)\b/i);
  facts.budget ||= firstMatch(messages, /(?:budget|spend|investment)[\s:,-]*(?:is|around|about|of)?\s*([^.!?\n]{2,60})/i)
    || firstMatch(messages, /((?:₹|rs\.?|inr)\s*[\d,.]+(?:\s*(?:k|lakh|lakhs|crore))?|\bnot decided\b)/i);
  facts.location ||= firstMatch(messages, /(?:location|city|market|based in|business in|project in)[\s:,-]*([^.!?\n]{2,60})/i);
  if (!facts.decisionRole) {
    if (/\b(i am|i'm|im)\s+(?:the\s+)?(owner|founder|director|decision[- ]?maker)\b/i.test(joined)) facts.decisionRole = "Decision-maker";
    else if (/\b(my|our)\s+(team|partner|manager|director|client)\b/i.test(joined)) facts.decisionRole = "Team decision";
  }
  if (contact) facts.contact = clean(contact);
  return facts;
}

function previousQualification(value: unknown): LeadQualificationState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = "qualification" in value ? (value as { qualification?: unknown }).qualification : value;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const state = candidate as Partial<LeadQualificationState>;
  if (state.version !== LEAD_QUALIFICATION_VERSION || !state.facts || !state.asked) return null;
  return state as LeadQualificationState;
}

export function qualifyLeadConversation(input: {
  messages: string[];
  previousState?: unknown;
  contact?: string;
  enabled: boolean;
}) {
  const previous = previousQualification(input.previousState);
  const joined = input.messages.join(" ").toLowerCase();
  const active = input.enabled && Boolean(previous?.active || activationTerms.some((term) => joined.includes(term)));
  if (!active) return { state: null, prompt: null };

  const facts = extractFacts(input.messages, previous?.facts || {}, input.contact);
  const weights: Record<QualificationField, number> = { need: 30, timeline: 20, budget: 15, location: 10, decisionRole: 10, contact: 15 };
  const score = (Object.keys(weights) as QualificationField[]).reduce((total, field) => total + (facts[field] ? weights[field] : 0), 0);
  const coreQualified = Boolean(facts.need && facts.timeline && facts.budget);
  const status: QualificationStatus = coreQualified && facts.contact ? "HANDOFF_READY" : coreQualified ? "QUALIFIED" : "COLLECTING";
  const tier = score >= 75 ? "HOT" : score >= 45 ? "WARM" : "COLD";
  const asked = { ...(previous?.asked || {}) };
  const discoveryOrder: QualificationField[] = ["need", "timeline", "budget", "location", "decisionRole"];
  const order: QualificationField[] = [...discoveryOrder, "contact"];
  const nextDiscoveryField = discoveryOrder.find((field) => !facts[field] && (asked[field] || 0) < 2) || null;
  const contactEligible = score >= 60 && Boolean(facts.need) && Boolean(facts.timeline || facts.budget);
  const nextField = nextDiscoveryField || (!facts.contact && contactEligible && (asked.contact || 0) < 2 ? "contact" : null);
  if (nextField) asked[nextField] = (asked[nextField] || 0) + 1;
  const captured = order.filter((field) => Boolean(facts[field])).length;
  const state: LeadQualificationState = {
    version: LEAD_QUALIFICATION_VERSION,
    status,
    active: true,
    score,
    tier,
    facts,
    asked,
    nextField,
    progress: Math.round((captured / order.length) * 100),
    contactEligible,
    recommendedAction: status === "HANDOFF_READY" || tier === "HOT" ? "PRIORITY_FOLLOW_UP" : status === "QUALIFIED" ? "REVIEW_LEAD" : "CONTINUE_QUALIFICATION"
  };
  return { state, prompt: nextField ? questions[nextField] : null };
}

export function appendQualificationPrompt(answer: string, prompt: string | null) {
  if (!prompt || answer.includes(prompt)) return answer;
  return `${answer.trim()}\n\n${prompt}`;
}

export function normalizeConsentedLeadPhone(value: unknown) {
  const contact = clean(String(value || ""));
  if (!contact) return null;
  const phoneDigits = contact.replace(/\D/g, "");
  const phone = /^[+\d().\s-]+$/.test(contact) && phoneDigits.length >= 7 && phoneDigits.length <= 15;
  return phone ? contact : null;
}
