import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/lib/password-reset";

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const limit = consumeRateLimit(`password-reset:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many reset requests. Please try again later." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  const payload = (await request.json().catch(() => null)) as { email?: string } | null;
  const result = await requestPasswordReset(String(payload?.email || ""));
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
