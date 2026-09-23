import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { issueHotelGuestStayToken, validateHotelGuestStayInput } from "@/lib/hotelgpt-stay-session";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!consumeRateLimit(`hotelgpt-stay:${slug}:${ip}`, 8, 15 * 60_000).allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429, headers });
  }
  const body = await request.json().catch(() => null) as { roomNumber?: unknown; guestName?: unknown; checkIn?: unknown; checkOut?: unknown } | null;
  const response = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Resident access is temporarily unavailable." }, { status: 503, headers });
    const property = await db.property.findUnique({ where: { slug }, select: { timezone: true, organization: { select: { botProfile: { select: { category: true, status: true, channels: true } } } } } });
    const profile = property?.organization?.botProfile;
    if (!property || !profile || profile.category !== "STAY" || !canServeWebsiteBot(profile.status, profile.channels)) {
      return NextResponse.json({ error: "Resident access is not enabled for this property." }, { status: 404, headers });
    }
    const result = validateHotelGuestStayInput({ roomNumber: body?.roomNumber, guestName: body?.guestName, checkIn: body?.checkIn, checkOut: body?.checkOut }, property.timezone);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers });
    const token = issueHotelGuestStayToken({ slug, ...result.value });
    return NextResponse.json({ stayAccessToken: token, validUntil: new Date(result.value.exp * 1000).toISOString(), guest: { name: result.value.guestName, roomNumber: result.value.roomNumber, checkOut: result.value.checkOut }, verification: "GUEST_DECLARED" }, { headers });
  });
  return response || NextResponse.json({ error: "Resident access is not enabled for this property." }, { status: 404, headers });
}
