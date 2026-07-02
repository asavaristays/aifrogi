const DEFAULT_LEADS_CAPTURE_APPEND_URL =
  process.env.LEADOS_GOOGLE_LEADS_APPEND_URL?.trim() ||
  process.env.LEADOS_GOOGLE_LEADS_FEED_URL?.trim() ||
  "https://script.google.com/macros/s/AKfycbxX_4NqWk9LRb_U5HUhiTXu1xDCSLjwujzEgkSOn7uas63IiRgSoaSzGATCVgJMXNb4/exec";

export type LeadCaptureAppendInput = {
  guestName: string;
  phone: string;
  destination: string;
  notes?: string;
  channel?: string;
  source?: string;
  conversationId?: string;
  status?: string;
};

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return normalizeText(value);
}

export async function appendLeadCaptureToGoogleSheet(input: LeadCaptureAppendInput) {
  const endpoint = normalizeText(DEFAULT_LEADS_CAPTURE_APPEND_URL);
  if (!endpoint) {
    return { ok: false, reason: "missing_append_endpoint" as const };
  }

  const payload = {
    type: "guest_lead_capture",
    lead: {
      channel: normalizeText(input.channel || "manual_leads"),
      source: normalizeText(input.source || "manual_leads_workspace"),
      conversationId: normalizeText(input.conversationId || "manual") || `manual-${Date.now()}`,
      guestName: normalizeText(input.guestName),
      phone: normalizePhone(input.phone),
      destination: normalizeText(input.destination),
      status: normalizeText(input.status || "new"),
      notes: normalizeText(input.notes || "")
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual",
      signal: AbortSignal.timeout(5000)
    });

    const location = normalizeText(response.headers.get("location") || "");
    if (response.status >= 300 && response.status < 400 && /script\.googleusercontent\.com\/macros\/echo/i.test(location)) {
      return { ok: true };
    }

    if (!response.ok) {
      return { ok: false, reason: `append_http_${response.status}` as const };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "append_failed" };
  }
}
