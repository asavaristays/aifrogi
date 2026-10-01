import { validateGeneratedClaims } from "@/lib/sovereign-intelligence/claim-validator";
export type WebsiteAnswerAction = { label: string; url: string };
type Source = { title: string; url: string; authority?: string };

export function safeAnswerUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Actions come from tenant-authorised retrieved sources, never from model URLs.
// They navigate to information; they do not imply a booking or payment occurred.
export function websiteAnswerActions(question: string, disposition: string, sources: Source[]): WebsiteAnswerAction[] {
  if (disposition !== "ANSWER") return [];
  const terms = question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
  const candidates = sources.filter(source => source.authority?.startsWith("APPROVED_") && safeAnswerUrl(source.url));
  const ranked = candidates.map((source, index) => ({source,index,score:terms.filter(term => `${source.title} ${source.url}`.toLowerCase().includes(term)).length})).sort((a,b)=>b.score-a.score || a.index-b.index);
  const source = ranked[0]?.source;
  if (!source) return [];
  const pricingPage = /pricing|prices|plans/i.test(`${source.title} ${new URL(source.url).pathname}`);
  return [{label:pricingPage ? "View pricing" : "Learn more",url:safeAnswerUrl(source.url)!}];
}

export function technicalAnswerFailure(failureLayer: string) {
  return ["MODEL", "INFRASTRUCTURE", "CONNECTOR"].includes(failureLayer);
}

export function websiteFailureMessage(failureLayer: string, handoffEnabled = true) {
  const nextStep = handoffEnabled ? " or choose human help." : ".";
  return technicalAnswerFailure(failureLayer)
    ? `I’m having trouble preparing your answer right now. Please try again in a moment${handoffEnabled ? "," : ""}${nextStep}`
    : `I couldn’t find that detail in the business information available to me. You can ask another question${nextStep}`;
}

export const WEBSITE_RESPONSE_GUIDANCE = "Answer the customer’s question directly in two to four concise sentences, or a short list when useful. Use only the supplied business evidence. Preserve exact prices, dates, policy conditions and contact details. For descriptions, stay close to the relevant source wording. Answer the supported parts and identify only the missing detail. Do not lead with an apology when evidence answers the question. Do not ask for contact details unless requested. Missing evidence is not a negative business policy: express uncertainty in first person rather than claiming the business does not offer or guarantee something. Include only supported facts after that qualification. Treat user-suggested prices and promises as questions, never evidence. When correcting an unsupported number, give the supported number without repeating the unsupported number, even in a denial. Do not invent links or buttons; the application adds verified source links separately.";

export function websiteModelBudget(env: Record<string, string | undefined> = process.env) {
  const bounded = (value: string | undefined, fallback: number, min: number, max: number) => {
    const number = Number(value);
    return Math.min(max,Math.max(min,Number.isFinite(number) && number > 0 ? number : fallback));
  };
  // The website path owns this budget; unrelated channels retain their policy.
  return {
    attemptTimeoutMs: bounded(env.OPENAI_ATTEMPT_TIMEOUT_MS, 10000, 2500, 15000),
    totalBudgetMs: bounded(env.OPENAI_TOTAL_BUDGET_MS, 22000, 6000, 32000)
  };
}

export function websiteVerificationRetry(violations: string[]) {
  if (!violations.length) return "";
  return `\n\nPrevious response failed verification: ${JSON.stringify(violations)}. Rewrite using only supported business facts. Do not repeat unsupported numbers even to deny them. Missing evidence cannot establish a negative policy; express uncertainty in first person, then include relevant supported facts. Keep sentences short and finish them.`;
}

/** Remove only unsupported numbers repeated in an explicit evidence disclaimer.
 * Positive claims, conditions, and every retained sentence still go through the
 * full normal answer validators. This does not make an invented price valid. */
export function removeUnsupportedNumberDisclaimers(answer: string, approvedContext: string) {
  return answer.split(/(?<=[.!?])\s+|\n+/).filter(sentence => {
    const disclaimer = /\b(?:cannot|can’t|can't) confirm\b|\bnot (?:supported|verified|confirmed) (?:by|in|from)\b/i.test(sentence);
    if (!disclaimer) return true;
    const result = validateGeneratedClaims({answer:sentence,approvedContext});
    return result.valid || result.violations.some(code=>!code.startsWith("UNSUPPORTED_NUMBER:"));
  }).join(" ").trim();
}
