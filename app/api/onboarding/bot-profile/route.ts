import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { parseBotProfile } from "@/lib/bot-profile";
import { getOrganizationForMember, saveOrganizationBotProfile } from "@/lib/repositories/onboarding-repository";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return NextResponse.json({ error: "Client access required" }, { status: 403 });
  const organization = await getOrganizationForMember(user.username);
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const parsed = parseBotProfile(await request.json().catch(() => null));
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const updated = await saveOrganizationBotProfile({ organizationId: organization.id, actorEmail: user.username, profile: parsed.value });
  return NextResponse.json({ organization: updated });
}
