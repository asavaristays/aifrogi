import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationById } from "@/lib/repositories/onboarding-repository";
import { applyOnboardingWorkbook, parseOnboardingWorkbook } from "@/lib/services/onboarding-workbook-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const organization = await getOrganizationById((await context.params).id);
  if (!organization?.properties[0]) return NextResponse.json({ error: "Customer workspace not found." }, { status: 404 });
  const data = await request.formData();
  const file = data.get("file");
  const action = String(data.get("action") || "PREVIEW").toUpperCase();
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose the completed onboarding workbook." }, { status: 400 });
  try {
    if (action === "PREVIEW") return NextResponse.json({ ok: true, ...(await parseOnboardingWorkbook(file)).preview });
    if (action !== "APPLY") return NextResponse.json({ error: "Unknown import action." }, { status: 400 });
    const result = await applyOnboardingWorkbook({ organizationId: organization.id, propertyId: organization.properties[0].id, actorEmail: user.username, file });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import this workbook." }, { status: 400 });
  }
}
