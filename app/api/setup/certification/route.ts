import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getTenantKnowledgeRevision, readTenantCertification, runTenantCertification, saveTenantCertificationCases, tenantCertificationStatus, type TenantCertificationCase } from "@/lib/tenant-intelligence/certification";
import { suggestGoldenBank } from "@/lib/tenant-intelligence/certification-templates";
import { getDb } from "@/lib/db";

async function context() {
  const access = await getCurrentClientAccess();
  if (!access) return null;
  const propertySlug = await getCurrentWorkspaceSlug();
  return { access, propertySlug, knowledgeRevision: await getTenantKnowledgeRevision(propertySlug) };
}

export async function GET() {
  const value = await context();
  if (!value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const record = await readTenantCertification(value.propertySlug);
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug: value.propertySlug }, select: { id: true } }) : null;
  const entries = db && property ? await db.knowledgeEntry.findMany({ where: { propertyId: property.id, status: { in: ["APPROVED", "PUBLISHED"] }, conflictStatus: { not: "UNRESOLVED" } }, select: { question: true }, orderBy: { updatedAt: "desc" }, take: 30 }) : [];
  const category = value.access.organization.botProfile?.category || "CUSTOM";
  return NextResponse.json({ record, status: tenantCertificationStatus(record, value.knowledgeRevision), canManage: canManageWorkspace(value.access.role), suggestions: suggestGoldenBank(category, entries.map((entry) => entry.question)) });
}

export async function PATCH(request: Request) {
  const value = await context();
  if (!value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(value.access.role)) return NextResponse.json({ error: "Client Admin access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { level?: string; cases?: TenantCertificationCase[] } | null;
  const level = payload?.level === "GOLDEN" ? "GOLDEN" : "SMOKE";
  try { return NextResponse.json({ record: await saveTenantCertificationCases(value.propertySlug, level, Array.isArray(payload?.cases) ? payload.cases : []) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save certification questions." }, { status: 400 }); }
}

export async function POST() {
  const value = await context();
  if (!value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(value.access.role)) return NextResponse.json({ error: "Client Admin access required." }, { status: 403 });
  try { const record = await runTenantCertification(value.propertySlug, value.knowledgeRevision, value.access.organization.id); return NextResponse.json({ record, status: tenantCertificationStatus(record, value.knowledgeRevision) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Certification could not run." }, { status: 400 }); }
}
