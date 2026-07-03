import { NextResponse } from "next/server";
import { getReleaseId } from "@/lib/platform-health";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "aifrogi",
    release: getReleaseId(),
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
}
