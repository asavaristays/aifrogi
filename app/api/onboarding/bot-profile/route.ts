import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getMemberRoleByEmail, getOrganizationForMember, saveClientBotPersona } from "@/lib/repositories/onboarding-repository";
import { normalizeCapabilitiesForCategory, parseBotProfile } from "@/lib/bot-profile";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return NextResponse.json({ error: "Client access required" }, { status: 403 });
  const [role, organization] = await Promise.all([getMemberRoleByEmail(user.username), getOrganizationForMember(user.username)]);
  if (!organization?.botProfile) return NextResponse.json({ error: "AiFrogi SuperAdmin must create the bot blueprint first." }, { status: 409 });
  if (role !== "OWNER" && role !== "ADMIN") return NextResponse.json({ error: "Client Admin access required" }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const governedCapabilities = normalizeCapabilitiesForCategory(organization.botProfile.category, organization.botProfile.capabilities);
  const parsed = parseBotProfile({ ...organization.botProfile, ...(payload && typeof payload === "object" ? payload : {}), category: organization.botProfile.category, operatingMode: organization.botProfile.operatingMode, channels: organization.botProfile.channels, capabilities: governedCapabilities, humanHandoffEnabled: organization.botProfile.humanHandoffEnabled, actionApprovalNeeded: organization.botProfile.actionApprovalNeeded });
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { personaName, businessObjective, tone, languages, prohibitedClaims, escalationTriggers, responseSlaMinutes, reminderPercent, fallbackEnabled, safeFallbackMessage } = parsed.value;
  const updated = await saveClientBotPersona({ organizationId: organization.id, actorEmail: user.username, governedCapabilities, persona: { personaName, businessObjective, tone, languages, prohibitedClaims, escalationTriggers, responseSlaMinutes, reminderPercent, fallbackEnabled, safeFallbackMessage } });
  return NextResponse.json({ organization: updated });
}
