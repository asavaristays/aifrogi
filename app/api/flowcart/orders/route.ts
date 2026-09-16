import { NextResponse } from "next/server";
import {
  createFlowCartOrder,
  getFlowCartWorkspace,
  type FlowCartCreateOrderInput
} from "@/lib/services/flowcart-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withPropertyDatabaseContext } from "@/lib/security/tenant-database-context";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

function internalAuthorized(request: Request) {
  const expected = process.env.FLOWCART_INTERNAL_TOKEN?.trim() || process.env.AIFROGI_INTERNAL_API_TOKEN?.trim() || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected), right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const propertySlug = url.searchParams.get("propertySlug") || "hotelradar";
  const access = await resolveClientWorkspaceAccess({ propertySlug });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const workspace = await getFlowCartWorkspace(propertySlug);
  return NextResponse.json({
    tenant: workspace.tenant,
    metrics: workspace.metrics,
    orders: workspace.orders
  });
}

export async function POST(request: Request) {
  if (!internalAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let payload: FlowCartCreateOrderInput;
  try {
    payload = await request.json() as FlowCartCreateOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid FlowCart order JSON payload." }, { status: 400 });
  }

  if (!payload.customerName?.trim()) {
    return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  }
  if (!payload.customerPhone?.trim()) {
    return NextResponse.json({ error: "Customer phone is required." }, { status: 400 });
  }
  if (!payload.productId?.trim()) {
    return NextResponse.json({ error: "Product is required." }, { status: 400 });
  }

  const propertySlug = String(payload.propertySlug || "").trim();
  const response = await withPropertyDatabaseContext(propertySlug, "flowcart:internal-order", async () => {
    const result = await createFlowCartOrder(payload);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: result.status });
  });
  return response || NextResponse.json({ error: "Storefront not found." }, { status: 404 });
}
