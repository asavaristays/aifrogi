import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { provisionDemoSandboxes, resetDemoSandbox } from "@/lib/demo-sandbox/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const payload = await request.json().catch(() => null) as { action?: string; organizationId?: string } | null;
  if (payload?.action === "PROVISION_ALL") return NextResponse.json({ demos: await provisionDemoSandboxes(user.username) });
  if (payload?.action === "RESET" && payload.organizationId) {
    try { return NextResponse.json(await resetDemoSandbox(payload.organizationId, user.username)); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Demo could not be reset." }, { status: 400 }); }
  }
  return NextResponse.json({ error: "Unsupported demo action." }, { status: 400 });
}
