import ExcelJS from "exceljs";
import { getDb } from "@/lib/db";
import { createKnowledgeDocument, detectDocumentConflict } from "@/lib/repositories/knowledge-content-repository";
import { stageDocumentAtomicClaims } from "@/lib/repositories/knowledge-verification-repository";

export type CategorizedWorkbookClaim = {
  category: string;
  question: string;
  answer: string;
  sourceUrl: string;
  tenantId: string;
  generationId: string;
  refreshDays: number;
};

export type CategorizedWorkbookPreview = {
  totalRows: number;
  approvedRows: number;
  pendingRows: number;
  blockedRows: number;
  claims: CategorizedWorkbookClaim[];
  warnings: string[];
};

const value = (input: unknown) => String(input ?? "").replace(/\u0000/g, "").trim();
const headerKey = (input: unknown) => value(input).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const secureText = (input: unknown, limit: number, field: string) => {
  const result = value(input);
  if (result.length > limit) throw new Error(`${field} exceeds ${limit} characters.`);
  if (/\b(password|otp|secret key|api key|private key)\b\s*[:=-]/i.test(result)) throw new Error(`${field} appears to contain a credential.`);
  return result;
};
const origin = (url: string) => { try { const parsed = new URL(url); return /^https?:$/.test(parsed.protocol) ? parsed.origin : ""; } catch { return ""; } };

export async function parseCategorizedKnowledgeWorkbook(input: {
  bytes: Uint8Array;
  expectedTenantId: string;
  allowedSourceOrigin: string;
}): Promise<CategorizedWorkbookPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input.bytes as unknown as ExcelJS.Buffer);
  const sheet = workbook.getWorksheet("Categorized Content");
  if (!sheet) throw new Error('The workbook must contain a "Categorized Content" sheet.');
  if (sheet.actualRowCount > 2001 || sheet.actualColumnCount > 20) throw new Error("The categorized workbook exceeds safe import limits.");

  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => headers.set(headerKey(cell.value), column));
  const column = (...names: string[]) => names.map((name) => headers.get(headerKey(name))).find(Boolean) || 0;
  const cols = {
    category: column("Category"), pageTitle: column("Page title"), heading: column("Section"), content: column("Extracted content"),
    sourceUrl: column("Source URL"), reviewFlag: column("Review flag"), approval: column("Approval"), visibility: column("Public visibility"),
    tenantId: column("Tenant ID"), generationId: column("Generation ID"), correction: column("Client correction")
  };
  for (const required of ["category", "content", "sourceUrl", "approval", "visibility", "tenantId"] as const) if (!cols[required]) throw new Error(`Categorized Content is missing the ${required} column.`);

  const claims: CategorizedWorkbookClaim[] = []; const warnings: string[] = [];
  let totalRows = 0, pendingRows = 0, blockedRows = 0;
  const allowedOrigin = origin(input.allowedSourceOrigin);
  if (!allowedOrigin) throw new Error("Allowed source origin must be an HTTP or HTTPS URL.");
  const seen = new Set<string>();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || !value(row.getCell(cols.content).value)) return;
    totalRows += 1;
    const approval = value(row.getCell(cols.approval).value);
    const visibility = value(row.getCell(cols.visibility).value);
    if (approval !== "Approved" || visibility !== "Public") { pendingRows += 1; return; }
    const tenantId = value(row.getCell(cols.tenantId).value);
    if (tenantId !== input.expectedTenantId) { blockedRows += 1; warnings.push(`Row ${rowNumber} was blocked because its tenant ID does not match this workspace.`); return; }
    const sourceUrl = value(row.getCell(cols.sourceUrl).value);
    if (origin(sourceUrl) !== allowedOrigin) { blockedRows += 1; warnings.push(`Row ${rowNumber} was blocked because its source URL is outside the authorised origin.`); return; }
    if (cols.reviewFlag && value(row.getCell(cols.reviewFlag).value)) { blockedRows += 1; warnings.push(`Row ${rowNumber} remains in the review queue and cannot be imported.`); return; }
    const extracted = secureText(row.getCell(cols.content).value, 4000, `Row ${rowNumber} content`);
    const correction = cols.correction ? secureText(row.getCell(cols.correction).value, 4000, `Row ${rowNumber} correction`) : "";
    const answer = correction || extracted;
    const pageTitle = secureText(cols.pageTitle ? row.getCell(cols.pageTitle).value : "", 300, `Row ${rowNumber} page title`);
    const heading = secureText(cols.heading ? row.getCell(cols.heading).value : "", 300, `Row ${rowNumber} heading`);
    const question = `What does ${heading && heading !== "Page content" ? heading : pageTitle || "this source"} say?`;
    const category = secureText(row.getCell(cols.category).value, 100, `Row ${rowNumber} category`) || "General";
    const stable = `${category}\n${question}\n${answer}`.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(stable)) { warnings.push(`Row ${rowNumber} duplicates an earlier approved row and was skipped.`); return; }
    seen.add(stable);
    claims.push({ category, question, answer, sourceUrl, tenantId, generationId: cols.generationId ? value(row.getCell(cols.generationId).value) : "", refreshDays: 90 });
  });
  return { totalRows, approvedRows: claims.length, pendingRows, blockedRows, claims, warnings };
}

export async function applyCategorizedKnowledgeWorkbook(input: {
  organizationId: string;
  propertyId: string;
  actorEmail: string;
  allowedSourceOrigin: string;
  file: File;
}) {
  if (!input.file.name.toLowerCase().endsWith(".xlsx") || input.file.size > 5 * 1024 * 1024) throw new Error("Upload a categorized .xlsx workbook smaller than 5 MB.");
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 2)) !== "PK") throw new Error("This is not a valid XLSX workbook.");
  const preview = await parseCategorizedKnowledgeWorkbook({ bytes, expectedTenantId: input.propertyId, allowedSourceOrigin: input.allowedSourceOrigin });
  if (!preview.claims.length) throw new Error("No Approved and Public rows are available to stage. Client review is still required.");
  const db = getDb(); if (!db) throw new Error("Database unavailable.");
  const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: input.organizationId }, select: { id: true } });
  if (!property) throw new Error("The target property does not belong to this workspace.");
  const extractedText = preview.claims.map((claim) => `${claim.question}\n${claim.answer}\nSource: ${claim.sourceUrl}`).join("\n\n");
  const conflictSummary = await detectDocumentConflict(input.propertyId, extractedText);
  const document = await createKnowledgeDocument({ propertyId: input.propertyId, fileName: input.file.name.replace(/[\r\n]/g, " ").slice(0, 180), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: bytes.byteLength, content: bytes, extractedText, uploadedBy: input.actorEmail, conflictSummary });
  const entries = await stageDocumentAtomicClaims({ propertyId: input.propertyId, documentId: document.id, createdBy: input.actorEmail, claims: preview.claims.map((claim) => ({ question: claim.question, answer: claim.answer, category: claim.category, claimType: "FACT", valueType: "TEXT", currency: null, refreshDays: claim.refreshDays })) });
  await db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "CATEGORIZED_CRAWL_WORKBOOK_STAGED", detail: JSON.stringify({ fileName: input.file.name, documentId: document.id, stagedCount: entries.length, tenantId: input.propertyId, sourceOrigin: new URL(input.allowedSourceOrigin).origin }) } });
  return { preview, documentId: document.id, stagedCount: entries.length };
}
