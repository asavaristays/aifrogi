import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { listUserSessions, revokeUserSession } from "@/lib/session-registry";
import { createRevocationProof } from "@/lib/auth";

const HOTELRADAR_AUTH_BASE_URL = process.env.HOTELRADAR_AUTH_BASE_URL?.trim() || "https://hotelradar.in";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await listUserSessions(user.username);
  return NextResponse.json({ currentSessionId: user.sessionId || null, sessions });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({}));
  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : "";
  if (!sessionId) return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  const ownedSessions = await listUserSessions(user.username);
  const target = ownedSessions.find((session) => session.sessionId === sessionId);
  if (!target) return NextResponse.json({ error: "Session was not found." }, { status: 404 });
  if (target.authSource !== "local") {
    try {
      const response = await fetch(`${HOTELRADAR_AUTH_BASE_URL.replace(/\/+$/, "")}/api/auth/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-HotelRADAR-Proof": createRevocationProof(sessionId) },
        body: JSON.stringify({ sid: sessionId, email: user.username, reason: "aifrogi_device_revocation" }),
        cache: "no-store"
      });
      if (!response.ok) return NextResponse.json({ error: "Connected session could not be revoked." }, { status: 502 });
    } catch {
      return NextResponse.json({ error: "Connected session service is unavailable." }, { status: 502 });
    }
  }
  await revokeUserSession({ sessionId, email: user.username, revokedBy: user.username });
  return NextResponse.json({ ok: true, currentSessionRevoked: sessionId === user.sessionId });
}
