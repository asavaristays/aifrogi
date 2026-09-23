import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { getDb } from "@/lib/db";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

type AccessRow = { id: string; guestName: string; roomNumber: string; requestedCheckIn: Date; requestedCheckOut: Date; approvedCheckOut: Date | null; status: string; reviewedBy: string | null; reviewedAt: Date | null; revokedAt: Date | null; leadId: string | null; createdAt: Date };

export async function GET(request: Request) {
  const access = await resolveClientWorkspaceAccess({ propertySlug: new URL(request.url).searchParams.get("propertySlug") });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `hotelgpt-access:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    if (access.organization.botProfile?.category !== "STAY" || !access.organization.botProfile.stayAccessEnabled) return NextResponse.json({ error: "HotelGPT in-stay access is not enabled for this workspace." }, { status: 404 });
    const items = await db.$queryRaw<AccessRow[]>`SELECT id,"guestName","roomNumber","requestedCheckIn","requestedCheckOut","approvedCheckOut",status,"reviewedBy","reviewedAt","revokedAt","leadId","createdAt" FROM "HotelGuestAccessRequest" WHERE "propertyId"=${access.propertyId} ORDER BY status ASC,"createdAt" DESC LIMIT 100`;
    return NextResponse.json({ canApprove: ["OWNER", "ADMIN"].includes(access.role), items: items.map(item => ({ ...item, requestedCheckIn: item.requestedCheckIn.toISOString(), requestedCheckOut: item.requestedCheckOut.toISOString(), approvedCheckOut: item.approvedCheckOut?.toISOString() || null, status: item.revokedAt ? "REVOKED" : item.status === "APPROVED" && item.approvedCheckOut && item.approvedCheckOut <= new Date() ? "EXPIRED" : item.status, reviewedAt: item.reviewedAt?.toISOString() || null, createdAt: item.createdAt.toISOString() })) }, { headers: { "Cache-Control": "private, no-store" } });
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { propertySlug?: string; requestId?: string; action?: string; approvedCheckOut?: string; reason?: string } | null;
  const access = await resolveClientWorkspaceAccess({ propertySlug: body?.propertySlug, requireManage: true });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `hotelgpt-access-review:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    if (access.organization.botProfile?.category !== "STAY" || !access.organization.botProfile.stayAccessEnabled) return NextResponse.json({ error: "HotelGPT in-stay access is not enabled for this workspace." }, { status: 404 });
    const rows = await db.$queryRaw<AccessRow[]>`SELECT id,"guestName","roomNumber","requestedCheckIn","requestedCheckOut","approvedCheckOut",status,"reviewedBy","reviewedAt","revokedAt","leadId","createdAt" FROM "HotelGuestAccessRequest" WHERE id=${String(body?.requestId || "")} AND "propertyId"=${access.propertyId} LIMIT 1`;
    const item = rows[0]; if (!item) return NextResponse.json({ error: "Access request not found" }, { status: 404 });
    const action = String(body?.action || ""); const now = new Date();
    if (action === "APPROVE") {
      const approvedCheckOut = new Date(String(body?.approvedCheckOut || item.requestedCheckOut.toISOString()));
      if (Number.isNaN(approvedCheckOut.getTime()) || approvedCheckOut <= now || approvedCheckOut <= item.requestedCheckIn || approvedCheckOut.getTime() - item.requestedCheckIn.getTime() > 31 * 86_400_000) return NextResponse.json({ error: "Choose a valid future checkout within 31 days of check-in." }, { status: 400 });
      await db.$transaction(async tx => { const changed = await tx.$executeRaw`UPDATE "HotelGuestAccessRequest" SET status='APPROVED',"approvedCheckOut"=${approvedCheckOut},"reviewedBy"=${access.user.username},"reviewedAt"=${now},"rejectionReason"=NULL,"updatedAt"=NOW() WHERE id=${item.id} AND "propertyId"=${access.propertyId} AND status='PENDING' AND "revokedAt" IS NULL`; if (!changed) throw new Error("Request already reviewed"); await tx.platformAuditLog.create({ data: { organizationId: access.organization.id, actorEmail: access.user.username, actorRole: access.role, action: "HOTELGPT_GUEST_ACCESS_APPROVED", targetType: "HOTEL_GUEST_ACCESS", targetId: item.id, summary: `Front desk approved room ${item.roomNumber} until ${approvedCheckOut.toISOString()}.`, metadata: { propertyId: access.propertyId } } }); });
    } else if (action === "REJECT") {
      const reason = String(body?.reason || "Front desk could not approve the submitted stay details.").slice(0, 300);
      await db.$transaction(async tx => { const changed = await tx.$executeRaw`UPDATE "HotelGuestAccessRequest" SET status='REJECTED',"reviewedBy"=${access.user.username},"reviewedAt"=${now},"rejectionReason"=${reason},"updatedAt"=NOW() WHERE id=${item.id} AND "propertyId"=${access.propertyId} AND status='PENDING' AND "revokedAt" IS NULL`; if (!changed) throw new Error("Request already reviewed"); await tx.platformAuditLog.create({ data: { organizationId: access.organization.id, actorEmail: access.user.username, actorRole: access.role, action: "HOTELGPT_GUEST_ACCESS_REJECTED", targetType: "HOTEL_GUEST_ACCESS", targetId: item.id, summary: `Front desk rejected room ${item.roomNumber} access.`, metadata: { propertyId: access.propertyId } } }); });
    } else if (action === "REVOKE") {
      await db.$transaction(async tx => { const changed = await tx.$executeRaw`UPDATE "HotelGuestAccessRequest" SET "revokedAt"=${now},"revokedBy"=${access.user.username},"updatedAt"=NOW() WHERE id=${item.id} AND "propertyId"=${access.propertyId} AND status='APPROVED' AND "revokedAt" IS NULL`; if (!changed) throw new Error("Only active access can be revoked"); if (item.leadId) await tx.websiteVisitorSession.updateMany({ where: { leadId: item.leadId }, data: { revokedAt: now, status: "CLOSED" } }); await tx.platformAuditLog.create({ data: { organizationId: access.organization.id, actorEmail: access.user.username, actorRole: access.role, action: "HOTELGPT_GUEST_ACCESS_REVOKED", targetType: "HOTEL_GUEST_ACCESS", targetId: item.id, summary: `Front desk revoked room ${item.roomNumber} access.`, metadata: { propertyId: access.propertyId } } }); });
    } else return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    return NextResponse.json({ ok: true });
  });
}
