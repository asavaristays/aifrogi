import { NextResponse } from "next/server";
import { createFlowCartOrder } from "@/lib/services/flowcart-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid FlowCart webhook JSON payload." }, { status: 400 });
  }

  const flowData = payload.flowData && typeof payload.flowData === "object"
    ? payload.flowData as Record<string, unknown>
    : payload;

  const result = await createFlowCartOrder({
    propertySlug: typeof flowData.propertySlug === "string" ? flowData.propertySlug : "hotelradar",
    customerName: typeof flowData.customerName === "string" ? flowData.customerName : "WhatsApp Customer",
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
}
