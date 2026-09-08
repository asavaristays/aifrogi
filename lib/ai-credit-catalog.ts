export const AI_CREDIT_PACKS = [
  { code: "AI_CREDITS_500", name: "Small", credits: 500, amountPaisa: 39900 },
  { code: "AI_CREDITS_1500", name: "Growth", credits: 1500, amountPaisa: 99900 },
  { code: "AI_CREDITS_5000", name: "Business", credits: 5000, amountPaisa: 299900 }
] as const;

export type AiCreditPackCode = typeof AI_CREDIT_PACKS[number]["code"];

export function findAiCreditPack(code: string) {
  return AI_CREDIT_PACKS.find(pack => pack.code === code);
}
