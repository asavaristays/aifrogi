import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { writeCredentialSettings } from "@/lib/credential-store";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  const session = await verifySessionToken(sessionToken);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const saved = await writeCredentialSettings({
    username: payload.username,
    password: payload.password,
    label: payload.label
  });

  return NextResponse.json({ ok: true, settings: saved }, { headers: { "Cache-Control": "no-store" } });
}
