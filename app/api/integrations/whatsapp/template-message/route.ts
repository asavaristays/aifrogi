import { NextResponse } from "next/server";
import { sendWhatsAppTemplateMessage } from "@/lib/services/whatsapp-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { updateOnboardingProfile } from "@/lib/repositories/onboarding-repository";
import { checkOrganizationEntitlement } from "@/lib/billing-super-admin";

function parseVariables(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const to = typeof payload?.to === "string" ? payload.to : "";
  const templateName = typeof payload?.templateName === "string" ? payload.templateName : "";
  const languageCode = typeof payload?.languageCode === "string" ? payload.languageCode : "en_US";
  const workspace = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload?.propertySlug === "string" ? payload.propertySlug : null,
    requireActiveSubscription: true
  });
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }
  const allowance = await checkOrganizationEntitlement(workspace.organization.id, "messages", 1);
  if (!allowance.allowed) return NextResponse.json({ error: allowance.error }, { status: 402 });
  const bodyVariables = parseVariables(payload?.bodyVariables);
  const headerImageUrl = typeof payload?.headerImageUrl === "string" ? payload.headerImageUrl.trim() : "";

  const result = await sendWhatsAppTemplateMessage({
    to,
    templateName,
    languageCode,
    propertySlug: workspace.propertySlug,
    bodyVariables,
    headerImageUrl
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (workspace.organization.onboarding?.firstMessageStatus !== "VERIFIED") {
    await updateOnboardingProfile(workspace.organization.id, {
      firstMessageStatus: "VERIFIED",
      templateStatus: "APPROVED"
    }, {
      actorEmail: workspace.user.username,
      action: "FIRST_TEMPLATE_MESSAGE_VERIFIED",
      detail: "First approved-template message was accepted by Meta."
    });
  }

  return NextResponse.json(
    {
      result: result.result
    },
    { status: result.status }
  );
}
