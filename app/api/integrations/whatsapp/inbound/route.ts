import { NextResponse } from "next/server";
import { captureIncomingWhatsAppMessage } from "@/lib/services/lead-service";

const INBOUND_TOKEN = String(
  process.env.LEADOS_WHATSAPP_INBOUND_TOKEN ||
    process.env.LEADOS_AI_BOT_WEBHOOK_TOKEN ||
    process.env.AI_BOT_AGENT_REPLY_TOKEN ||
    ""
).trim();

function normalizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const phone =
    typeof record.phone === "string"
      ? record.phone
      : typeof record.mobile === "string"
        ? record.mobile
        : typeof record.from === "string"
          ? record.from
          : typeof record.user_phone === "string"
            ? record.user_phone
            : "";
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.guestMessage === "string"
        ? record.guestMessage
        : typeof record.text === "string"
          ? record.text
          : typeof record.body === "string"
            ? record.body
            : "";
  const aiReply =
    typeof record.aiReply === "string"
      ? record.aiReply
      : typeof record.reply === "string"
        ? record.reply
        : "";
  const profileName =
    typeof record.profileName === "string"
      ? record.profileName
      : typeof record.name === "string"
        ? record.name
        : typeof record.user_name === "string"
          ? record.user_name
          : undefined;
  const propertySlug =
    typeof record.propertySlug === "string"
      ? record.propertySlug
      : typeof record.property === "string"
        ? record.property
        : undefined;
  const conversationId = typeof record.conversationId === "string" ? record.conversationId : undefined;
  const sentAt =
    typeof record.sentAt === "string"
      ? new Date(record.sentAt)
      : typeof record.timestamp === "string"
        ? new Date(record.timestamp)
        : undefined;

  return {
    phone: String(phone || "").trim(),
    message: String(message || "").trim(),
    aiReply: String(aiReply || "").trim(),
    profileName,
    propertySlug,
    conversationId,
    sentAt: sentAt && !Number.isNaN(sentAt.getTime()) ? sentAt : undefined
  };
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const payload = normalizePayload(rawBody);
  const bodyToken =
    rawBody && typeof rawBody === "object" && typeof (rawBody as Record<string, unknown>).token === "string"
      ? String((rawBody as Record<string, unknown>).token || "").trim()
      : "";

  if (INBOUND_TOKEN) {
    const bearer = getBearerToken(request);
    if (bearer !== INBOUND_TOKEN && bodyToken !== INBOUND_TOKEN) {
      return NextResponse.json({ error: "invalid inbound authorization" }, { status: 401 });
    }
  }

  if (!payload || !payload.message || !(payload.phone || payload.conversationId)) {
    return NextResponse.json({ error: "message and either phone or conversationId are required" }, { status: 400 });
  }

  const result = await captureIncomingWhatsAppMessage({
    from: payload.phone || payload.conversationId || "",
    body: payload.message,
    aiReply: payload.aiReply || undefined,
    profileName: payload.profileName,
    propertySlug: payload.propertySlug,
    sentAt: payload.sentAt
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      lead: result.lead,
      createdLead: result.created,
      message: "Inbound WhatsApp message captured successfully"
    },
    { status: result.status }
  );
}
