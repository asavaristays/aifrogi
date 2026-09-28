import { expandKnowledgeQuestion, knowledgeConcepts, knowledgeTokens } from "@/lib/sovereign-intelligence/knowledge-language";

export type RankedAnswerPage = {
  url: string;
  title: string;
  bucket: string;
  text: string;
  score: number;
};

export type AnswerReplayTrace = {
  retrievalQuestion: string;
  contextSourceUrls: string[];
  contextChars: number;
  proposedAnswer?: string;
  finalAnswer?: string;
  validatorViolations: string[];
  groundingReview?: { supported: boolean; complete: boolean; issues: string[] };
};

const SEPARATOR = "\n\n---\n\n";

function pageChunk(page: RankedAnswerPage) {
  return [`Source: ${page.title}`, `URL: ${page.url}`, `Bucket: ${page.bucket}`, page.text].join("\n");
}

export function selectRelevantPassages(text: string, question: string, maxChars = 3200) {
  if (text.length <= maxChars) return text;
  // Keep contiguous source windows: the answer verifier can match exact quotes
  // back to the captured page, including evidence near the end of a long page.
  const windows: Array<{ start: number; text: string; score: number }> = [];
  const terms = [...new Set(knowledgeTokens(expandKnowledgeQuestion(question)))];
  for (let start = 0; start < text.length; start += 750) {
    const value = text.slice(start, start + 1000);
    const lower = value.toLowerCase();
    windows.push({ start, text: value, score: terms.reduce((total, term) => total + Number(lower.includes(term)), 0) });
  }
  const selected = new Set<number>();
  for (const concept of knowledgeConcepts(question)) {
    const words = knowledgeTokens(concept);
    const best = [...windows].sort((a, b) => words.filter((word) => b.text.toLowerCase().includes(word)).length - words.filter((word) => a.text.toLowerCase().includes(word)).length)[0];
    if (best && words.some((word) => best.text.toLowerCase().includes(word))) selected.add(best.start);
  }
  for (const window of [...windows].sort((a, b) => b.score - a.score)) selected.add(window.start);
  const excerpts: string[] = [];
  let used = 0;
  for (const start of selected) {
    const window = windows.find((item) => item.start === start)!;
    if (used + window.text.length + 5 > maxChars) continue;
    if (excerpts.some((value) => value.includes(window.text))) continue;
    excerpts.push(window.text);
    used += window.text.length + 5;
  }
  return excerpts.join("\n[…]\n");
}

export function assembleAnswerContext(input: {
  retrievalQuestion: string;
  rankedPages: RankedAnswerPage[];
  explicitEntityContext?: string;
  explicitEntitySourceUrl?: string;
  maxChars: number;
}) {
  const selectedSourceUrls: string[] = [];
  const chunks: string[] = [];
  let used = 0;
  const append = (value: string, sourceUrl?: string, allowTruncate = false) => {
    if (!value.trim()) return false;
    const separatorLength = chunks.length ? SEPARATOR.length : 0;
    const available = input.maxChars - used - separatorLength;
    if (available <= 0) return false;
    const next = value.length <= available ? value : allowTruncate ? value.slice(0, available) : "";
    if (!next) return false;
    chunks.push(next);
    used += separatorLength + next.length;
    if (sourceUrl && !selectedSourceUrls.includes(sourceUrl)) selectedSourceUrls.push(sourceUrl);
    return true;
  };

  const [primary, ...remaining] = input.rankedPages;
  const sourceCount = input.rankedPages.length + Number(Boolean(input.explicitEntityContext));
  const pageBudget = Math.max(1, Math.floor((input.maxChars - SEPARATOR.length * Math.max(0, sourceCount - 1)) / Math.max(1, sourceCount)));
  if (primary) {
    const primaryBudget = sourceCount > 1 ? pageBudget : input.maxChars;
    append(pageChunk(primary).slice(0, primaryBudget), primary.url, true);
  }
  append((input.explicitEntityContext || "").slice(0, pageBudget), input.explicitEntitySourceUrl, true);
  for (const page of remaining) append(pageChunk(page).slice(0, pageBudget), page.url, true);

  const context = chunks.join(SEPARATOR);
  return {
    context,
    sourceUrls: selectedSourceUrls,
    trace: {
      retrievalQuestion: input.retrievalQuestion,
      contextSourceUrls: selectedSourceUrls,
      contextChars: context.length,
      validatorViolations: []
    } satisfies AnswerReplayTrace
  };
}
