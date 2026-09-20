import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { issueAgentGatewayClient, listAgentGatewayClients, setAgentGatewayClientState } from "@/lib/agent-gateway";

export async function GET() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in with a client workspace account." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  return NextResponse.json({ clients: await listAgentGatewayClients(access.organization.id) });
}

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in with a client workspace account." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { label?: unknown } | null;
  try {
    return NextResponse.json(await issueAgentGatewayClient({ organizationId: access.organization.id, actorEmail: access.user.username, label: payload?.label }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Agent credential could not be created." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Sign in with a client workspace account." }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { id?: string; enabled?: boolean } | null;
  if (!payload?.id || typeof payload.enabled !== "boolean") return NextResponse.json({ error: "Credential and state are required." }, { status: 400 });
  try { return NextResponse.json({ client: await setAgentGatewayClientState({ organizationId: access.organization.id, actorEmail: access.user.username, id: payload.id, enabled: payload.enabled }) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Agent credential could not be updated." }, { status: 400 }); }
}
