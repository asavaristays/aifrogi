import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, labelForRole, roleForEmail, type SessionUser } from "@/lib/auth";
import { verifyCredential } from "@/lib/credential-store";
import { getMemberRoleByEmail } from "@/lib/repositories/onboarding-repository";
import { verifyTeamMemberCredential } from "@/lib/repositories/team-repository";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createLoginOtpChallenge, shouldRequireLoginOtp, verifyLoginOtpChallenge } from "@/lib/login-otp";

const COOKIE_SECURE = process.env.NODE_ENV === "production";
const CENTRAL_AUTH_URL =
  process.env.HOTELRADAR_AUTH_BASE_URL?.trim() || "https://hotelradar.in";

type AuthenticatedCredential = {
  username: string;
  label: string;
  sessionId?: string;
  authSource: "local" | "hotelradar";
  workspaceRole?: SessionUser["workspaceRole"];
};

async function authenticate(username: string, password: string): Promise<AuthenticatedCredential | null> {
  const local = await verifyCredential(username, password);
  if (local) return { ...local, authSource: "local" };

  const member = await verifyTeamMemberCredential(username, password);
  if (member) return { ...member, authSource: "local" };

  try {
    const response = await fetch(`${CENTRAL_AUTH_URL.replace(/\/+$/, "")}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
      cache: "no-store"
    });
    if (!response.ok) return null;
    const result = (await response.json()) as {
      authenticated?: boolean;
      email?: string;
      adminName?: string;
      sessionId?: string;
    };
    if (!result.authenticated || !result.email || !result.sessionId) return null;
    return {
      username: result.email,
      label: result.adminName || "AiFrogi Administrator",
      sessionId: result.sessionId,
      authSource: "hotelradar"
    };
  } catch {
    return null;
  }
}

function safeDestination(value: unknown, role: SessionUser["role"]) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return role === "admin" ? "/admin/customers" : "/dashboard";
  }
  if (role === "admin" && !value.startsWith("/admin")) {
    return "/admin/customers";
  }
  if (role !== "admin" && value.startsWith("/admin")) {
    return "/dashboard";
  }
  return value;
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipLimit = consumeRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-in attempts. Please try again later." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
    returnTo?: string;
    otpChallengeId?: string;
    otpCode?: string;
  } | null;
  const username = String(payload?.username || "").trim().toLowerCase();
  const userLimit = consumeRateLimit(`login:user:${username || "unknown"}`, 12, 15 * 60 * 1000);
  if (!userLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-in attempts for this account. Please try again later." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  const credential = await authenticate(username, payload?.password || "");
  if (!credential) {
    return NextResponse.json(
      { ok: false, error: "The email or password is incorrect." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const role = roleForEmail(credential.username);
  const workspaceRole = role === "admin" ? undefined : credential.workspaceRole || await getMemberRoleByEmail(credential.username) || "AGENT";
  const otpRequired = shouldRequireLoginOtp({ appRole: role, workspaceRole });
  if (otpRequired) {
    const hasOtp = Boolean(payload?.otpChallengeId && payload?.otpCode);
    if (!hasOtp) {
      const challenge = await createLoginOtpChallenge({
        username: credential.username,
        label: credential.label
      });
      if (challenge.error || !challenge.challengeId || !challenge.expiresAt) {
        return NextResponse.json(
          { ok: false, error: "Sign-in code could not be sent. Please contact support." },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          otpRequired: true,
          otpChallengeId: challenge.challengeId,
          expiresAt: challenge.expiresAt,
          message: "Enter the 6-digit code sent to your email."
        },
        { status: 202, headers: { "Cache-Control": "no-store" } }
      );
    }

    const otp = verifyLoginOtpChallenge({
      username: credential.username,
      challengeId: payload?.otpChallengeId,
      code: payload?.otpCode
    });
    if (!otp.ok) {
      return NextResponse.json(
        { ok: false, otpRequired: true, otpChallengeId: payload?.otpChallengeId, error: otp.error },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  const token = await createSessionToken({
    username: credential.username,
    label: role === "admin" ? credential.label || labelForRole(role) : labelForRole(role),
    role,
    workspaceRole,
    sessionId: credential.sessionId,
    authSource: credential.authSource
  });
  const redirectUrl = safeDestination(payload?.returnTo, role);
  const response = NextResponse.json(
    { ok: true, redirectUrl },
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: COOKIE_SECURE,
    maxAge: 8 * 60 * 60
  });
  return response;
}
