import { NextResponse } from "next/server";
import { validateWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function POST() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const result = await validateWhatsAppIntegration(propertySlug);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ phone: result.phone }, { status: 200 });
}
