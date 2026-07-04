import { NextResponse } from "next/server";
import { validateWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export async function POST() {
  const workspace = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  const result = await validateWhatsAppIntegration(workspace.propertySlug);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ phone: result.phone }, { status: 200 });
}
