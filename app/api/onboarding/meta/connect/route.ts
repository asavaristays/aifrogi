import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  saveOnboardingRegistrationPin,
  updateOnboardingProfile,
  updateOrganizationStatus
} from "@/lib/repositories/onboarding-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { saveWhatsAppIntegration } from "@/lib/services/whatsapp-service";

type GraphError = { error?: { message?: string; code?: number } };

function graphError(payload: GraphError | null, fallback: string) {
  return payload?.error?.message?.trim() || fallback;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await loadOnboardingForUser(user.username);
  const property = organization?.properties[0];
  if (!organization?.onboarding || !property) {
    return NextResponse.json({ error: "Complete your organization profile first" }, { status: 400 });
  }
  if (organization.onboarding.kycStatus !== "APPROVED") {
    return NextResponse.json({ error: "Business verification must be approved before connecting WhatsApp" }, { status: 409 });
  }

  const payload = (await request.json().catch(() => null)) as {
    code?: string;
    wabaId?: string;
    phoneNumberId?: string;
  } | null;
  const code = payload?.code?.trim() || "";
  const wabaId = payload?.wabaId?.replace(/[^\d]/g, "") || "";
  const phoneNumberId = payload?.phoneNumberId?.replace(/[^\d]/g, "") || "";
  if (!code || !wabaId || !phoneNumberId) {
    return NextResponse.json({ error: "The secure WhatsApp connection was incomplete" }, { status: 400 });
  }

  const appId = process.env.META_APP_ID?.trim() || process.env.NEXT_PUBLIC_META_APP_ID?.trim() || "";
  const appSecret = process.env.META_APP_SECRET?.trim() || "";
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v25.0";
  if (!appId || !appSecret) {
    return NextResponse.json({ error: "Platform WhatsApp connection is not configured" }, { status: 503 });
  }

  await updateOnboardingProfile(
    organization.id,
    {
      facebookStatus: "CONNECTED",
      metaStatus: "CONNECTING",
      lifecycleStatus: "WHATSAPP_CONFIGURING",
      currentStep: 5,
      progressPercent: 72,
      lastError: null
    },
    { actorEmail: user.username, action: "META_AUTHORIZED", detail: "Secure WhatsApp authorization completed" }
  );

  try {
    const tokenUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);
    const tokenResponse = await fetch(tokenUrl, { method: "GET", cache: "no-store" });
    const tokenPayload = (await tokenResponse.json().catch(() => null)) as (GraphError & { access_token?: string }) | null;
    const accessToken = tokenPayload?.access_token?.trim() || "";
    if (!tokenResponse.ok || !accessToken) {
      throw new Error(graphError(tokenPayload, "Meta authorization could not be completed"));
    }

    const phonesResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,status`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    const phonesPayload = (await phonesResponse.json().catch(() => null)) as (GraphError & {
      data?: Array<{
        id?: string;
        display_phone_number?: string;
        verified_name?: string;
        quality_rating?: string;
        status?: string;
      }>;
    }) | null;
    const phone = phonesPayload?.data?.find((item) => item.id === phoneNumberId);
    if (!phonesResponse.ok || !phone) {
      throw new Error(graphError(phonesPayload, "The selected phone number could not be verified"));
    }

    const pin = String(randomInt(0, 1000000)).padStart(6, "0");
    const registerResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messaging_product: "whatsapp", pin })
    });
    const registerPayload = (await registerResponse.json().catch(() => null)) as GraphError | null;
    if (!registerResponse.ok) {
      throw new Error(graphError(registerPayload, "The WhatsApp number could not be activated"));
    }

    const subscribeResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const subscribePayload = (await subscribeResponse.json().catch(() => null)) as GraphError | null;
    if (!subscribeResponse.ok) {
      throw new Error(graphError(subscribePayload, "Message delivery could not be activated"));
    }

    const integration = await saveWhatsAppIntegration({
      provider: "META_CLOUD_API",
      businessAccountId: wabaId,
      phoneNumberId,
      displayPhoneNumber: phone.display_phone_number || "",
      webhookVerifyToken: `sf-${randomBytes(24).toString("hex")}`,
      accessToken,
      notes: "Connected through guided WhatsApp onboarding",
      approvedBy: user.username,
      aiModeEnabled: true
    }, property.slug);
    if (integration.error) {
      throw new Error(integration.error);
    }

    const refreshedPhoneResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,status`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    const refreshedPhone = (await refreshedPhoneResponse.json().catch(() => null)) as (GraphError & {
      display_phone_number?: string;
      quality_rating?: string;
      status?: string;
    }) | null;
    const connected = refreshedPhoneResponse.ok && refreshedPhone?.status?.toUpperCase() === "CONNECTED";

    await saveOnboardingRegistrationPin(organization.id, pin);
    const updated = await updateOnboardingProfile(
      organization.id,
      {
        facebookStatus: "CONNECTED",
        metaStatus: connected ? "LIVE" : "REVIEW",
        metaBusinessId: null,
        wabaId,
        phoneNumberId,
        displayPhoneNumber: refreshedPhone?.display_phone_number || phone.display_phone_number || organization.onboarding.phoneNumber,
        qualityRating: refreshedPhone?.quality_rating || phone.quality_rating || "UNKNOWN",
        phoneVerificationStatus: "VERIFIED",
        webhookStatus: "CONNECTED",
        tokenStatus: "ACTIVE",
        lifecycleStatus: connected ? "LIVE" : "META_REVIEW",
        currentStep: connected ? 6 : 5,
        progressPercent: connected ? 100 : 92,
        lastStatusCheckAt: new Date(),
        lastError: null,
        completedAt: connected ? new Date() : null
      },
      { actorEmail: user.username, action: connected ? "WHATSAPP_LIVE" : "META_REVIEW_STARTED", detail: connected ? "WhatsApp messaging activated" : "WhatsApp activation is under review" }
    );

    if (connected) {
      await updateOrganizationStatus(organization.id, "ACTIVE");
    }

    return NextResponse.json({ organization: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp connection failed";
    await updateOnboardingProfile(
      organization.id,
      {
        metaStatus: "REJECTED",
        lifecycleStatus: "ACTION_REQUIRED",
        lastError: message.slice(0, 500),
        lastStatusCheckAt: new Date()
      },
      { actorEmail: user.username, action: "WHATSAPP_CONNECTION_FAILED", detail: message.slice(0, 500) }
    );
    console.error("Guided WhatsApp onboarding failed", {
      organizationId: organization.id,
      error: message
    });
    return NextResponse.json({ error: "We could not complete the WhatsApp connection. Our support team can help you continue." }, { status: 502 });
  }
}
