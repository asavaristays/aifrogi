const MAX_EXTRACTED_CHARS = 120_000;

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
