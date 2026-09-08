import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { readKnowledgeSettings, writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await readKnowledgeSettings(await getCurrentWorkspaceSlug());
  return NextResponse.json({ menu: settings.widgetMenu, canManage: canManageWorkspace(access.role) });
}

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { menu?: unknown } | null;
  try {
    const settings = await writeKnowledgeSettings(await getCurrentWorkspaceSlug(), { widgetMenu: payload?.menu as never });
    return NextResponse.json({ ok: true, menu: settings.widgetMenu });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save the main menu." }, { status: 400 });
  }
}
