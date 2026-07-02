import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  deleteOnboardingDocument,
  saveOnboardingDocument
} from "@/lib/repositories/onboarding-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const allowedDocumentTypes = new Set(["GST_CERTIFICATE", "TRADE_LICENSE", "PAN", "VISITING_CARD"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await loadOnboardingForUser(user.username);
  if (!organization) {
    return NextResponse.json({ error: "Create an organization before uploading documents" }, { status: 404 });
  }

  const formData = await request.formData();
  const type = String(formData.get("type") || "").trim();
  const file = formData.get("file");

  if (!allowedDocumentTypes.has(type)) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a document to upload" }, { status: 400 });
  }
  if (!allowedMimeTypes.has(file.type) || file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "Upload a PDF, JPG, or PNG up to 5 MB" }, { status: 400 });
  }

  const document = await saveOnboardingDocument({
    organizationId: organization.id,
    type,
    fileName: file.name.replace(/[\r\n]/g, " ").slice(0, 180),
    mimeType: file.type,
    sizeBytes: file.size,
    content: new Uint8Array(await file.arrayBuffer()),
    actorEmail: user.username
  });

  if (!document) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  return NextResponse.json({ document }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await loadOnboardingForUser(user.username);
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!organization || !id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteOnboardingDocument(id, organization.id);
  return NextResponse.json({ ok: true });
}
