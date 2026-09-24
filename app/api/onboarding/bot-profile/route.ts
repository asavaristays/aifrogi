import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { saveOrganizationBotProfile } from "@/lib/repositories/onboarding-repository";
import { submitSimpleOnboardingForReview } from "@/lib/simple-onboarding-submission";
import { normalizeCapabilitiesForCategory, parseBotProfile } from "@/lib/bot-profile";

export async function PATCH(request: Request) {
  const access = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { organization, user } = access;
  if (!organization?.botProfile) return NextResponse.json({ error: "AiFrogi SuperAdmin must create the bot blueprint first." }, { status: 409 });
  const payload = await request.json().catch(() => null);
  if (payload?.action === "SUBMIT_FOR_REVIEW") {
    try {
      const updated = await withTenantDatabaseContext({ kind: "tenant", organizationId: organization.id, actor: `onboarding-bot-submit:${user.username}` }, () => submitSimpleOnboardingForReview({ organizationId: organization.id, actorEmail: user.username }));
      return NextResponse.json({ organization: updated });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Bot could not be submitted for review." }, { status: 400 });
    }
  }
  const governedCapabilities = normalizeCapabilitiesForCategory(organization.botProfile.category, organization.botProfile.capabilities);
  const parsed = parseBotProfile({ ...organization.botProfile, ...(payload && typeof payload === "object" ? payload : {}), category: organization.botProfile.category, operatingMode: organization.botProfile.operatingMode, channels: ["WEBSITE"], capabilities: governedCapabilities, humanHandoffEnabled: organization.botProfile.humanHandoffEnabled, actionApprovalNeeded: organization.botProfile.actionApprovalNeeded });
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const profile = parsed.value;
  const updated = await withTenantDatabaseContext({ kind: "tenant", organizationId: organization.id, actor: `onboarding-bot-profile:${user.username}` }, () => saveOrganizationBotProfile({ organizationId: organization.id, actorEmail: user.username, profile }));
  return NextResponse.json({ organization: updated });
}
