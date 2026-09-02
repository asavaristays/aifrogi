import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { applyOnboardingWorkbook, parseOnboardingWorkbook } from "@/lib/services/onboarding-workbook-service";

export async function POST(request: Request) {
  const access = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const data = await request.formData();
  const file = data.get("file");
  const action = String(data.get("action") || "PREVIEW").toUpperCase();
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose the completed onboarding workbook." }, { status: 400 });
  try {
    if (action === "PREVIEW") return NextResponse.json({ ok: true, ...(await parseOnboardingWorkbook(file)).preview });
    if (action !== "APPLY") return NextResponse.json({ error: "Unknown import action." }, { status: 400 });
    const result = await applyOnboardingWorkbook({ organizationId: access.organization.id, propertyId: access.propertyId, actorEmail: access.user.username, file });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import this workbook." }, { status: 400 });
  }
}
