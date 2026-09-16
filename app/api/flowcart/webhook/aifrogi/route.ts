import { NextResponse } from "next/server";
import { createFlowCartOrder } from "@/lib/services/flowcart-service";
import { timingSafeEqual } from "node:crypto";
import { withPropertyDatabaseContext } from "@/lib/security/tenant-database-context";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.FLOWCART_INTERNAL_TOKEN?.trim() || process.env.AIFROGI_INTERNAL_API_TOKEN?.trim() || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected), right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid FlowCart webhook JSON payload." }, { status: 400 });
  }

  const flowData = payload.flowData && typeof payload.flowData === "object"
    ? payload.flowData as Record<string, unknown>
    : payload;

  const propertySlug = typeof flowData.propertySlug === "string" ? flowData.propertySlug : "hotelradar";
  const response = await withPropertyDatabaseContext(propertySlug, "flowcart:aifrogi-webhook", async () => {
  const result = await createFlowCartOrder({
    propertySlug,
    customerName: typeof flowData.customerName === "string" ? flowData.customerName : "AI Bot Customer",
    customerPhone: typeof flowData.customerPhone === "string" ? flowData.customerPhone : "",
    productId: typeof flowData.productId === "string" ? flowData.productId : "cake-signature-chocolate",
    variantId: typeof flowData.variantId === "string" ? flowData.variantId : undefined,
    addonIds: Array.isArray(flowData.addonIds) ? flowData.addonIds.filter((item): item is string => typeof item === "string") : [],
    quantity: typeof flowData.quantity === "number" ? flowData.quantity : Number(flowData.quantity || 1),
    deliveryDate: typeof flowData.deliveryDate === "string" ? flowData.deliveryDate : undefined,
    deliverySlot: typeof flowData.deliverySlot === "string" ? flowData.deliverySlot : undefined,
    deliveryAddress: {
      line1: typeof flowData.address === "string" ? flowData.address : undefined,
      city: typeof flowData.city === "string" ? flowData.city : undefined,
      pincode: typeof flowData.pincode === "string" ? flowData.pincode : undefined
    },
    message: typeof flowData.message === "string" ? flowData.message : undefined,
    notes: typeof flowData.notes === "string" ? flowData.notes : undefined
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, result }, { status: result.status });
  });
  return response || NextResponse.json({ error: "Storefront not found." }, { status: 404 });
}
