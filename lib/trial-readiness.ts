/** Topic matching is a checklist aid, not a claim of semantic accuracy. */
export const TRIAL_ESSENTIALS = [
  { name: "Business identity", pattern: /\b(identity|about us|who are you|business name|company name)\b/i },
  { name: "Services or products", pattern: /\b(services?|products?|courses?|menu|offerings?)\b/i },
  { name: "Contact details", pattern: /\b(contact|phone|email|support number)\b/i },
  { name: "How to start or book", pattern: /\b(book(?:ing)?|appointment|apply|order|start|enquir(?:y|ies))\b/i },
  { name: "Human support", pattern: /\b(human|handover|escalat\w*)\b/i }
] as const;

export function trialEssentialCoverage(claims: Array<{ question: string; category: string; answer: string }>) {
  const missing = TRIAL_ESSENTIALS.filter(({ pattern }) => !claims.some((claim) =>
    claim.answer.trim().length >= 8 && pattern.test(`${claim.question} ${claim.category}`)
  )).map(({ name }) => name);
  return { covered: TRIAL_ESSENTIALS.length - missing.length, missing };
}

export function hasSafeKnowledge(state: { freshnessRate: number; conflicts: number; unsigned: number; openFlags: number; previewPending: number }) {
  return state.freshnessRate >= 95 && state.conflicts === 0 && state.unsigned === 0 && state.openFlags === 0 && state.previewPending === 0;
}
