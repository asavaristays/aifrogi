import { NextResponse } from "next/server";
import { createRevocationProof, getSessionCookieName, readVerifiedSessionToken } from "@/lib/auth";

const COOKIE_SECURE = process.env.NODE_ENV === "production";
const HOTELRADAR_AUTH_BASE_URL =
  process.env.HOTELRADAR_AUTH_BASE_URL?.trim() || "https://hotelradar.in";

function parseCookieValue(cookieHeader: string, name: string) {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function POST(request: Request) {
  const sessionCookie = parseCookieValue(request.headers.get("cookie") || "", getSessionCookieName());
  const session = readVerifiedSessionToken(sessionCookie);

  if (session?.sessionId && session.authSource !== "local") {
    try {
      await fetch(`${HOTELRADAR_AUTH_BASE_URL.replace(/\/+$/, "")}/api/auth/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-HotelRADAR-Proof": createRevocationProof(session.sessionId),
        },
        body: JSON.stringify({
          sid: session.sessionId,
          email: session.username,
          reason: "leados_logout",
        }),
        cache: "no-store",
      });
    } catch {
      // Best-effort central revocation; local logout still proceeds.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: COOKIE_SECURE,
    expires: new Date(0),
  });
  return response;
}
