import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess, withClientDatabaseContext } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { levelOneStatus, retryLevelOne } from "@/lib/services/level-one-preparation";
import { consumeRateLimit } from "@/lib/rate-limit";

async function respond(retry: boolean) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (retry && !canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  const slug = await getCurrentWorkspaceSlug();
  return withClientDatabaseContext(access, "onboarding-intelligence", async () => {
    const property = await getDb()?.property.findFirst({ where: { slug, organizationId: access.organization.id }, select: { id: true } });
    if (!property) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    if (retry && !consumeRateLimit(`level-one-retry:${property.id}`, 3, 3600000).allowed) return NextResponse.json({ error: "Please wait before retrying preparation again." }, { status: 429 });
    try {
      return NextResponse.json({ preparation: retry ? await retryLevelOne(property.id) : await levelOneStatus(property.id) }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Preparation status unavailable." }, { status: 409 });
    }
  });
}

export const GET = () => respond(false);
export function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!origin || origin !== new URL(expected).origin) return NextResponse.json({ error: "Request origin not accepted." }, { status: 403 });
  return respond(true);
}
