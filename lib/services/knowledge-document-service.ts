const MAX_EXTRACTED_CHARS = 120_000;
const MAX_STAGED_CLAIMS = 100;

export type StagedAtomicClaim = {
  question: string;
  answer: string;
  category: string;
  claimType: string;
  valueType: string;
  currency: string | null;
  refreshDays: number;
};

export const KNOWLEDGE_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json"
]);

export async function extractKnowledgeDocument(file: File) {
  if (!KNOWLEDGE_DOCUMENT_MIME_TYPES.has(file.type)) throw new Error("Upload a PDF, DOCX, TXT, Markdown, CSV, or JSON document.");
  if (!file.size || file.size > 8 * 1024 * 1024) throw new Error("Knowledge documents must be between 1 byte and 8 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.type === "application/pdf") {
    const { default: parsePdf } = await import("pdf-parse");
    const parsed = await parsePdf(buffer, { max: 50 });
    text = parsed.text || "";
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    text = parsed.value || "";
  } else {
    text = buffer.toString("utf8");
  }

  const normalized = text.replace(/\0/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_EXTRACTED_CHARS);
  if (normalized.length < 20) throw new Error("No readable text was found in this document.");
  return { content: new Uint8Array(buffer), extractedText: normalized };
}

function cleanCell(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function inferMetadata(question: string, answer: string, category = "Imported source") {
  const text = `${question} ${answer}`.toLowerCase();
  const claimType = /\b(price|fee|cost|rate|charge|amount)\b/.test(text) ? "PRICE"
    : /\b(policy|cancel|refund|return|terms)\b/.test(text) ? "POLICY"
      : /\b(hours?|timings?|time|opening|open|closing|close|schedule|date)\b/.test(text) ? "SCHEDULE" : "FACT";
  const valueType = /\b\d+(?:[.,]\d+)?\b/.test(answer) ? "NUMBER" : "TEXT";
  const currency = /₹|\b(?:rs\.?|inr)\b/i.test(answer) ? "INR"
    : /\$|\busd\b/i.test(answer) ? "USD"
      : /€|\beur\b/i.test(answer) ? "EUR" : null;
  return { question, answer, category, claimType, valueType, currency, refreshDays: claimType === "PRICE" || claimType === "SCHEDULE" ? 30 : 90 } satisfies StagedAtomicClaim;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { cells.push(value.trim()); value = ""; }
    else value += character;
  }
  cells.push(value.trim());
  return cells;
}

function structuredRows(text: string, mimeType: string): Array<Record<string, unknown>> {
  if (mimeType === "application/json") {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        const array = Object.values(record).find(Array.isArray);
        return Array.isArray(array) ? array.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [record];
      }
    } catch { return []; }
  }
  if (mimeType === "text/csv") {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
    return lines.slice(1).map((line) => Object.fromEntries(parseCsvLine(line).map((value, index) => [headers[index] || `column_${index + 1}`, value])));
  }
  return [];
}

export function stageAtomicClaims(extractedText: string, mimeType: string): StagedAtomicClaim[] {
  const claims: StagedAtomicClaim[] = [];
  const seen = new Set<string>();
  const add = (questionValue: unknown, answerValue: unknown, categoryValue?: unknown) => {
    const question = cleanCell(questionValue).replace(/^[\s•*\-\d.)]+/, "");
    const answer = cleanCell(answerValue);
    if (question.length < 4 || answer.length < 8) return;
    const normalizedQuestion = question.toLowerCase();
    if (seen.has(normalizedQuestion)) return;
    seen.add(normalizedQuestion);
    claims.push(inferMetadata(question.endsWith("?") ? question : `What is the approved ${question.toLowerCase()}?`, answer, cleanCell(categoryValue) || "Imported source"));
  };

  for (const row of structuredRows(extractedText, mimeType)) {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]+/g, "_"), value]));
    const question = normalized.question ?? normalized.customer_question ?? normalized.key ?? normalized.field ?? normalized.topic ?? normalized.name;
    const answer = normalized.answer ?? normalized.approved_answer ?? normalized.value ?? normalized.description ?? normalized.policy ?? normalized.details;
    if (question !== undefined && answer !== undefined) add(question, answer, normalized.category ?? normalized.domain);
    else for (const [key, value] of Object.entries(normalized)) if (!/^(id|category|domain|type|source)$/.test(key)) add(key.replaceAll("_", " "), value, normalized.category ?? normalized.domain);
  }

  if (!claims.length) {
    const lines = extractedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const qa = line.match(/^(?:q(?:uestion)?\s*[:.-]\s*)?(.{4,240}\?)\s*(?:a(?:nswer)?\s*[:.-]\s*)?(.{8,})$/i);
      if (qa) { add(qa[1], qa[2]); continue; }
      if (/^(?:q(?:uestion)?\s*[:.-]\s*)/i.test(line) && lines[index + 1]) {
        const answerLine = lines[index + 1].replace(/^a(?:nswer)?\s*[:.-]\s*/i, "");
        add(line.replace(/^q(?:uestion)?\s*[:.-]\s*/i, ""), answerLine); index += 1; continue;
      }
      const pair = line.match(/^[•*\-\d.)\s]*([^:]{3,100}):\s*(.{8,})$/);
      if (pair) add(pair[1], pair[2]);
    }
  }
  return claims.slice(0, MAX_STAGED_CLAIMS);
}
