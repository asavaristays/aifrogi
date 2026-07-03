import { NextResponse } from "next/server";
import { activateInvitation, getInvitation } from "@/lib/repositories/team-repository";
import { SELF_SERVICE_REGISTRATION } from "@/lib/repositories/trial-registration-repository";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const invitation = await getInvitation(token);
  if (!invitation || invitation.status !== "INVITED" || !invitation.invitationExpiresAt || invitation.invitationExpiresAt < new Date()) return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 404 });
  return NextResponse.json({ email: invitation.email, name: invitation.name, role: invitation.role, organizationName: invitation.organization.name, expiresAt: invitation.invitationExpiresAt, registration: invitation.invitedBy === SELF_SERVICE_REGISTRATION }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { token?: string; password?: string } | null;
  try {
    const member = await activateInvitation(payload?.token || "", payload?.password || "");
    return NextResponse.json({ ok: true, email: member.email, registration: member.registration });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not activate this account." }, { status: 400 });
  }
}
