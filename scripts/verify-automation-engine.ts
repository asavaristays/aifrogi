import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, engine] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/automation-engine")
  ]);
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");

  const runId = Date.now();
  const slug = `automation-qa-${runId}`;
  let propertyId = "";

  try {
    const property = await db.property.create({ data: { name: `Automation QA ${runId}`, slug } });
    propertyId = property.id;

    const idempotencyKey = `automation:qa:${runId}:internal-note`;
    const first = await engine.enqueueAutomationJob({
      propertyId,
      workflowId: "qa_internal_note",
      triggerType: "verification",
      actionType: engine.AUTOMATION_ACTION_TYPE.INTERNAL_NOTE,
      idempotencyKey,
      payload: { note: "Verify durable queue success path" },
      createdBy: "automation-qa@aifrogi.local"
    });
    const duplicate = await engine.enqueueAutomationJob({
      propertyId,
      workflowId: "qa_internal_note",
      triggerType: "verification",
      actionType: engine.AUTOMATION_ACTION_TYPE.INTERNAL_NOTE,
      idempotencyKey,
      payload: { note: "Duplicate should not create a second job" },
      createdBy: "automation-qa@aifrogi.local"
    });
    assert(first?.id === duplicate?.id, "Idempotent enqueue created a duplicate job.");

    const successRun = await engine.runDueAutomationJobs({ propertyId, workerId: `qa-worker-${runId}`, take: 5 });
    assert(successRun.claimed === 1 && successRun.completed === 1, "Due success job did not complete.");

    const completedJob = await db.automationJob.findUnique({ where: { id: first!.id } });
    assert(completedJob?.status === engine.AUTOMATION_JOB_STATUS.SUCCEEDED, "Completed job was not marked SUCCEEDED.");
    assert(completedJob.attemptCount === 1, "Completed job attempt count was not recorded.");

    const failJob = await engine.enqueueAutomationJob({
      propertyId,
      workflowId: "qa_retry_dead_letter",
      triggerType: "verification",
      actionType: engine.AUTOMATION_ACTION_TYPE.FAIL_VERIFICATION,
      idempotencyKey: `automation:qa:${runId}:failure`,
      maxAttempts: 2,
      payload: { reason: "Verify retry then dead-letter" }
    });
    assert(Boolean(failJob), "Failure job was not created.");

    const firstFailure = await engine.runDueAutomationJobs({ propertyId, workerId: `qa-worker-${runId}`, take: 5 });
    assert(firstFailure.claimed === 1 && firstFailure.failed === 1, "Failure job did not move into retry.");

    await db.automationJob.update({
      where: { id: failJob!.id },
      data: { nextRunAt: new Date(Date.now() - 1000) }
    });
    const secondFailure = await engine.runDueAutomationJobs({ propertyId, workerId: `qa-worker-${runId}`, take: 5 });
    assert(secondFailure.claimed === 1 && secondFailure.failed === 1, "Failure job did not run second attempt.");

    const deadJob = await db.automationJob.findUnique({ where: { id: failJob!.id } });
    assert(deadJob?.status === engine.AUTOMATION_JOB_STATUS.DEAD, "Failed job was not dead-lettered after max attempts.");
    assert(deadJob.deadLetterReason?.includes("Verification failure"), "Dead-letter reason was not stored.");

    const summary = await engine.getAutomationQueueSummary(propertyId);
    assert(summary.total === 2, "Queue summary did not include both jobs.");
    assert(summary.dead === 1 && summary.succeeded24h === 1, "Queue summary did not reflect final statuses.");

    console.log("Automation engine verification passed.");
  } finally {
    if (propertyId) await db.property.deleteMany({ where: { id: propertyId } });
    const residue = await db.property.count({ where: { slug } });
    assert(residue === 0, "Synthetic automation property was not removed.");
    console.log("Synthetic automation workspace removed.");
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
