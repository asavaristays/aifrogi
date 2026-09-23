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
};

const SEPARATOR = "\n\n---\n\n";

function pageChunk(page: RankedAnswerPage) {
  return [`Source: ${page.title}`, `URL: ${page.url}`, `Bucket: ${page.bucket}`, page.text].join("\n");
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
  if (primary) {
    const primaryBudget = input.explicitEntityContext ? Math.max(1, Math.floor(input.maxChars * 0.65)) : input.maxChars;
    append(pageChunk(primary).slice(0, primaryBudget), primary.url, true);
  }
  append(input.explicitEntityContext || "", input.explicitEntitySourceUrl, true);
  for (const page of remaining) append(pageChunk(page), page.url, false);

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
