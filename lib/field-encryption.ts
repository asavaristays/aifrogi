import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";

const PREFIX = "enc:v1:";

function encryptionSecret() {
  const value = process.env.LEADOS_FIELD_ENCRYPTION_SECRET?.trim() || process.env.AUTH_SESSION_SECRET?.trim();
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new Error("Production field encryption secret is not configured.");
    return "local-development-only-field-encryption-key";
  }
  if (process.env.NODE_ENV === "production" && value === "change-this-in-production") throw new Error("Unsafe production field encryption secret is configured.");
  return value;
}

function deriveKey() {
  return createHash("sha256").update(encryptionSecret()).digest();
}

export function encryptSecretValue(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (text.startsWith(PREFIX)) return text;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptSecretValue(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!text.startsWith(PREFIX)) return text;

  const payload = Buffer.from(text.slice(PREFIX.length), "base64url");
  if (payload.length < 28) return null;

  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function secretsEqual(left?: string | null, right?: string | null) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}
