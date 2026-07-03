import { getDb } from "@/lib/db";

function normalizedTerms(value: string) {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2));
}

function similarity(left: string, right: string) {
  const a = normalizedTerms(left);
  const b = normalizedTerms(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((term) => b.has(term)).length;
  return overlap / Math.max(a.size, b.size);
}

function numbers(value: string) {
  return [...value.matchAll(/(?:₹|rs\.?\s*)?\d[\d,.]*(?:%|\s*(?:days?|hours?|months?|years?))?/gi)].map((match) => match[0].toLowerCase().replace(/\s+/g, " "));
}

export async function detectKnowledgeConflict(propertyId: string, question: string, answer: string, excludeId?: string) {
  const db = getDb();
  if (!db) return null;
  const entries = await db.knowledgeEntry.findMany({ where: { propertyId, status: "APPROVED", id: excludeId ? { not: excludeId } : undefined }, select: { question: true, answer: true } });
  for (const entry of entries) {
    if (similarity(question, entry.question) < 0.5) continue;
    const existingNumbers = numbers(entry.answer);
    const newNumbers = numbers(answer);
    if (existingNumbers.length && newNumbers.length && existingNumbers.join("|") !== newNumbers.join("|")) return `Possible numeric conflict with approved answer: “${entry.question.slice(0, 120)}”`;
    if (entry.answer.trim().toLowerCase() !== answer.trim().toLowerCase()) return `Possible answer conflict with approved answer: “${entry.question.slice(0, 120)}”`;
  }
  return null;
}

export async function detectDocumentConflict(propertyId: string, text: string) {
  const db = getDb();
  if (!db) return null;
  const entries = await db.knowledgeEntry.findMany({ where: { propertyId, status: "APPROVED" }, select: { question: true, answer: true } });
  const textLower = text.toLowerCase();
  for (const entry of entries) {
    const importantTerms = [...normalizedTerms(entry.question)].slice(0, 6);
    if (importantTerms.length < 2 || importantTerms.filter((term) => textLower.includes(term)).length < 2) continue;
    const approvedNumbers = numbers(entry.answer);
    const documentNumbers = numbers(text.slice(Math.max(0, textLower.indexOf(importantTerms[0]) - 300), textLower.indexOf(importantTerms[0]) + 1200));
    if (approvedNumbers.length && documentNumbers.length && !approvedNumbers.some((value) => documentNumbers.includes(value))) return `Document may conflict with approved numeric information for “${entry.question.slice(0, 120)}”.`;
  }
  return null;
}

export async function createKnowledgeDocument(input: { propertyId: string; fileName: string; mimeType: string; sizeBytes: number; content: Uint8Array<ArrayBuffer>; extractedText: string; uploadedBy: string; conflictSummary?: string | null }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  return db.knowledgeDocument.create({ data: { ...input, status: input.conflictSummary ? "CONFLICT" : "PENDING" }, select: { id: true, fileName: true, mimeType: true, sizeBytes: true, status: true, conflictSummary: true, uploadedBy: true, createdAt: true } });
}

export async function reviewKnowledgeDocument(input: { propertyId: string; id: string; action: "APPROVE" | "REJECT" | "DELETE"; actorEmail: string; confirmConflict?: boolean }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const document = await db.knowledgeDocument.findFirst({ where: { id: input.id, propertyId: input.propertyId } });
  if (!document) throw new Error("Knowledge document not found.");
  if (input.action === "DELETE") return db.knowledgeDocument.delete({ where: { id: document.id } });
  if (input.action === "APPROVE" && document.conflictSummary && !input.confirmConflict) throw new Error("Review and confirm the detected conflict before approval.");
  return db.knowledgeDocument.update({ where: { id: document.id }, data: { status: input.action === "APPROVE" ? "APPROVED" : "REJECTED", approvedBy: input.action === "APPROVE" ? input.actorEmail : null, approvedAt: input.action === "APPROVE" ? new Date() : null } });
}

export async function createKnowledgeEntry(input: { propertyId: string; question: string; answer: string; category: string; createdBy: string; gapId?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const question = input.question.trim();
  const answer = input.answer.trim();
  if (question.length < 4 || answer.length < 8) throw new Error("Add a clear question and answer.");
  const conflictSummary = await detectKnowledgeConflict(input.propertyId, question, answer);
  const entry = await db.knowledgeEntry.create({ data: { propertyId: input.propertyId, question, answer, category: input.category.trim() || "General", createdBy: input.createdBy, status: conflictSummary ? "CONFLICT" : "DRAFT", conflictSummary } });
  if (input.gapId) await db.knowledgeGap.updateMany({ where: { id: input.gapId, propertyId: input.propertyId }, data: { resolutionEntryId: entry.id, status: "RESOLVED" } });
  return entry;
}

export async function reviewKnowledgeEntry(input: { propertyId: string; id: string; action: "APPROVE" | "REJECT" | "DELETE"; actorEmail: string; confirmConflict?: boolean }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const entry = await db.knowledgeEntry.findFirst({ where: { id: input.id, propertyId: input.propertyId } });
  if (!entry) throw new Error("Knowledge answer not found.");
  if (input.action === "DELETE") return db.knowledgeEntry.delete({ where: { id: entry.id } });
  if (input.action === "APPROVE" && entry.conflictSummary && !input.confirmConflict) throw new Error("Review and confirm the detected conflict before approval.");
  return db.knowledgeEntry.update({ where: { id: entry.id }, data: { status: input.action === "APPROVE" ? "APPROVED" : "REJECTED", approvedBy: input.action === "APPROVE" ? input.actorEmail : null, approvedAt: input.action === "APPROVE" ? new Date() : null } });
}

function normalizeQuestion(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
}

export async function recordKnowledgeGap(propertySlug: string, question: string) {
  const db = getDb();
  const normalizedQuestion = normalizeQuestion(question);
  if (!db || normalizedQuestion.length < 4) return null;
  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true } });
  if (!property) return null;
  return db.knowledgeGap.upsert({ where: { propertyId_normalizedQuestion: { propertyId: property.id, normalizedQuestion } }, update: { question: question.trim().slice(0, 1000), occurrenceCount: { increment: 1 }, lastAskedAt: new Date(), status: "OPEN" }, create: { propertyId: property.id, question: question.trim().slice(0, 1000), normalizedQuestion, lastAskedAt: new Date() } });
}

