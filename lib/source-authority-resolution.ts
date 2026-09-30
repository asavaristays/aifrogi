export type AuthorityCandidate = { sourceId: string; versionId: string; authorityRank: number; effectiveAt: string; valueDigest: string };

export function resolveSourceAuthority(candidates: AuthorityCandidate[], behavior: "FAIL_CLOSED" | "AUTHORITY_ORDER" | "DISCLOSE_AND_HANDOVER") {
  if (!candidates.length) return { disposition: "NO_EVIDENCE" as const, selected: null, conflicts: [] as AuthorityCandidate[] };
  const ordered = [...candidates].sort((a, b) => a.authorityRank - b.authorityRank || Date.parse(b.effectiveAt) - Date.parse(a.effectiveAt) || a.sourceId.localeCompare(b.sourceId));
  const values = new Set(ordered.map((item) => item.valueDigest));
  if (values.size === 1) return { disposition: "ANSWER" as const, selected: ordered[0], conflicts: [] };
  if (behavior === "AUTHORITY_ORDER" && ordered[0].authorityRank < ordered[1].authorityRank) return { disposition: "ANSWER" as const, selected: ordered[0], conflicts: ordered.slice(1) };
  if (behavior === "DISCLOSE_AND_HANDOVER") return { disposition: "HANDOVER" as const, selected: null, conflicts: ordered };
  return { disposition: "BLOCK" as const, selected: null, conflicts: ordered };
}
