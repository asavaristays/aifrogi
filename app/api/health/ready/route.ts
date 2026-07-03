import { NextResponse } from "next/server";
import { getPlatformReadiness } from "@/lib/platform-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getPlatformReadiness();
  return NextResponse.json({
    status: health.status,
    service: health.service,
    release: health.release,
    timestamp: health.timestamp
  }, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" }
  });
}
