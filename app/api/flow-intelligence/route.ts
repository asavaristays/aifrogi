import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { readKnowledgeSettings, writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { newTenantFlow, normalizeTenantFlow, TENANT_FLOW_TEMPLATES, validateTenantFlow, type TenantFlowDefinition, type TenantFlowTemplateKey } from "@/lib/tenant-flow-intelligence";
import { defaultWidgetMenu } from "@/lib/widget-menu";
import { HOTELGPT_FLOW_LIBRARY } from "@/lib/hotelgpt-flow-library";
import { hasTrustedSameOrigin } from "@/lib/security/request-origin";

export async function GET() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await readKnowledgeSettings(await getCurrentWorkspaceSlug());
  return NextResponse.json({ flows: settings.tenantFlows || [], templates: TENANT_FLOW_TEMPLATES, canManage: canManageWorkspace(access.role) });
}

export async function POST(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Owner or Admin access is required." }, { status: 403 });
  if (!hasTrustedSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  const payload = await request.json().catch(() => null) as { action?: string; templateKey?: TenantFlowTemplateKey; flow?: unknown; id?: string } | null;
  const slug = await getCurrentWorkspaceSlug();
  const settings = await readKnowledgeSettings(slug);
  let flows = [...(settings.tenantFlows || [])];
  let menu = settings.widgetMenu || defaultWidgetMenu(slug);
  try {
    if (payload?.action === "create") {
      const templateKey = payload.templateKey || "SERVICE_ADVISOR";
      const existingDraft = templateKey === "CUSTOM_FLOW" ? undefined : flows.find(item => item.templateKey === templateKey && item.status === "DRAFT");
      if (existingDraft) return NextResponse.json({ ok: true, reused: true, flow: existingDraft, flows });
      const flow = newTenantFlow(templateKey);
      flows.push(flow);
      await writeKnowledgeSettings(slug, { tenantFlows: flows });
      return NextResponse.json({ ok: true, flow, flows });
    }
    if (payload?.action === "install_hotel_defaults") {
      if (access.organization.botProfile?.category !== "STAY") throw new Error("HotelGPT defaults are available only to HotelGPT workspaces.");
      const existingKeys = new Set(flows.map(flow => flow.templateKey));
      const installed = HOTELGPT_FLOW_LIBRARY.filter(template => !existingKeys.has(template.key)).map(template => newTenantFlow(template.key));
      flows = [...flows, ...installed];
      await writeKnowledgeSettings(slug, { tenantFlows: flows });
      return NextResponse.json({ ok: true, installed: installed.length, flow: installed[0] || null, flows });
    }
    if (payload?.action === "save") {
      const flow = normalizeTenantFlow(payload.flow);
      if (!flow) throw new Error("Flow name, menu label and opening question are required.");
      const previous = flows.find(item => item.id === flow.id);
      const saved: TenantFlowDefinition = { ...flow, status: previous?.status === "PUBLISHED" ? "DRAFT" : flow.status, version: previous ? previous.version + 1 : flow.version, updatedAt: new Date().toISOString(), publishedAt: previous?.publishedAt };
      flows = previous ? flows.map(item => item.id === saved.id ? saved : item) : [...flows, saved];
      await writeKnowledgeSettings(slug, { tenantFlows: flows });
      return NextResponse.json({ ok: true, flow: saved, flows });
    }
    if (payload?.action === "publish") {
      const current = flows.find(item => item.id === payload.id);
      if (!current) throw new Error("Flow was not found.");
      const validationErrors = validateTenantFlow(current);
      if (validationErrors.length) throw new Error(validationErrors[0]);
      const published = { ...current, status: "PUBLISHED" as const, version: current.version + 1, updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString() };
      flows = flows.map(item => item.id === current.id ? published : item);
      const menuItem = { id: `flow-${current.id}`.slice(0, 50), label: current.menuLabel, action: "FLOW" as const, value: current.openingQuestion, icon: "chat" as const };
      if (current.journey !== "IN_STAY") {
        const retainedItems = menu.items.filter(item => item.id !== menuItem.id);
        if (retainedItems.length >= 6) throw new Error("The Pre-Stay Main Menu already has six options. Remove one in Setup before publishing this flow.");
        menu = { ...menu, enabled: true, items: [...retainedItems, menuItem] };
      }
      await writeKnowledgeSettings(slug, { tenantFlows: flows, widgetMenu: menu });
      return NextResponse.json({ ok: true, flow: published, flows, menu });
    }
    if (payload?.action === "pause" || payload?.action === "delete") {
      const current = flows.find(item => item.id === payload.id);
      if (!current) throw new Error("Flow was not found.");
      flows = payload.action === "delete" ? flows.filter(item => item.id !== current.id) : flows.map(item => item.id === current.id ? { ...item, status: "PAUSED" as const, updatedAt: new Date().toISOString() } : item);
      menu = { ...menu, items: menu.items.filter(item => item.id !== `flow-${current.id}`.slice(0, 50)) };
      await writeKnowledgeSettings(slug, { tenantFlows: flows, widgetMenu: menu });
      return NextResponse.json({ ok: true, flows, menu });
    }
    throw new Error("Unsupported flow action.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update Flow Intelligence." }, { status: 400 });
  }
}
