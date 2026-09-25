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
import { resolveClientWorkspaceAccess, withClientDatabaseContext } from "@/lib/client-access";

async function loadCurrentProperty() {
  const db = getDb();
  if (!db) return null;
  const slug = await getCurrentWorkspaceSlug();
  return db.property.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
}

export async function GET() {
  const access = await resolveClientWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const clientAccess = { user: access.user, organization: access.organization, role: access.role, department: access.department, membership: access.organization.members.find((member) => member.email.toLowerCase() === access.user.username.toLowerCase()) };
  const property = await withClientDatabaseContext(clientAccess, "automation-jobs-get", loadCurrentProperty);
  if (!property) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const [summary, jobs] = await withClientDatabaseContext(clientAccess, "automation-jobs-list", () => Promise.all([
    getAutomationQueueSummary(property.id),
    listAutomationJobs(property.id, 20)
  ]));

  return NextResponse.json({ property, summary, jobs });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const access = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload.propertySlug === "string" ? payload.propertySlug : null,
    requireManage: true,
    requireActiveSubscription: true
  });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const property = { id: access.propertyId, name: access.property.name, slug: access.propertySlug };
  const clientAccess = { user: access.user, organization: access.organization, role: access.role, department: access.department, membership: access.organization.members.find((member) => member.email.toLowerCase() === access.user.username.toLowerCase()) };
  const action = typeof payload.action === "string" ? payload.action : "run_due";

  if (action === "enqueue_demo") {
    const job = await withClientDatabaseContext(clientAccess, "automation-job-enqueue", () => enqueueAutomationJob({
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
    }));
    return NextResponse.json({ property, job });
  }

  if (action === "run_due") {
    const result = await withClientDatabaseContext(clientAccess, "automation-job-run", () => runDueAutomationJobs({
      propertyId: property.id,
      workerId: `manual-${Date.now()}`,
      take: Number(payload.take) || 10,
      dryRun: true
    }));
    return NextResponse.json({ property, result });
  }

  return NextResponse.json({ error: "Unknown automation action" }, { status: 400 });
}
