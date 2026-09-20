import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { agentGatewayHeaders } from "@/lib/agent-gateway";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";
import { withPublicBotDatabaseContext } from "@/lib/security/tenant-database-context";

// Deliberately public, static discovery only. Live data and every action remain
// behind an issued, tenant-scoped Agent Gateway credential.
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const response = await withPublicBotDatabaseContext(slug, async () => {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Agent Gateway is temporarily unavailable." }, { status: 503, headers: agentGatewayHeaders() });
    const property = await db.property.findUnique({
      where: { slug },
      select: {
        slug: true, name: true, city: true, state: true, updatedAt: true,
        organization: { select: {
          id: true, name: true, industry: true, website: true, country: true, publicPhone: true, publicEmail: true, publicAddress: true, publicBusinessHours: true,
          botProfile: { select: { status: true, channels: true, category: true, personaName: true, languages: true, humanHandoffEnabled: true } },
          agentGatewayClients: { where: { enabled: true, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, select: { id: true }, take: 1 }
        } },
        knowledgeEntries: { where: { status: "APPROVED" }, orderBy: { updatedAt: "desc" }, take: 40, select: { question: true, answer: true, category: true, updatedAt: true } }
      }
    });
    const organization = property?.organization;
    const profile = organization?.botProfile;
    if (!property || !organization || !profile || !canServeWebsiteBot(profile.status, profile.channels) || !organization.agentGatewayClients.length) {
      return NextResponse.json({ error: "Agent discovery is not enabled for this business." }, { status: 404, headers: agentGatewayHeaders() });
    }
    const generatedAt = new Date().toISOString();
    return NextResponse.json({
      version: "aifrogi-agent-gateway/v1",
      kind: "business-discovery-profile",
      business: {
        name: organization.name,
        category: profile.category,
        industry: organization.industry || undefined,
        website: organization.website || undefined,
        country: organization.country,
        address: organization.publicAddress || undefined,
        phone: organization.publicPhone || undefined,
        email: organization.publicEmail || undefined,
        businessHours: organization.publicBusinessHours || undefined
      },
      property: { name: property.name, slug: property.slug, city: property.city || undefined, state: property.state || undefined },
      agentGateway: {
        liveData: { availability: "authenticated" },
        actions: [],
        authentication: "Bearer tenant-scoped Agent Gateway credential",
        supportedScopes: ["profile:read", "availability:read"],
        bookingAndPayment: "not available through this release",
        humanHandoffAvailable: profile.humanHandoffEnabled,
        languages: profile.languages
      },
      facts: property.knowledgeEntries.map((item) => ({ question: item.question, answer: item.answer, category: item.category, updatedAt: item.updatedAt.toISOString() })),
      provenance: { source: "tenant-approved AiFrogi knowledge", generatedAt, profileUpdatedAt: property.updatedAt.toISOString() }
    }, { headers: agentGatewayHeaders() });
  });
  return response || NextResponse.json({ error: "Agent discovery is not enabled for this business." }, { status: 404, headers: agentGatewayHeaders() });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { ...agentGatewayHeaders(), Allow: "GET, OPTIONS" } }); }
