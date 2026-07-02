import { createHmac, timingSafeEqual } from "crypto";

const HOTELRADAR_SSO_SECRET =
  process.env.HOTELRADAR_SSO_SECRET?.trim() || "hotelradar-unified-sso-bridge";
const TOKEN_TTL_MS = 5 * 60 * 1000;

export type UnifiedHandoffPayload = {
  email: string;
  sessionId: string;
  returnTo: string;
  expiresAt: number;
};

function encodeBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", HOTELRADAR_SSO_SECRET).update(value).digest("hex");
}

export function createUnifiedHandoffToken(email: string, returnTo = "/dashboard", sessionId = "") {
  const payload: UnifiedHandoffPayload = {
    email: String(email).trim().toLowerCase(),
    sessionId: String(sessionId || "").trim(),
    returnTo: sanitizeReturnTo(returnTo),
    expiresAt: Date.now() + TOKEN_TTL_MS
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyUnifiedHandoffToken(token?: string | null): UnifiedHandoffPayload | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as UnifiedHandoffPayload;
    if (!parsed.email || !parsed.sessionId || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt < Date.now()) {
      return null;
    }
    return {
      email: String(parsed.email).trim().toLowerCase(),
      sessionId: String(parsed.sessionId).trim(),
      returnTo: sanitizeReturnTo(parsed.returnTo),
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}

export function sanitizeReturnTo(value?: string | null) {
  const fallback = "/dashboard";
  const candidate = String(value || "").trim();
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  return candidate || fallback;
}
