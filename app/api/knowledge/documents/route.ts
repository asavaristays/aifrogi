import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { createKnowledgeDocument, detectDocumentConflict, reviewKnowledgeDocument } from "@/lib/repositories/knowledge-content-repository";
import { extractKnowledgeDocument, stageAtomicClaims } from "@/lib/services/knowledge-document-service";
import { stageDocumentAtomicClaims } from "@/lib/repositories/knowledge-verification-repository";

async function context() {
  const access = await getCurrentClientAccess();
  if (!access || !canManageWorkspace(access.role)) return null;
  const property = await getPropertyBySlug(await getCurrentWorkspaceSlug());
  return property ? { access, property } : null;
}

export async function POST(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a knowledge document." }, { status: 400 });
  try {
    const extracted = await extractKnowledgeDocument(file);
    const conflictSummary = await detectDocumentConflict(current.property.id, extracted.extractedText);
    const document = await createKnowledgeDocument({ propertyId: current.property.id, fileName: file.name.replace(/[\r\n]/g, " ").slice(0, 180), mimeType: file.type, sizeBytes: file.size, content: extracted.content, extractedText: extracted.extractedText, uploadedBy: current.access.user.username, conflictSummary });
    const candidates = stageAtomicClaims(extracted.extractedText, file.type);
    const stagedClaims = candidates.length ? await stageDocumentAtomicClaims({ propertyId: current.property.id, documentId: document.id, createdBy: current.access.user.username, claims: candidates }) : [];
    return NextResponse.json({ ok: true, document, stagedClaims: stagedClaims.map((entry) => ({ id: entry.id, question: entry.question, status: entry.status, validationErrors: entry.validationErrors })), stagedCount: stagedClaims.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process this document." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { id?: string; action?: "APPROVE" | "REJECT" | "DELETE"; confirmConflict?: boolean } | null;
  try {
    const document = await reviewKnowledgeDocument({ propertyId: current.property.id, id: payload?.id || "", action: payload?.action || "REJECT", actorEmail: current.access.user.username, confirmConflict: payload?.confirmConflict });
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update this document." }, { status: 400 });
  }
}