export async function dismissKnowledgeGap(propertyId: string, id: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  return db.knowledgeGap.updateMany({ where: { id, propertyId }, data: { status: "DISMISSED" } });
}

export async function getKnowledgeGovernanceSummary(propertySlug: string) {
  const db = getDb();
  if (!db) return { propertyId: null, documents: [], entries: [], gaps: [] };
  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true } });
  if (!property) return { propertyId: null, documents: [], entries: [], gaps: [] };
  const [documents, entries, gaps] = await Promise.all([
    db.knowledgeDocument.findMany({ where: { propertyId: property.id }, select: { id: true, fileName: true, mimeType: true, sizeBytes: true, status: true, conflictSummary: true, uploadedBy: true, approvedBy: true, createdAt: true, updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    db.knowledgeEntry.findMany({ where: { propertyId: property.id }, select: { id: true, question: true, answer: true, category: true, status: true, conflictSummary: true, createdBy: true, approvedBy: true, createdAt: true, updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    db.knowledgeGap.findMany({ where: { propertyId: property.id, status: "OPEN" }, select: { id: true, question: true, occurrenceCount: true, status: true, lastAskedAt: true }, orderBy: [{ occurrenceCount: "desc" }, { lastAskedAt: "desc" }], take: 30 })
  ]);
  return { propertyId: property.id, documents, entries, gaps };
}

export async function getApprovedKnowledgeContext(propertySlug: string, question: string) {
  const db = getDb();
  if (!db) return "";
  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true } });
  if (!property) return "";
  const terms = [...normalizedTerms(question)];
  const [entries, documents] = await Promise.all([
    db.knowledgeEntry.findMany({ where: { propertyId: property.id, status: "APPROVED" }, select: { question: true, answer: true, category: true }, take: 80 }),
    db.knowledgeDocument.findMany({ where: { propertyId: property.id, status: "APPROVED" }, select: { fileName: true, extractedText: true }, take: 20 })
  ]);
  const rankedEntries = entries.map((entry) => ({ entry, score: terms.filter((term) => `${entry.question} ${entry.answer} ${entry.category}`.toLowerCase().includes(term)).length })).filter((item) => item.score > 0).sort((a,b) => b.score-a.score).slice(0,8);
  const rankedDocs = documents.map((document) => ({ document, score: terms.filter((term) => document.extractedText.toLowerCase().includes(term)).length })).filter((item) => item.score > 0).sort((a,b) => b.score-a.score).slice(0,4);
  const blocks = [
    ...rankedEntries.map(({ entry }) => `Approved answer (${entry.category})\nQuestion: ${entry.question}\nAnswer: ${entry.answer}`),
    ...rankedDocs.map(({ document }) => `Approved document: ${document.fileName}\n${document.extractedText.slice(0, 3500)}`)
  ];
  return blocks.join("\n\n---\n\n").slice(0, 9000);
}
