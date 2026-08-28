import { createHmac, timingSafeEqual } from "node:crypto";

export const APPOINTMENT_EVENT_TYPES = ["text", "button_reply", "list_reply", "flow_reply"] as const;
export type AppointmentEventType = (typeof APPOINTMENT_EVENT_TYPES)[number];

export type AppointmentInboundEvent = {
  tenant_id: string;
  customer_phone: string;
  event_type: AppointmentEventType;
  payload: Record<string, unknown>;
  message_id: string;
  timestamp: number;
};

export function getAppointmentSharedSecret() {
  return (
    process.env.APPOINTMENT_JOURNEY_HMAC_SECRET?.trim() ||
    process.env.AIFROGI_APPOINTMENT_HMAC_SECRET?.trim() ||
    ""
  );
}

export function signAppointmentPayload(rawBody: string, secret = getAppointmentSharedSecret()) {
  return `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
}

export function validateAppointmentSignature(input: {
  rawBody: string;
  signatureHeader?: string | null;
  secret?: string;
}): { ok: true } | { ok: false; status: 401 | 503; error: string } {
  const secret = input.secret ?? getAppointmentSharedSecret();
  if (!secret) {
    return { ok: false, status: 503, error: "Appointment Journey HMAC secret is not configured." };
  }

  const value = String(input.signatureHeader || "").trim();
  if (!value.startsWith("sha256=")) {
    return { ok: false, status: 401, error: "Missing Appointment Journey signature." };
  }

  const provided = value.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(provided)) {
    return { ok: false, status: 401, error: "Invalid Appointment Journey signature format." };
  }

  const expected = signAppointmentPayload(input.rawBody, secret).slice("sha256=".length);
  const left = Buffer.from(provided, "hex");
  const right = Buffer.from(expected, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, status: 401, error: "Invalid Appointment Journey signature." };
  }

  return { ok: true };
}

function normalizedPhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function parseAppointmentInboundEvent(value: unknown): AppointmentInboundEvent {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const tenantId = String(input.tenant_id || "").trim();
  const customerPhone = normalizedPhone(input.customer_phone);
  const eventType = String(input.event_type || "").trim() as AppointmentEventType;
  const messageId = String(input.message_id || "").trim();
  const timestamp = Number(input.timestamp);
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
    ? input.payload as Record<string, unknown>
    : {};

  if (!tenantId) throw new Error("tenant_id is required.");
  if (!customerPhone) throw new Error("customer_phone is required.");
  if (!APPOINTMENT_EVENT_TYPES.includes(eventType)) throw new Error("event_type is not supported.");
  if (!messageId) throw new Error("message_id is required.");
  if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error("timestamp is required.");

  return {
    tenant_id: tenantId,
    customer_phone: customerPhone,
    event_type: eventType,
    payload,
    message_id: messageId,
    timestamp
  };
}
