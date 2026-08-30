import { SOVEREIGN_CONSTITUTION_VERSION } from "@/lib/sovereign-intelligence/constitution";

export type SovereignIntent = "BUSINESS" | "CONTACT_INFO" | "IDENTITY" | "GREETING" | "OFF_TOPIC" | "CONTEXT_FOLLOW_UP" | "HUMAN_REQUEST" | "SENSITIVE" | "UNKNOWN";
export type SovereignDisposition = "ANSWER" | "CLARIFY" | "REFUSE" | "ESCALATE" | "FALLBACK";

export type SovereignDecision = {
  constitutionVersion: typeof SOVEREIGN_CONSTITUTION_VERSION;
  blueprintVersion: string;
  intent: SovereignIntent;
  disposition: SovereignDisposition;
  resolvedQuestion: string;
  contextUsed: boolean;
  reason: string;
};

export function classifySovereignIntent(question: string): SovereignIntent {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)( there)?$/.test(normalized)) return "GREETING";
  if (/\b(who are you|what are you|your name|are you (a |an )?(bot|ai)|introduce yourself)\b/.test(normalized)) return "IDENTITY";
  if (/\b(human|real person|team member|agent|call me|contact me|talk to someone)\b/.test(normalized)) return "HUMAN_REQUEST";
  if (/\b(contact (details|information|number)|phone number|mobile number|telephone( number)?|email( address)?|office address|business address|share (your )?address|where (are|r) (you|u) based|where (is|s) (the )?(office|business|company)|location|opening hours|business hours|website address)\b/.test(normalized)) return "CONTACT_INFO";
  if (/\b(password|otp|one time password|card number|cvv|medical emergency|legal dispute|complaint|system prompt|developer prompt|api key|secret key|access token|all customers|all bookings|all conversations|another customer|other customers|customer before me)\b/.test(normalized)) return "SENSITIVE";
  if (/\b(you already (have|know)|already have context|as i said|as mentioned|previous question|earlier question|use the context|same question|tell me more about (it|that))\b/.test(normalized)) return "CONTEXT_FOLLOW_UP";
  if (/^(give|send|share|show|open|provide|what about|how about|and)\b.{0,45}\b(link|url|details|price|cost|date|time|slot|booking|book|register|registration|it|that|this)( please)?$/.test(normalized)) return "CONTEXT_FOLLOW_UP";
  if (/\b(weather|temperature|forecast|rain today|cricket (score|match)|football (score|match)|who won( the)? (game|match)|stock price|share price|election result|horoscope|recipe|movie showtime)\b/.test(normalized)) return "OFF_TOPIC";
  if (/\b(webtechnosys|service|website|web design|development|software|application|mobile app|ai|automation|bot|whatsapp|hotel|hospitality|channel manager|training|course|bootcamp|seo|marketing|integration|pricing|price|cost|quote|demo|consultation|build|project)\b/.test(normalized)) return "BUSINESS";
  return "UNKNOWN";
}

export function resolveSovereignQuestion(question: string, priorQuestions: string[] = [], blueprintVersion = "1.0"): SovereignDecision {
  const intent = classifySovereignIntent(question);
  if (intent !== "CONTEXT_FOLLOW_UP") return { constitutionVersion: SOVEREIGN_CONSTITUTION_VERSION, blueprintVersion, intent, disposition: intent === "OFF_TOPIC" ? "REFUSE" : intent === "HUMAN_REQUEST" || intent === "SENSITIVE" ? "ESCALATE" : "ANSWER", resolvedQuestion: question.trim(), contextUsed: false, reason: `Current message classified as ${intent}.` };
  const priorQuestion = priorQuestions.find((candidate) => classifySovereignIntent(candidate) === "BUSINESS")?.trim();
  return { constitutionVersion: SOVEREIGN_CONSTITUTION_VERSION, blueprintVersion, intent, disposition: priorQuestion ? "ANSWER" : "CLARIFY", resolvedQuestion: priorQuestion || question.trim(), contextUsed: Boolean(priorQuestion), reason: priorQuestion ? "Resolved from latest relevant business question; unrelated messages excluded." : "No relevant prior business question was available." };
}
