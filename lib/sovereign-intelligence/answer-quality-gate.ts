import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";

export const ANSWER_QUALITY_GATE_VERSION = "1.0" as const;

const INTERNAL_LANGUAGE = /\b(?:approved questions?|approved knowledge|approved information|approved sources?|knowledge gap|review dataset|governance|retrieval|confidence score|system prompt|language model|asynchronous aifrogi review)\b/i;
const ROBOTIC_DEFLECTION = /\b(?:please restate the business topic|i retain this conversation|i can answer approved questions|temporarily unable to generate a verified answer)\b/i;
const PREMATURE_QUALIFICATION = /\b(?:approximate budget range|what is your budget|share your (?:name and )?(?:mobile|phone) number)\b/i;
const COMMERCIAL_INTENT = /\b(?:book|booking|buy|purchase|price|pricing|quote|quotation|proposal|estimate|availability|available|call back|callback|contact me|interested|requirement)\b/i;

export type AnswerQualityResult = {
  version: typeof ANSWER_QUALITY_GATE_VERSION;
  passed: boolean;
  reasons: string[];
};

export function evaluateVisitorAnswerQuality(input: {
  question: string;
  answer: string;
  decision: Pick<SovereignDecision, "intent" | "disposition">;
}): AnswerQualityResult {
  const answer = input.answer.replace(/\s+/g, " ").trim();
  const reasons: string[] = [];
  if (!answer) reasons.push("EMPTY_ANSWER");
  if (answer.length > 1800) reasons.push("EXCESSIVE_LENGTH");
  if (INTERNAL_LANGUAGE.test(answer)) reasons.push("INTERNAL_LANGUAGE");
  if (ROBOTIC_DEFLECTION.test(answer)) reasons.push("ROBOTIC_DEFLECTION");
  if (input.decision.disposition === "ANSWER" && !COMMERCIAL_INTENT.test(input.question) && PREMATURE_QUALIFICATION.test(answer)) reasons.push("PREMATURE_QUALIFICATION");
  if (/\b([\p{L}\p{N}][\p{L}\p{N} '&.-]{2,40})\b\s+\1\b/iu.test(answer)) reasons.push("DUPLICATED_PHRASE");
  return { version: ANSWER_QUALITY_GATE_VERSION, passed: reasons.length === 0, reasons };
}

export function buildMissingAnswerRecovery(input: {
  businessName: string;
  category?: string | null;
  publicPhone?: string | null;
  handoffEnabled: boolean;
}) {
  const team = input.category === "PINGBOOK" ? "clinic reception"
    : input.category === "STAY" ? "reservations team"
      : input.category === "EDUCATION" ? "admissions team"
        : input.category === "REAL_ESTATE" ? "property team"
          : "business team";
  const phone = input.publicPhone ? ` You can also call ${input.publicPhone}.` : "";
  if (!input.handoffEnabled) return `I don’t have enough verified ${input.businessName} information to answer that accurately.${phone || " Please use the business’s published contact details."}`;
  return `I don’t have enough verified ${input.businessName} information to answer that accurately. I’ve sent your question to the ${team}. If you would like a callback, share your name and mobile number using the private consent fields below.${phone}`;
}
