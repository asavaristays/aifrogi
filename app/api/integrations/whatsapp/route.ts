import { NextResponse } from "next/server";
import { loadWhatsAppIntegration, saveWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const integration = await loadWhatsAppIntegration(propertySlug);
  return NextResponse.json({ integration });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const propertySlug = await getCurrentWorkspaceSlug();
  const result = await saveWhatsAppIntegration(payload, propertySlug);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ integration: result.integration }, { status: result.status });
}
