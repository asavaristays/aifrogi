import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { writeCredentialSettings } from "@/lib/credential-store";

export async function POST(request: Request) {
  const session = await getCurrentUser();

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
