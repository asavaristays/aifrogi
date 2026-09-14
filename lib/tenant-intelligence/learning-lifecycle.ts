import { createHash } from "node:crypto";

export type LearningPage = { url: string; title: string; text: string };
export type LearningFact = { field: string; value: string; sourceUrl?: string };

export type TenantKnowledgeChangeSet = {
  status: "INITIAL" | "UNCHANGED" | "CHANGED";
  detectedAt: string;
  previousCrawledAt: string | null;
  addedPages: string[];
  removedPages: string[];
  changedPages: string[];
  addedFacts: string[];
  removedFacts: string[];
  requiresReview: boolean;
};

export type TenantLearningTopic = {
  id: string;
  title: string;
  suggestedQuestion: string;
  occurrenceCount: number;
  questionCount: number;
  gapIds: string[];
  exampleQuestions: string[];
  lastAskedAt: string;
  status: "DRAFT_REVIEW";
};

const STOP = new Set(["a", "an", "and", "are", "can", "could", "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "of", "on", "our", "please", "tell", "that", "the", "their", "there", "this", "to", "we", "what", "when", "where", "which", "with", "you", "your"]);

function clean(value: string) { return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function terms(value: string) { return [...new Set(clean(value).split(" ").filter((term) => term.length > 2 && !STOP.has(term)))]; }
function fingerprint(value: string) { return createHash("sha256").update(clean(value)).digest("hex"); }
function factKey(fact: LearningFact) { return `${clean(fact.field)}=${clean(fact.value)}@${fact.sourceUrl || ""}`; }

export function buildTenantKnowledgeChangeSet(
  previous: { pages: LearningPage[]; structuredFacts?: LearningFact[]; crawledAt: string } | null,
  current: { pages: LearningPage[]; structuredFacts?: LearningFact[]; crawledAt: string }
): TenantKnowledgeChangeSet {
  if (!previous) return { status: "INITIAL", detectedAt: current.crawledAt, previousCrawledAt: null, addedPages: current.pages.map((page) => page.url), removedPages: [], changedPages: [], addedFacts: (current.structuredFacts || []).map(factKey), removedFacts: [], requiresReview: false };
  const beforePages = new Map(previous.pages.map((page) => [page.url, fingerprint(`${page.title}\n${page.text}`)]));
  const afterPages = new Map(current.pages.map((page) => [page.url, fingerprint(`${page.title}\n${page.text}`)]));
  const addedPages = [...afterPages.keys()].filter((url) => !beforePages.has(url));
  const removedPages = [...beforePages.keys()].filter((url) => !afterPages.has(url));
  const changedPages = [...afterPages].filter(([url, hash]) => beforePages.has(url) && beforePages.get(url) !== hash).map(([url]) => url);
  const beforeFacts = new Set((previous.structuredFacts || []).map(factKey));
  const afterFacts = new Set((current.structuredFacts || []).map(factKey));
  const addedFacts = [...afterFacts].filter((fact) => !beforeFacts.has(fact));
  const removedFacts = [...beforeFacts].filter((fact) => !afterFacts.has(fact));
  const changed = Boolean(addedPages.length || removedPages.length || changedPages.length || addedFacts.length || removedFacts.length);
  return { status: changed ? "CHANGED" : "UNCHANGED", detectedAt: current.crawledAt, previousCrawledAt: previous.crawledAt, addedPages, removedPages, changedPages, addedFacts, removedFacts, requiresReview: changed };
}

export function tenantKnowledgeFreshness(lastCrawledAt: string | null, refreshHours: number, now = new Date()) {
  if (!lastCrawledAt || !Number.isFinite(Date.parse(lastCrawledAt))) return { status: "DUE" as const, nextRefreshAt: null, ageHours: null };
  const ageMs = Math.max(0, now.getTime() - Date.parse(lastCrawledAt));
  const dueMs = Math.max(1, refreshHours) * 3_600_000;
  return { status: ageMs >= dueMs ? "DUE" as const : "CURRENT" as const, nextRefreshAt: new Date(Date.parse(lastCrawledAt) + dueMs).toISOString(), ageHours: Math.round(ageMs / 36_000) / 100 };
}

export function groupTenantKnowledgeGaps(gaps: Array<{ id: string; question: string; occurrenceCount: number; lastAskedAt: string | Date }>): TenantLearningTopic[] {
  const groups: Array<{ keys: Set<string>; gaps: typeof gaps }> = [];
  for (const gap of gaps) {
    const keys = new Set(terms(gap.question));
    const match = groups.find((group) => {
      const overlap = [...keys].filter((term) => group.keys.has(term)).length;
      return overlap >= 2 && overlap / Math.max(1, Math.min(keys.size, group.keys.size)) >= 0.6;
    });
    if (match) { match.gaps.push(gap); keys.forEach((key) => match.keys.add(key)); }
    else groups.push({ keys, gaps: [gap] });
  }
  return groups.map((group) => {
    const sorted = [...group.gaps].sort((a, b) => b.occurrenceCount - a.occurrenceCount);
    const latest = new Date(Math.max(...group.gaps.map((gap) => new Date(gap.lastAskedAt).getTime()))).toISOString();
    const titleTerms = [...group.keys].slice(0, 5);
    const title = titleTerms.length ? titleTerms.map((term) => term[0].toUpperCase() + term.slice(1)).join(" · ") : "Customer question";
    return { id: fingerprint(group.gaps.map((gap) => gap.id).sort().join("|" )).slice(0, 16), title, suggestedQuestion: sorted[0].question, occurrenceCount: group.gaps.reduce((sum, gap) => sum + gap.occurrenceCount, 0), questionCount: group.gaps.length, gapIds: group.gaps.map((gap) => gap.id), exampleQuestions: sorted.slice(0, 3).map((gap) => gap.question), lastAskedAt: latest, status: "DRAFT_REVIEW" as const };
  }).sort((a, b) => b.occurrenceCount - a.occurrenceCount || Date.parse(b.lastAskedAt) - Date.parse(a.lastAskedAt));
}
