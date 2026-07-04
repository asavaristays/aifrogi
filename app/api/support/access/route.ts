import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import {
  grantSupportAccess,
  listSupportAccessEvents,
  listSupportAccessGrants,
  normalizeSupportAccessScopes,
  revokeSupportAccess
} from "@/lib/support-access";

const allowedDurations = new Set([30, 120, 1440]);

function serializeGrant(grant: Awaited<ReturnType<typeof listSupportAccessGrants>>[number]) {
  return {
    ...grant,
    grantedAt: grant.grantedAt.toISOString(),
    expiresAt: grant.expiresAt.toISOString(),
    revokedAt: grant.revokedAt?.toISOString() || null
  };
}

function serializeEvent(event: Awaited<ReturnType<typeof listSupportAccessEvents>>[number]) {
  return {
    ...event,
    createdAt: event.createdAt.toISOString()
  };
}

export async function GET() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [grants, events] = await Promise.all([
    listSupportAccessGrants(access.organization.id),
    listSupportAccessEvents(access.organization.id)
  ]);
  return NextResponse.json({
    grants: grants.map(serializeGrant),
    events: events.map(serializeEvent)
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) {
    return NextResponse.json({ error: "Owner or workspace admin access is required." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(payload?.action || "").trim().toUpperCase();

  if (action === "REVOKE") {
    const grantId = String(payload?.grantId || "").trim();
    if (!grantId) return NextResponse.json({ error: "Grant id is required." }, { status: 400 });
    const revoked = await revokeSupportAccess({
      organizationId: access.organization.id,
      grantId,
      actorEmail: access.user.username,
      actorRole: access.role
    });
    if (!revoked) return NextResponse.json({ error: "Support access grant not found." }, { status: 404 });
  } else if (action === "GRANT") {
    const scopes = normalizeSupportAccessScopes(payload?.scopes);
    const durationMinutes = Number(payload?.durationMinutes || 30);
    const reason = String(payload?.reason || "").trim();
    const ticketId = String(payload?.ticketId || "").trim();
    if (!scopes.length) return NextResponse.json({ error: "Choose at least one access scope." }, { status: 400 });
    if (!allowedDurations.has(durationMinutes)) return NextResponse.json({ error: "Choose a valid access duration." }, { status: 400 });
    if (reason.length < 8) return NextResponse.json({ error: "Add a short reason for the support access grant." }, { status: 400 });
    await grantSupportAccess({
      organizationId: access.organization.id,
      actorEmail: access.user.username,
      actorRole: access.role,
      scopes,
      durationMinutes,
      reason,
      ticketId: ticketId || null
    });
  } else {
    return NextResponse.json({ error: "Unknown support access action." }, { status: 400 });
  }

  const [grants, events] = await Promise.all([
    listSupportAccessGrants(access.organization.id),
    listSupportAccessEvents(access.organization.id)
  ]);
  return NextResponse.json({
    grants: grants.map(serializeGrant),
    events: events.map(serializeEvent)
  }, { headers: { "Cache-Control": "no-store" } });
}
