import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { agentGatewayHeaders, authorizeAgentGatewayRequest } from "@/lib/agent-gateway";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { checkTenantStayAvailability } from "@/lib/tenant-availability";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";

const isoDate = /^20\d{2}-\d{2}-\d{2}$/;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + 60_000 }); return false; }
  current.count += 1;
  return current.count > 30;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const payload = await request.json().catch(() => null) as { destination?: string; checkIn?: string; checkOut?: string; adults?: number; children?: number } | null;
  const destination = String(payload?.destination || "").trim().slice(0, 80);
  const checkIn = String(payload?.checkIn || "");
  const checkOut = String(payload?.checkOut || "");
  const adults = Math.max(1, Math.min(20, Number(payload?.adults || 1)));
  const children = Math.max(0, Math.min(10, Number(payload?.children || 0)));
  if (!destination || !isoDate.test(checkIn) || !isoDate.test(checkOut) || checkOut <= checkIn) return NextResponse.json({ error: "Provide destination and valid ISO check-in/check-out dates." }, { status: 400, headers: agentGatewayHeaders() });
  const response = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Agent Gateway is temporarily unavailable." }, { status: 503, headers: agentGatewayHeaders() });
    const property = await db.property.findUnique({ where: { slug }, select: { organizationId: true, organization: { select: { botProfile: { select: { status: true, channels: true } } } } } });
    const profile = property?.organization?.botProfile;
    if (!property?.organizationId || !profile || !canServeWebsiteBot(profile.status, profile.channels)) return NextResponse.json({ error: "Agent Gateway is not enabled for this business." }, { status: 404, headers: agentGatewayHeaders() });
    const client = await authorizeAgentGatewayRequest({ organizationId: property.organizationId, request, scope: "availability:read" });
    if (!client) return NextResponse.json({ error: "A valid Agent Gateway credential with availability access is required." }, { status: 401, headers: { ...agentGatewayHeaders(), "WWW-Authenticate": "Bearer" } });
    if (rateLimited(`${property.organizationId}:${client.id}`)) return NextResponse.json({ error: "Agent Gateway rate limit reached. Retry in one minute." }, { status: 429, headers: agentGatewayHeaders() });
    const result = await checkTenantStayAvailability({ organizationId: property.organizationId, destination, checkIn, checkOut, adults, children }).catch(() => null);
    if (!result) return NextResponse.json({ error: "Live availability could not be verified. No availability or rate is being claimed." }, { status: 503, headers: agentGatewayHeaders() });
    return NextResponse.json({ ...result, source: "verified PMS availability", action: "read-only" }, { headers: agentGatewayHeaders() });
  });
  return response || NextResponse.json({ error: "Agent Gateway is not enabled for this business." }, { status: 404, headers: agentGatewayHeaders() });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { ...agentGatewayHeaders(), Allow: "POST, OPTIONS" } }); }
