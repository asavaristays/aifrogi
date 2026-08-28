import { NextResponse } from "next/server";
import { completePasswordReset, inspectPasswordReset } from "@/lib/password-reset";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const reset = await inspectPasswordReset(token);
  if (!reset) {
    return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 404 });
  }
  return NextResponse.json(reset, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { token?: string; password?: string } | null;
  try {
    const result = await completePasswordReset(String(payload?.token || ""), String(payload?.password || ""));
    return NextResponse.json({ ok: true, email: result.email }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reset this password." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
