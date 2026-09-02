import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  getOrganizationById,
  reviewOrganizationKyc,
  updateOrganizationFlowStatus,
  saveOrganizationBotProfile,
  updateWebsiteBotLifecycle,
  updateOrganizationStatus,
  updateBotConnectorPlan
} from "@/lib/repositories/onboarding-repository";
import { saveOrganizationWhatsAppBotConfiguration } from "@/lib/repositories/bot-configuration-repository";
import { normalizeWhatsAppBotConfiguration, type WhatsAppBotConfigurationInput } from "@/lib/whatsapp-bot-config";
import { updateOrganizationPlan } from "@/lib/billing-super-admin";
import { setAppointmentJourneyEnabled } from "@/lib/appointment-journey-service";
import { parseBotProfile } from "@/lib/bot-profile";
import { sendBookingMail } from "@/lib/services/mailbox-service";

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
    profile?: unknown;
    connectorKey?: string;
    provider?: string;
    lifecycle?: string;
    enabled?: boolean;
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

  if (action === "SUSPEND" || action === "ACTIVATE" || action === "REMOVE_FROM_OPERATIONS") {
    if (action === "REMOVE_FROM_OPERATIONS" && !payload?.reason?.trim()) return NextResponse.json({ error: "Add a reason before removing a customer from active operations" }, { status: 400 });
    if (action === "REMOVE_FROM_OPERATIONS" && organization.botProfile?.channels.includes("WEBSITE") && organization.botProfile.status !== "DELETED") {
      await updateWebsiteBotLifecycle({ organizationId: id, actorEmail: user.username, action: "DELETE" });
    }
    await updateOrganizationStatus(id, action === "SUSPEND" ? "SUSPENDED" : action === "ACTIVATE" ? "ACTIVE" : "REMOVED");
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

  if (action === "SAVE_BOT_PROFILE") {
    const parsed = parseBotProfile(payload?.profile);
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const updated = await saveOrganizationBotProfile({ organizationId: id, actorEmail: user.username, profile: parsed.value });
    if (!organization.botProfile?.installationKey && parsed.value.channels.includes("WEBSITE") && updated?.botProfile?.installationKey && updated.properties[0]) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/$/, "");
      const script = `<script async src="${appUrl}/api/public/website-bot/${updated.properties[0].slug}/install?key=${updated.botProfile.installationKey}"></script>`;
      await sendBookingMail({ to: updated.ownerEmail, subject: `Install ${updated.botProfile.personaName || "your AiFrogi AI Bot"}`, body: `Hello ${updated.ownerName},\n\nYour governed Website AI Bot blueprint is ready for installation.\n\nRecommended JavaScript:\n${script}\n\nWordPress: add the same code in a Custom HTML block or approved footer-code area.\n\niFrame option:\n<iframe src="${appUrl}/embed/${updated.properties[0].slug}" title="AI Business Bot" width="390" height="680" style="border:0;border-radius:22px" loading="lazy"></iframe>\n\nAfter a valid website load is detected, AiFrogi Super Admin will perform the final readiness check and make the bot live. Never place OpenAI, database, Meta, password or OTP credentials in website code.\n\nAiFrogi` }).catch(() => null);
    }
    return NextResponse.json({ organization: updated });
  }

  if (action === "UPDATE_BOT_CONNECTOR") {
    try {
      const connectorKey = payload?.connectorKey?.trim() || "";
      if (!connectorKey) return NextResponse.json({ error: "Connector is required." }, { status: 400 });
      const updated = await updateBotConnectorPlan({ organizationId: id, connectorKey, provider: payload?.provider, lifecycle: payload?.lifecycle || "REQUESTED", enabled: payload?.enabled === true, actorEmail: user.username });
      return NextResponse.json({ organization: updated });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Connector plan could not be updated." }, { status: 400 });
    }
  }

  if (["MAKE_LIVE", "PAUSE", "DELETE", "RESTORE"].includes(action || "")) {
    try {
      const updated = await updateWebsiteBotLifecycle({ organizationId: id, actorEmail: user.username, action: action as "MAKE_LIVE" | "PAUSE" | "DELETE" | "RESTORE" });
      return NextResponse.json({ organization: updated });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Website Bot lifecycle could not be updated." }, { status: 400 });
    }
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
