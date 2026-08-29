import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { createLeadOperation, listLeadOperations, updateLeadOperation } from "@/lib/repositories/ai-operations-repository";

async function context(leadId: string) {
  const access = await resolveClientWorkspaceAccess({ requireManage: true });
  if (!access.ok) return { error: NextResponse.json({ error: access.error }, { status: access.status }) };
  return { access, leadId };
}

export async function GET(_: Request, route: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await route.params;
  const current = await context(leadId);
  if ("error" in current) return current.error;
  return NextResponse.json({ operations: await listLeadOperations(current.access.propertyId, leadId) });
}

export async function POST(request: Request, route: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await route.params;
  const current = await context(leadId);
  if ("error" in current) return current.error;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  try {
    const operation = await createLeadOperation({ propertyId: current.access.propertyId, leadId, actorEmail: current.access.user.username, ...payload });
    return NextResponse.json({ operation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create this action." }, { status: 400 });
  }
}

export async function PATCH(request: Request, route: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await route.params;
  const current = await context(leadId);
  if ("error" in current) return current.error;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  try {
    const operation = await updateLeadOperation({ propertyId: current.access.propertyId, leadId, operationId: String(payload?.operationId || ""), ...payload });
    return NextResponse.json({ operation });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update this action." }, { status: 400 });
  }
}
