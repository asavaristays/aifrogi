import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { inviteTeamMember, listTeamMembers, updateTeamMember } from "@/lib/repositories/team-repository";
import { sendBookingMail } from "@/lib/services/mailbox-service";

export async function GET() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  return NextResponse.json({ members: await listTeamMembers(access.organization.id) });
}

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { email?: string; name?: string; role?: string } | null;
  try {
    const invitation = await inviteTeamMember({ organizationId: access.organization.id, email: payload?.email || "", name: payload?.name || "", role: payload?.role || "AGENT", invitedBy: access.user.username });
    const appUrl = process.env.AIFROGI_APP_URL?.trim() || new URL(request.url).origin;
    const invitationUrl = `${appUrl.replace(/\/+$/, "")}/activate?token=${encodeURIComponent(invitation.token)}`;
    let emailSent = false;
    try {
      const result = await sendBookingMail({
        to: invitation.member.email,
        subject: `Join ${access.organization.name} on AiFrogi`,
        body: `Hello${invitation.member.name ? ` ${invitation.member.name}` : ""},\n\nYou have been invited to ${access.organization.name} on AiFrogi as ${invitation.member.role}.\n\nCreate your password within 72 hours:\n${invitationUrl}\n\nIf you were not expecting this invitation, you can ignore this email. Never share OTPs, passwords, or Meta credentials.\n\nAiFrogi`
      });
      emailSent = !result.error;
    } catch {
      emailSent = false;
    }
    return NextResponse.json({ ok: true, member: { id: invitation.member.id, email: invitation.member.email, name: invitation.member.name, role: invitation.member.role, status: invitation.member.status, invitationExpiresAt: invitation.expiresAt }, invitationUrl, emailSent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not invite this team member." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { memberId?: string; role?: string; status?: string } | null;
  try {
    const member = await updateTeamMember({ organizationId: access.organization.id, memberId: payload?.memberId || "", role: payload?.role, status: payload?.status });
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update this team member." }, { status: 400 });
  }
}

