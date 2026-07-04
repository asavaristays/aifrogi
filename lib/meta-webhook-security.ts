import { createHmac, timingSafeEqual } from "crypto";

function getMetaAppSecret() {
  return (process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "").trim();
}

function isSignatureRequired() {
  return process.env.META_WEBHOOK_SIGNATURE_REQUIRED === "true" || process.env.NODE_ENV === "production" || Boolean(getMetaAppSecret());
}

function parseSignature(signatureHeader?: string | null) {
  const value = String(signatureHeader || "").trim();
  if (!value.startsWith("sha256=")) return null;
  const signature = value.slice("sha256=".length);
  return /^[a-f0-9]{64}$/i.test(signature) ? signature.toLowerCase() : null;
}

export function validateMetaWebhookSignature(input: {
  rawBody: string;
  signatureHeader?: string | null;
}): { ok: true; configured: boolean; required: boolean } | { ok: false; status: 403 | 503; error: string; configured: boolean; required: boolean } {
  const secret = getMetaAppSecret();
  const required = isSignatureRequired();

  if (!secret) {
    if (!required) {
      return { ok: true, configured: false, required: false };
    }

    return {
      ok: false,
      status: 503,
      error: "Meta webhook signature secret is not configured.",
      configured: false,
      required: true
    };
  }

  const providedSignature = parseSignature(input.signatureHeader);
  if (!providedSignature) {
    return {
      ok: false,
      status: 403,
      error: "Missing or invalid Meta webhook signature.",
      configured: true,
      required
    };
  }

  const expectedSignature = createHmac("sha256", secret).update(input.rawBody, "utf8").digest("hex");
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return {
      ok: false,
      status: 403,
      error: "Invalid Meta webhook signature.",
      configured: true,
      required
    };
  }

  return { ok: true, configured: true, required };
}
