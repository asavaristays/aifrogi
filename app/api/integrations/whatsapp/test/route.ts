import { NextResponse } from "next/server";
import { sendWhatsAppTestMessage } from "@/lib/services/whatsapp-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const to = typeof payload?.to === "string" ? payload.to.trim() : "";
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  const workspace = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload?.propertySlug === "string" ? payload.propertySlug : null,
    requireManage: true
  });
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  const result = await sendWhatsAppTestMessage({
    to,
    message,
    propertySlug: workspace.propertySlug,
    operatorId: "lead-os-settings-test"
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ result: result.result }, { status: result.status });
}
