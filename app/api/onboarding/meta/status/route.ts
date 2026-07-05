import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { updateOnboardingProfile, updateOrganizationStatus } from "@/lib/repositories/onboarding-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { listMetaMessageTemplates, validateWhatsAppIntegration } from "@/lib/services/whatsapp-service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await loadOnboardingForUser(user.username);
  const property = organization?.properties[0];
  if (!organization?.onboarding || !property) {
    return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
  }

  const [validation, templateSync] = await Promise.all([
    validateWhatsAppIntegration(property.slug),
    listMetaMessageTemplates(property.slug)
  ]);
  const live = !validation.error && validation.phone?.accountStatus?.toUpperCase() === "CONNECTED";
  const approvedTemplates = templateSync.templates.filter((template) => template.status === "APPROVED");
  const updated = await updateOnboardingProfile(
    organization.id,
    {
      metaStatus: live ? "LIVE" : organization.onboarding.metaStatus,
      lifecycleStatus: live ? "LIVE" : organization.onboarding.lifecycleStatus,
      phoneVerificationStatus: live ? "VERIFIED" : organization.onboarding.phoneVerificationStatus,
      webhookStatus: live ? "CONNECTED" : organization.onboarding.webhookStatus,
      tokenStatus: live ? "ACTIVE" : organization.onboarding.tokenStatus,
      displayPhoneNumber: validation.phone?.displayPhoneNumber || organization.onboarding.displayPhoneNumber,
      qualityRating: validation.phone?.qualityRating || organization.onboarding.qualityRating,
      templateStatus: approvedTemplates.length ? "APPROVED" : templateSync.error ? organization.onboarding.templateStatus : "PENDING",
      currentStep: live ? 6 : organization.onboarding.currentStep,
      progressPercent: live ? 100 : organization.onboarding.progressPercent,
      completedAt: live ? organization.onboarding.completedAt || new Date() : organization.onboarding.completedAt,
      lastStatusCheckAt: new Date(),
      lastError: validation.error ? validation.error.slice(0, 500) : templateSync.error ? templateSync.error.slice(0, 500) : null
    },
    { actorEmail: user.username, action: "STATUS_REFRESHED", detail: live ? "WhatsApp connection is healthy" : "Connection still requires attention" }
  );
  if (live) {
    await updateOrganizationStatus(organization.id, "ACTIVE");
  }

  return NextResponse.json({
    organization: updated,
    healthError: validation.error || null,
    templateSync: { approved: approvedTemplates.length, total: templateSync.templates.length, error: templateSync.error || null }
  });
}
