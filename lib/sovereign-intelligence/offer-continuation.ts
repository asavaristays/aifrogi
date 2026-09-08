export const isShortAffirmative = (value: string) => /^(yes|yes please|sure|ok|okay|please do|go ahead)[.!\s]*$/i.test(value.trim());

/** An assistant's link is never authority: re-check it against selected approved claims. */
export function approvedOfferLinks(input: {
  question: string;
  lastAssistantAnswer: string;
  contextUsed: boolean;
  candidates: Array<{ claimId: string; answer?: string; status: string; selected: boolean }>;
}) {
  if (!isShortAffirmative(input.question) || !input.contextUsed) return [];
  const urls = (value: string) => (value.match(/https?:\/\/[^\s<>"\]]+/g) || []).map((url) => url.replace(/[.,;!?)]*$/, ""));
  const offered = new Set(urls(input.lastAssistantAnswer));
  return input.candidates.filter((claim) => claim.selected && claim.status === "PUBLISHED").flatMap((claim) =>
    urls(claim.answer || "").filter((url) => offered.has(url)).map((url) => ({ url, claimId: claim.claimId }))
  );
}
