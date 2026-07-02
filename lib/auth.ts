import { createHmac, randomUUID } from "crypto";

export type AppUserRole = "admin" | "hotel_owner";

export type SessionUser = {
  username: string;
  role: AppUserRole;
  label: string;
  sessionId?: string;
  authSource?: "hotelradar" | "local";
  issuedAt?: number;
  expiresAt?: number;
};

const COOKIE_NAME = "leados_session";
const HOTELRADAR_COOKIE_NAME = "pulse_ai_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const HOTELRADAR_AUTH_BASE_URL =
  process.env.HOTELRADAR_AUTH_BASE_URL?.trim() || "https://hotelradar.in";
const HOTELRADAR_SSO_SECRET =
  process.env.HOTELRADAR_SSO_SECRET?.trim() || process.env.AUTH_SESSION_SECRET || "hotelradar-unified-sso-bridge";
const ADMIN_EMAILS = new Set([
  "info@aifrogi.com",
  "admin@aifrogi.com",
  process.env.AIFROGI_ADMIN_EMAIL?.trim().toLowerCase() || ""
].filter(Boolean));
const REVOCATION_CACHE_TTL_MS = 5000;
const revocationCache = new Map<string, { revoked: boolean; checkedAt: number }>();

function getSecret() {
  return process.env.AUTH_SESSION_SECRET || "change-this-in-production";
}

function createRevocationProof(sessionId: string) {
  return createHmac("sha256", HOTELRADAR_SSO_SECRET).update(sessionId).digest("hex");
}

function toBase64Url(input: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }

  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64url").toString("utf8");
  }

  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(normalized + padding);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function signSync(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function signUnified(value: string) {
  return createHmac("sha256", HOTELRADAR_SSO_SECRET).update(value).digest("hex");
}

function encodePayload(user: SessionUser) {
  return toBase64Url(JSON.stringify(user));
}

function decodePayload(payload: string): SessionUser | null {
  try {
    return JSON.parse(fromBase64Url(payload)) as SessionUser;
  } catch {
    return null;
  }
}

export function readSessionTokenPayload(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [payload] = token.split(".");
  if (!payload) return null;
  return decodePayload(payload);
}

export function readVerifiedSessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = signSync(payload);
  if (signature.length !== expected.length) {
    return null;
  }
  if (signature !== expected) {
    return null;
  }
  const decoded = decodePayload(payload);
  if (!decoded || !decoded.expiresAt || decoded.expiresAt < Date.now()) {
    return null;
  }
  return decoded;
}

export function isPlatformAdminEmail(email?: string | null) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function roleForEmail(email?: string | null): AppUserRole {
  return isPlatformAdminEmail(email) ? "admin" : "hotel_owner";
}

export function labelForRole(role: AppUserRole) {
  return role === "admin" ? "AiFrogi Super Admin" : "AiFrogi Workspace Access";
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function getUnifiedSessionCookieName() {
  return HOTELRADAR_COOKIE_NAME;
}

export async function createSessionToken(user: SessionUser) {
  const sessionId = user.sessionId || randomUUID().replace(/-/g, "");
  const payload = encodePayload({
    ...user,
    sessionId,
    authSource: user.authSource || "hotelradar",
    issuedAt: user.issuedAt || Date.now(),
    expiresAt: user.expiresAt || Date.now() + SESSION_TTL_MS
  });
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

async function isSessionRevoked(sessionId: string) {
  const cached = revocationCache.get(sessionId);
  if (cached && cached.checkedAt + REVOCATION_CACHE_TTL_MS > Date.now()) {
    return cached.revoked;
  }

  const proof = createRevocationProof(sessionId);
  try {
    const response = await fetch(
      `${HOTELRADAR_AUTH_BASE_URL.replace(/\/+$/, "")}/api/auth/session/verify?sid=${encodeURIComponent(sessionId)}&proof=${encodeURIComponent(proof)}`,
      {
        method: "GET",
        cache: "no-store"
      }
    );
    if (!response.ok) {
      revocationCache.set(sessionId, { revoked: true, checkedAt: Date.now() });
      return true;
    }
    const data = (await response.json().catch(() => null)) as { revoked?: boolean } | null;
    const revoked = Boolean(data?.revoked);
    revocationCache.set(sessionId, { revoked, checkedAt: Date.now() });
    return revoked;
  } catch {
    revocationCache.set(sessionId, { revoked: true, checkedAt: Date.now() });
    return true;
  }
}

export async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  const decoded = readVerifiedSessionToken(token);
  if (!decoded) return null;
  if (!decoded.sessionId) {
    return null;
  }
  if (decoded.authSource === "local") {
    return decoded;
  }
  if (await isSessionRevoked(decoded.sessionId)) {
    return null;
  }
  return decoded;
}

export async function verifyUnifiedSessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const decoded = fromBase64Url(token);
    const parts = decoded.split(":");
    if (parts.length < 4) return null;
    const signature = parts.pop();
    const expiresAt = Number(parts.pop());
    const sessionId = parts.pop();
    const email = parts.join(":").trim().toLowerCase();
    const payload = `${email}:${sessionId}:${expiresAt}`;
    const expected = signUnified(payload);
    if (
      signature !== expected ||
      !sessionId ||
      !Number.isFinite(expiresAt) ||
      expiresAt < Date.now()
    ) {
      return null;
    }

    if (await isSessionRevoked(sessionId)) {
      return null;
    }

    const role = roleForEmail(email);

    return {
      username: email,
      role,
      label: labelForRole(role),
      sessionId,
      authSource: "hotelradar",
      issuedAt: Date.now(),
      expiresAt,
    };
  } catch {
    return null;
  }
}

export { createRevocationProof };
