import { NextResponse } from "next/server";
import { getFlowCartWorkspace } from "@/lib/services/flowcart-service";
import { withPropertyDatabaseContext } from "@/lib/security/tenant-database-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const propertySlug = url.searchParams.get("propertySlug") || "hotelradar";
  const response = await withPropertyDatabaseContext(propertySlug, `flowcart:catalog:${propertySlug}`, async () => {
    const workspace = await getFlowCartWorkspace(propertySlug);
    return NextResponse.json({
    tenant: workspace.tenant,
    products: workspace.products
  });
  });
  return response || NextResponse.json({ error: "Storefront not found." }, { status: 404 });
}
