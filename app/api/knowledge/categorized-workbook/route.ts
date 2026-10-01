import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { applyCategorizedKnowledgeWorkbook, parseCategorizedKnowledgeWorkbook } from "@/lib/services/categorized-workbook-service";

export async function POST(request: Request) {
  const access = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const data = await request.formData(); const file = data.get("file"); const action = String(data.get("action") || "PREVIEW").toUpperCase();
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose the categorized crawl workbook." }, { status: 400 });
  const source = String(data.get("sourceOrigin") || access.organization.website || "");
  try {
    if (action === "PREVIEW") {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return NextResponse.json({ ok: true, ...(await parseCategorizedKnowledgeWorkbook({ bytes, expectedTenantId: access.propertyId, allowedSourceOrigin: source })) });
    }
    if (action !== "APPLY") return NextResponse.json({ error: "Unknown import action." }, { status: 400 });
    const result = await withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `categorized-workbook:${access.user.username}` }, () => applyCategorizedKnowledgeWorkbook({ organizationId: access.organization.id, propertyId: access.propertyId, actorEmail: access.user.username, allowedSourceOrigin: source, file }));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process this workbook." }, { status: 400 }); }
}
