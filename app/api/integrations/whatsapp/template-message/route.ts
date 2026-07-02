import { NextResponse } from "next/server";
import { sendWhatsAppTemplateMessage } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

function parseVariables(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const to = typeof payload?.to === "string" ? payload.to : "";
  const templateName = typeof payload?.templateName === "string" ? payload.templateName : "";
  const languageCode = typeof payload?.languageCode === "string" ? payload.languageCode : "en_US";
  const selectedWorkspaceSlug = await getCurrentWorkspaceSlug();
  const propertySlug = typeof payload?.propertySlug === "string" && payload.propertySlug.trim()
    ? payload.propertySlug.trim()
    : selectedWorkspaceSlug;
  const bodyVariables = parseVariables(payload?.bodyVariables);
  const headerImageUrl = typeof payload?.headerImageUrl === "string" ? payload.headerImageUrl.trim() : "";

  const result = await sendWhatsAppTemplateMessage({
    to,
    templateName,
    languageCode,
    propertySlug,
    bodyVariables,
    headerImageUrl
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      result: result.result
    },
    { status: result.status }
  );
}
