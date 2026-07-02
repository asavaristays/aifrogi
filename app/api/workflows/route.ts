import { NextResponse } from "next/server";
import { buildAutomationWorkflows, getWorkflowReadiness } from "@/lib/workflow-automation";
import { loadLeads } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const leads = await loadLeads(propertySlug);
  const workflows = buildAutomationWorkflows(leads);

  return NextResponse.json({
    workflows,
    readiness: getWorkflowReadiness(workflows)
  });
}
