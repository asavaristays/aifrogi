import { NextResponse } from "next/server";
import { withCurrentPlatformAdminDatabaseContext } from "@/lib/admin-access";
import { readFleetKnowledgeHealth } from "@/lib/repositories/fleet-health-repository";

export async function GET() {
  const result = await withCurrentPlatformAdminDatabaseContext("admin-fleet-health", () => readFleetKnowledgeHealth());
  if (!result) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  return NextResponse.json(result.value, { headers: { "Cache-Control": "private, no-store" } });
}
