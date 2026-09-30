import { NextResponse } from "next/server";
import { getCurrentPlatformAdmin } from "@/lib/admin-access";
import { runtimeReleaseDriftFromEnv } from "@/lib/release-integrity";

export async function GET() {
  if (!await getCurrentPlatformAdmin()) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  try { return NextResponse.json(runtimeReleaseDriftFromEnv(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return NextResponse.json({ configured: true, drift: true, error: error instanceof Error ? error.message : "RELEASE_DRIFT_CHECK_FAILED" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}
