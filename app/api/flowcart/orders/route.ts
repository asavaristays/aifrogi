import { NextResponse } from "next/server";
import {
  createFlowCartOrder,
  getFlowCartWorkspace,
  type FlowCartCreateOrderInput
} from "@/lib/services/flowcart-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const propertySlug = url.searchParams.get("propertySlug") || "hotelradar";
  const workspace = await getFlowCartWorkspace(propertySlug);
  return NextResponse.json({
    tenant: workspace.tenant,
    metrics: workspace.metrics,
    orders: workspace.orders
  });
}

export async function POST(request: Request) {
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

  const result = await createFlowCartOrder(payload);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result, { status: result.status });
}
