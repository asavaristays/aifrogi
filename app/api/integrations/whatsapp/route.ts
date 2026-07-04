import { NextResponse } from "next/server";
import { loadWhatsAppIntegration, saveWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export async function GET() {
  const workspace = await resolveClientWorkspaceAccess();
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  const integration = await loadWhatsAppIntegration(workspace.propertySlug);
  return NextResponse.json({ integration });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const workspace = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  const result = await saveWhatsAppIntegration(payload, workspace.propertySlug);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ integration: result.integration }, { status: result.status });
}
