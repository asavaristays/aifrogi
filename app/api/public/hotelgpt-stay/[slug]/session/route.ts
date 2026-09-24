import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hashHotelGuestRequestToken, issueHotelGuestRequestToken, issueHotelGuestStayToken, validateHotelGuestStayInput, verifyHotelGuestRequestToken } from "@/lib/hotelgpt-stay-session";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { randomUUID } from "node:crypto";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const requestTtl = 36 * 60 * 60;
function ip(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"; }

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!consumeRateLimit(`hotelgpt-stay:${slug}:${ip(request)}`, 8, 15 * 60_000).allowed) return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429, headers });
  const body = await request.json().catch(() => null) as { roomNumber?: unknown; guestName?: unknown; phoneNumber?: unknown; checkIn?: unknown; checkOut?: unknown } | null;
  const response = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Resident access is temporarily unavailable." }, { status: 503, headers });
    const property = await db.property.findUnique({ where: { slug }, select: { id: true, organization: { select: { botProfile: { select: { category: true, status: true, channels: true, stayAccessEnabled: true } } } } } });
    const profile = property?.organization?.botProfile;
    if (!property || !profile || profile.category !== "STAY" || !profile.stayAccessEnabled || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Resident access is not enabled for this property." }, { status: 404, headers });
    const result = validateHotelGuestStayInput({ roomNumber: body?.roomNumber, guestName: body?.guestName, phoneNumber: body?.phoneNumber, checkIn: body?.checkIn, checkOut: body?.checkOut });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers });
    const requestId = randomUUID();
    const requestToken = issueHotelGuestRequestToken({ slug, requestId, exp: Math.floor(Date.now() / 1000) + requestTtl });
    await db.$executeRaw`INSERT INTO "HotelGuestAccessRequest" ("id","propertyId","requestTokenHash","guestName","phoneNumber","roomNumber","requestedCheckIn","requestedCheckOut","status","createdAt","updatedAt") VALUES (${requestId},${property.id},${hashHotelGuestRequestToken(requestToken)},${result.value.guestName},${result.value.phoneNumber},${result.value.roomNumber},${result.value.requestedCheckIn},${result.value.requestedCheckOut},'PENDING',NOW(),NOW())`;
    return NextResponse.json({ requestToken, status: "PENDING", message: "Request submitted. Awaiting front desk approval." }, { status: 202, headers });
  });
  return response || NextResponse.json({ error: "Resident access is not enabled for this property." }, { status: 404, headers });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!consumeRateLimit(`hotelgpt-status:${slug}:${ip(request)}`, 60, 15 * 60_000).allowed) return NextResponse.json({ error: "Please wait before checking again." }, { status: 429, headers });
  const requestToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const capability = verifyHotelGuestRequestToken(requestToken, slug);
  if (!capability) return NextResponse.json({ error: "Access request is invalid or expired." }, { status: 401, headers });
  const response = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Resident access is temporarily unavailable." }, { status: 503, headers });
    const property = await db.property.findUnique({ where: { slug }, select: { organization: { select: { botProfile: { select: { category: true, status: true, channels: true, stayAccessEnabled: true } } } } } });
    const profile = property?.organization?.botProfile;
    if (!profile || profile.category !== "STAY" || !profile.stayAccessEnabled || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Resident access is not enabled for this property." }, { status: 404, headers });
    const rows = await db.$queryRaw<Array<{ id: string; roomNumber: string; guestName: string; phoneNumber: string; requestedCheckIn: Date; approvedCheckOut: Date | null; status: string; activatedAt: Date | null; revokedAt: Date | null }>>`SELECT r."id",r."roomNumber",r."guestName",r."phoneNumber",r."requestedCheckIn",r."approvedCheckOut",r."status",r."activatedAt",r."revokedAt" FROM "HotelGuestAccessRequest" r JOIN "Property" p ON p.id=r."propertyId" WHERE r.id=${capability.requestId} AND p.slug=${slug} AND r."requestTokenHash"=${hashHotelGuestRequestToken(requestToken)} LIMIT 1`;
    const item = rows[0];
    if (!item) return NextResponse.json({ error: "Access request was not found." }, { status: 404, headers });
    if (item.status === "APPROVED" && item.approvedCheckOut && item.approvedCheckOut > new Date() && !item.revokedAt) {
      const stayAccessToken = issueHotelGuestStayToken({ slug, requestId: item.id, roomNumber: item.roomNumber, guestName: item.guestName, phoneNumber: item.phoneNumber, checkIn: item.requestedCheckIn.toISOString(), checkOut: item.approvedCheckOut.toISOString(), exp: Math.floor(item.approvedCheckOut.getTime() / 1000) });
      if (!item.activatedAt) await db.$executeRaw`UPDATE "HotelGuestAccessRequest" SET "activatedAt"=NOW(),"updatedAt"=NOW() WHERE id=${item.id} AND "activatedAt" IS NULL`;
      return NextResponse.json({ status: "APPROVED", stayAccessToken, validUntil: item.approvedCheckOut.toISOString(), roomNumber: item.roomNumber, guestName: item.guestName }, { headers });
    }
    const status = item.revokedAt ? "REVOKED" : item.status === "APPROVED" ? "EXPIRED" : item.status;
    const message = status === "PENDING" ? "Awaiting front desk approval." : status === "REJECTED" ? "The front desk did not approve this request. Please contact the hotel." : "Your in-stay access has ended.";
    return NextResponse.json({ status, message }, { headers });
  });
  return response || NextResponse.json({ error: "Resident access is not enabled." }, { status: 404, headers });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!consumeRateLimit(`hotelgpt-resolution:${slug}:${ip(request)}`, 20, 15 * 60_000).allowed) return NextResponse.json({ error: "Please wait before updating again." }, { status: 429, headers });
  const stayToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const { verifyHotelGuestStayToken } = await import("@/lib/hotelgpt-stay-session");
  const capability = verifyHotelGuestStayToken(stayToken, slug);
  if (!capability) return NextResponse.json({ error: "In-stay access is invalid or expired." }, { status: 401, headers });
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== "CONFIRM_RESOLUTION" && body?.action !== "REOPEN") return NextResponse.json({ error: "Choose a valid resolution action." }, { status: 400, headers });
  const response = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Resident access is temporarily unavailable." }, { status: 503, headers });
    const rows = await db.$queryRaw<Array<{ leadId: string | null }>>`SELECT r."leadId" FROM "HotelGuestAccessRequest" r JOIN "Property" p ON p.id=r."propertyId" WHERE r.id=${capability.requestId} AND p.slug=${slug} AND r.status='APPROVED' AND r."revokedAt" IS NULL AND r."approvedCheckOut">NOW() LIMIT 1`;
    const leadId = rows[0]?.leadId;
    if (!leadId) return NextResponse.json({ error: "No in-stay request is available to update yet." }, { status: 404, headers });
    const stage = body.action === "CONFIRM_RESOLUTION" ? "BOOKED" : "NEW";
    await db.$executeRaw`UPDATE "Lead" SET stage=${stage}::"LeadStage","updatedAt"=NOW() WHERE id=${leadId}`;
    return NextResponse.json({ ok: true, status: body.action === "CONFIRM_RESOLUTION" ? "RESOLVED" : "REOPENED" }, { headers });
  });
  return response || NextResponse.json({ error: "Resident access is not enabled." }, { status: 404, headers });
}
