import { NextResponse } from "next/server";
import { sendWhatsAppTestMessage } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, unknown> | null = null;
  let attachment: { name: string; mimeType: string; bytes: Uint8Array } | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    payload = Object.fromEntries(
      Array.from(formData.entries())
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => [key, String(value)])
    );
    const file = formData.get("attachment");
    if (file instanceof File && file.size > 0) {
      attachment = {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes: new Uint8Array(await file.arrayBuffer())
      };
    }
  } else {
    payload = await request.json().catch(() => null);
  }

  const to = typeof payload?.to === "string" ? payload.to : "";
  const message = typeof payload?.message === "string" ? payload.message : "";
  const leadId = typeof payload?.leadId === "string" ? payload.leadId : "";
  const propertyId = typeof payload?.propertyId === "string" ? payload.propertyId : "";
  const selectedWorkspaceSlug = await getCurrentWorkspaceSlug();
  const propertySlug = typeof payload?.propertySlug === "string" && payload.propertySlug.trim()
    ? payload.propertySlug.trim()
    : selectedWorkspaceSlug;
  const operatorId = typeof payload?.operatorId === "string" ? payload.operatorId : "lead-os-operator";
  const conversationId = typeof payload?.conversationId === "string" ? payload.conversationId : "";

  const result = await sendWhatsAppTestMessage({
    to,
    message,
    leadId,
    propertyId,
    propertySlug,
    operatorId,
    conversationId,
    attachment
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      lead: result.result?.lead ?? null,
      result: result.result
    },
    { status: result.status }
  );
}
