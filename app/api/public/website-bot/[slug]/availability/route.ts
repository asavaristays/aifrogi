import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { checkTenantStayAvailability } from "@/lib/tenant-availability";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const isoDate = /^20\d{2}-\d{2}-\d{2}$/;

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => null) as { destination?: string; checkIn?: string; checkOut?: string; adults?: number; children?: number } | null;
  const destination = String(body?.destination || "").trim().slice(0, 80);
  const checkIn = String(body?.checkIn || "");
  const checkOut = String(body?.checkOut || "");
  const adults = Math.max(1, Math.min(20, Number(body?.adults || 1)));
  const children = Math.max(0, Math.min(10, Number(body?.children || 0)));
  if (!destination || !isoDate.test(checkIn) || !isoDate.test(checkOut) || checkOut <= checkIn) return NextResponse.json({ error: "Choose a destination and valid stay dates." }, { status: 400, headers });
  const nights = Math.round((new Date(`${checkOut}T00:00:00Z`).getTime() - new Date(`${checkIn}T00:00:00Z`).getTime()) / 86_400_000);
  if (nights < 1 || nights > 31) return NextResponse.json({ error: "Choose a stay between 1 and 31 nights." }, { status: 400, headers });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Live availability is temporarily unavailable." }, { status: 503, headers });
  const property = await db.property.findUnique({ where: { slug }, select: { organizationId: true, organization: { select: { botProfile: { select: { status: true, channels: true } } } } } });
  const profile = property?.organization?.botProfile;
  if (!property?.organizationId || !profile || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Website bot is not enabled." }, { status: 404, headers });
  const result = await checkTenantStayAvailability({ organizationId: property.organizationId, destination, checkIn, checkOut, adults, children }).catch(() => null);
  if (!result) return NextResponse.json({ error: "Live availability could not be verified. Please retry or ask the reservations team." }, { status: 503, headers });
  return NextResponse.json(result, { headers });
}
