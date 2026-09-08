import { getDb } from "@/lib/db";

export async function getOperationalHealthSnapshot() {
  const db = getDb();
  if (!db) return { automationRetries: 0, deadJobs: 0, openIncidents: 0, billingEmailFailures24h: 0 };
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [automationRetries, deadJobs, openIncidents, billingEmailFailures24h] = await Promise.all([
    db.automationJob.count({ where: { status: "RETRY" } }),
    db.automationJob.count({ where: { status: "DEAD" } }),
    db.platformIncident.count({ where: { status: { not: "RESOLVED" } } }),
    db.platformAuditLog.count({ where: { action: { startsWith: "BILLING_", endsWith: "_EMAIL_FAILED" }, createdAt: { gte: yesterday } } })
  ]);
  return { automationRetries, deadJobs, openIncidents, billingEmailFailures24h };
}
