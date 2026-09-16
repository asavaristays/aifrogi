import { NextResponse } from "next/server";
import { getFlowCartWorkspace } from "@/lib/services/flowcart-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const propertySlug = url.searchParams.get("propertySlug") || "hotelradar";
  const access = await resolveClientWorkspaceAccess({ propertySlug });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const workspace = await getFlowCartWorkspace(propertySlug);
  return NextResponse.json(workspace);
}
