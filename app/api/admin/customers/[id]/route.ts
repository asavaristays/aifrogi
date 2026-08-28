import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  getOrganizationById,
  reviewOrganizationKyc,
  updateOrganizationFlowStatus,
  updateOrganizationStatus
} from "@/lib/repositories/onboarding-repository";
import { saveOrganizationWhatsAppBotConfiguration } from "@/lib/repositories/bot-configuration-repository";
import { normalizeWhatsAppBotConfiguration, type WhatsAppBotConfigurationInput } from "@/lib/whatsapp-bot-config";
import { updateOrganizationPlan } from "@/lib/billing-super-admin";
import { setAppointmentJourneyEnabled } from "@/lib/appointment-journey-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const organization = await getOrganizationById(id);
  if (!organization) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as {
    action?: string;
    reason?: string;
    note?: string;
    plan?: string;
    metaBillingStatus?: string;
    templateStatus?: string;
    firstMessageStatus?: string;
    configuration?: WhatsAppBotConfigurationInput;
    propertyId?: string;
  } | null;
  const action = payload?.action?.trim().toUpperCase();
  if (action === "APPROVE_KYC" || action === "REJECT_KYC") {
    if (action === "REJECT_KYC" && !payload?.reason?.trim()) {
      return NextResponse.json({ error: "Add a clear reason for the customer" }, { status: 400 });
    }
    const updated = await reviewOrganizationKyc({
      organizationId: id,
      reviewerEmail: user.username,
      approved: action === "APPROVE_KYC",
      reason: payload?.reason?.trim()
    });
    return NextResponse.json({ organization: updated });
  }

  if (action === "SUSPEND" || action === "ACTIVATE") {
    await updateOrganizationStatus(id, action === "SUSPEND" ? "SUSPENDED" : "ACTIVE");
    return NextResponse.json({ organization: await getOrganizationById(id) });
  }

  if (action === "UPDATE_FLOW_STATUS") {
    try {
      const updated = await updateOrganizationFlowStatus({
        organizationId: id,
        actorEmail: user.username,
        metaBillingStatus: payload?.metaBillingStatus,
        templateStatus: payload?.templateStatus,
        firstMessageStatus: payload?.firstMessageStatus,
        note: payload?.note
      });
      return NextResponse.json({ organization: updated });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Flow status could not be updated" }, { status: 400 });
    }
  }

  if (action === "SAVE_BOT_CONFIGURATION") {
    const allowedPlans = new Set(["TRIAL", "STARTER", "GROWTH", "AI_TOOLS", "CUSTOM"]);
    const plan = payload?.plan?.trim().toUpperCase() || "TRIAL";
    if (!allowedPlans.has(plan)) {
      return NextResponse.json({ error: "Select a valid client plan" }, { status: 400 });
    }

    const configuration = normalizeWhatsAppBotConfiguration(payload?.configuration);
    if (configuration.welcomeMessage.length > 500) {
      return NextResponse.json({ error: "Opening message must be 500 characters or fewer" }, { status: 400 });
    }

    await updateOrganizationPlan({
      organizationId: id,
      planCode: plan,
      actorEmail: user.username
    });
    const updated = await saveOrganizationWhatsAppBotConfiguration({
      organizationId: id,
      plan,
      configuration,
      updatedBy: user.username
    });
    return NextResponse.json({ organization: updated });
  }

  if (action === "ENABLE_APPOINTMENT_JOURNEY" || action === "DISABLE_APPOINTMENT_JOURNEY") {
    const propertyId = payload?.propertyId?.trim() || "";
    if (!propertyId) return NextResponse.json({ error: "Workspace is required." }, { status: 400 });
    const result = await setAppointmentJourneyEnabled({
      organizationId: id,
      propertyId,
      enabled: action === "ENABLE_APPOINTMENT_JOURNEY",
      actorEmail: user.username
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported customer action" }, { status: 400 });
}
