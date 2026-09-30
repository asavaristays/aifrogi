/**
 * Machine-enforced response boundary shared by every configured bot.
 *
 * This is intentionally deterministic. It runs after model generation and
 * before exact-answer evidence binding, so the bytes validated are the bytes
 * offered to the delivery provider.
 */
export const BOT_CONSTITUTION_VERSION = "1.1";

const OPTIONAL_SALES_FOLLOW_UP = /(?:\s|^)(?:would you like|do you want|shall i|can i (?:also )?(?:share|provide|help|explain|show|tell))[^?]*\?\s*$/i;

export function enforceConstitutionalAnswerStyle(answer: string) {
  const normalized = answer.replace(/\r\n/g, "\n").trim();
  if (!normalized) return normalized;

  // A complete factual answer must not be converted into an unsolicited sales
  // exchange. Explicit transactional and handover flows are handled before the
  // factual generation path and are therefore unaffected by this rule.
  return normalized.replace(OPTIONAL_SALES_FOLLOW_UP, "").trim();
}

export function formatOfficeLocations(locations: string[]) {
  const unique = [...new Set(locations.map((value) => value.trim()).filter(Boolean))];
  if (!unique.length) return null;
  return `The offices are located at:\n${unique.join(" · ")}`;
}
