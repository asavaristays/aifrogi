import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, labelForRole, roleForEmail, type SessionUser } from "@/lib/auth";
import { sanitizeReturnTo, verifyUnifiedHandoffToken } from "@/lib/hotelradar-sso";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { getMemberRoleByEmail } from "@/lib/repositories/onboarding-repository";

const COOKIE_SECURE = process.env.NODE_ENV === "production";
const COOKIE_MAX_AGE = 60 * 60 * 8;
const PUBLIC_ORIGIN =
  process.env.AIFROGI_APP_URL?.trim() ||
  process.env.HOTELRADAR_LEADOS_PUBLIC_URL?.trim() ||
  "https://app.aifrogi.com";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const payload = verifyUnifiedHandoffToken(token);

  if (!payload) {
    return NextResponse.json({ error: "invalid unified handoff" }, { status: 401 });
  }

  const role = roleForEmail(payload.email);
  const user: SessionUser = {
    username: payload.email,
    role,
    label: labelForRole(role),
    sessionId: payload.sessionId,
    authSource: "hotelradar",
    workspaceRole: role === "admin" ? undefined : await getMemberRoleByEmail(payload.email) || "AGENT"
  };

  const requestedDestination = sanitizeReturnTo(url.searchParams.get("returnTo"));
  let destination = requestedDestination;
  if (user.role === "admin") {
    destination = "/admin/customers";
  } else {
    const organization = await loadOnboardingForUser(user.username);
    if (!organization || organization.onboarding?.lifecycleStatus !== "LIVE") {
      destination = "/onboarding";
    }
  }

  const response = NextResponse.redirect(new URL(destination, PUBLIC_ORIGIN), 302);
  response.cookies.set({
    name: getSessionCookieName(),
    value: await createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: COOKIE_SECURE,
    maxAge: COOKIE_MAX_AGE
  });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
