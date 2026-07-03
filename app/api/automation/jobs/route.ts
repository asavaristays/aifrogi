import { NextResponse } from "next/server";
import {
  AUTOMATION_ACTION_TYPE,
  enqueueAutomationJob,
  getAutomationQueueSummary,
  listAutomationJobs,
  runDueAutomationJobs
} from "@/lib/automation-engine";
import { getDb } from "@/lib/db";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

async function loadCurrentProperty() {
  const db = getDb();
  if (!db) return null;
  const slug = await getCurrentWorkspaceSlug();
  return db.property.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
}

export async function GET() {
  const property = await loadCurrentProperty();
  if (!property) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const [summary, jobs] = await Promise.all([
    getAutomationQueueSummary(property.id),
    listAutomationJobs(property.id, 20)
  ]);

  return NextResponse.json({ property, summary, jobs });
}

export async function POST(request: Request) {
  const property = await loadCurrentProperty();
  if (!property) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const payload = await request.json().catch(() => ({}));
  const action = typeof payload.action === "string" ? payload.action : "run_due";

  if (action === "enqueue_demo") {
    const job = await enqueueAutomationJob({
      propertyId: property.id,
      workflowId: "manager_daily_digest",
      triggerType: "manual_demo",
      actionType: AUTOMATION_ACTION_TYPE.DAILY_DIGEST_SIMULATION,
      idempotencyKey: `manual-demo:${property.id}:${new Date().toISOString().slice(0, 16)}`,
      payload: {
        source: "workflow-operations-panel",
        note: "Prepared a digest simulation without sending any external message."
      },
      createdBy: "operator"
    });
    return NextResponse.json({ property, job });
  }

  if (action === "run_due") {
    const result = await runDueAutomationJobs({
      propertyId: property.id,
      workerId: `manual-${Date.now()}`,
      take: Number(payload.take) || 10,
      dryRun: true
    });
    return NextResponse.json({ property, result });
  }

  return NextResponse.json({ error: "Unknown automation action" }, { status: 400 });
}
