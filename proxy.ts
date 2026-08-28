import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRegisteredSessionActive } from "@/lib/session-registry";

const SESSION_COOKIE_NAME = "leados_session";
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || "change-this-in-production";
const HOTELRADAR_SSO_SECRET =
  process.env.HOTELRADAR_SSO_SECRET?.trim() || "hotelradar-unified-sso-bridge";
const HOTELRADAR_AUTH_BASE_URL = process.env.HOTELRADAR_AUTH_BASE_URL?.trim() || "https://hotelradar.in";
const REVOCATION_CACHE_TTL_MS = 5000;
const revocationCache = new Map<string, { revoked: boolean; checkedAt: number }>();

const protectedPrefixes = [
  "/dashboard",
  "/contacts",
  "/campaigns",
  "/workflows",
  "/knowledge",
  "/analytics",
  "/whatsapp-bot",
  "/setup",
  "/settings",
  "/billing",
  "/support",
  "/onboarding",
  "/admin",
];

const clientAppPrefixes = protectedPrefixes.filter((prefix) => prefix !== "/admin");

const retiredPrefixes = [
  "/email-leads",
  "/call-leads",
  "/manual-leads",
  "/ai-bot",
  "/lead-inbox",
  "/ota-recapture",
  "/case-study",
  "/mobile-agent",
  "/review",
  "/admin/hotels",
  "/onboarding/pms",
  "/settings/assets",
  "/settings/design-system",
];

const publicApiPrefixes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/hotelradar-sso",
  "/api/auth/invitation",
  "/api/auth/password-reset",
  "/api/automation/run",
  // Machine ingress authenticates with its dedicated bearer token in the route.
  "/api/integrations/whatsapp/inbound",
  "/api/integrations/whatsapp/webhook",
  "/api/appointment-journey/google/oauth/callback",
  "/api/appointment-journey/webhook/aifrogi",
  "/api/appointment-journey/tenants",
  "/api/flowcart/current",
  "/api/flowcart/catalog",
  "/api/flowcart/orders",
  "/api/flowcart/webhook/aifrogi",
  "/api/flowcart/webhook/razorpay",
  "/api/public/whatsapp-bot",
  "/api/public/website-bot",
  "/api/health/live",
  "/api/health/ready",
];

type SessionUser = {
  username?: string;
  role?: string;
  workspaceRole?: string;
  label?: string;
  sessionId?: string;
  authSource?: string;
  issuedAt?: number;
  expiresAt?: number;
};

function isPublicApiPath(pathname: string) {
  return publicApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function apiUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(normalized + padding);
}

function encodeUtf8(value: string) {
  return new TextEncoder().encode(value);
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeUtf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encodeUtf8(value));
  return toHex(new Uint8Array(signature));
}

async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await hmacHex(AUTH_SESSION_SECRET, payload);
  if (expected.length !== signature.length || expected !== signature) {
    return null;
  }

  let session: SessionUser | null = null;
  try {
    session = JSON.parse(decodeBase64Url(payload)) as SessionUser;
  } catch {
    return null;
  }

  if (!session?.sessionId || !session.expiresAt || session.expiresAt < Date.now()) {
    return null;
  }

  if (session.authSource === "local") {
    return await isRegisteredSessionActive(session.sessionId) ? session : null;
  }

  const cached = revocationCache.get(session.sessionId);
  if (cached && cached.checkedAt + REVOCATION_CACHE_TTL_MS > Date.now()) {
    return cached.revoked ? null : session;
  }

  try {
    const proof = await hmacHex(HOTELRADAR_SSO_SECRET, String(session.sessionId));
    const response = await fetch(
      `${HOTELRADAR_AUTH_BASE_URL.replace(/\/+$/, "")}/api/auth/session/verify?sid=${encodeURIComponent(session.sessionId)}&proof=${encodeURIComponent(proof)}`,
      { method: "GET", cache: "no-store" },
    );

    if (!response.ok) {
      revocationCache.set(session.sessionId, { revoked: true, checkedAt: Date.now() });
      return null;
    }

    const data = (await response.json().catch(() => null)) as { revoked?: boolean } | null;
    const revoked = Boolean(data?.revoked);
    revocationCache.set(session.sessionId, { revoked, checkedAt: Date.now() });
    return revoked ? null : session;
  } catch {
    revocationCache.set(session.sessionId, { revoked: true, checkedAt: Date.now() });
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  const isMarketingHost = hostname === "aifrogi.com" || hostname === "www.aifrogi.com";
  const isAppHost = hostname === "app.aifrogi.com";

  if (isMarketingHost && ((pathname === "/login" || pathname === "/register") || protectedPrefixes.some((prefix) => pathname.startsWith(prefix)))) {
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, "https://app.aifrogi.com"));
  }

  if (isAppHost && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (retiredPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/api/") && !isPublicApiPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return apiUnauthorized();
    }
    return NextResponse.next();
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role === "admin" && clientAppPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/admin/customers", request.url));
  }

  if (session.role !== "admin" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const clientManagementPrefixes = ["/campaigns", "/workflows", "/analytics", "/setup", "/settings", "/billing", "/onboarding"];
  const limitedWorkspaceRole = session.workspaceRole === "AGENT" || session.workspaceRole === "VIEWER";
  if (session.role !== "admin" && limitedWorkspaceRole && clientManagementPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/api/:path*",
    "/dashboard/:path*",
    "/contacts/:path*",
    "/lead-inbox/:path*",
    "/campaigns/:path*",
    "/workflows/:path*",
    "/knowledge/:path*",
    "/analytics/:path*",
    "/ota-recapture/:path*",
    "/whatsapp-bot/:path*",
    "/setup/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/support/:path*",
    "/mobile-agent/:path*",
    "/review/:path*",
    "/email-leads/:path*",
    "/call-leads/:path*",
    "/manual-leads/:path*",
    "/ai-bot/:path*",
    "/case-study/:path*",
    "/admin/hotels/:path*",
    "/settings/assets/:path*",
    "/settings/design-system/:path*",
  ],
};
