import { NextResponse } from "next/server";
import { getFlowCartWorkspace } from "@/lib/services/flowcart-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const propertySlug = url.searchParams.get("propertySlug") || "hotelradar";
  const workspace = await getFlowCartWorkspace(propertySlug);
  return NextResponse.json({
    tenant: workspace.tenant,
    products: workspace.products
  });
}
