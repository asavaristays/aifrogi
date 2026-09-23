import { readFile } from "node:fs/promises";
import { getProtectedDb } from "@/lib/db";
import { compareDashboardDataSnapshots, validateDashboardDataSnapshot, type DashboardDataSnapshot } from "@/lib/security/dashboard-data-invariants";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

async function snapshot(): Promise<DashboardDataSnapshot> {
  return withTenantDatabaseContext({ kind: "platform-admin", actor: "deployment-data-invariants" }, async () => {
    const db = getProtectedDb();
    if (!db) throw new Error("Database unavailable.");
    const [organizations, websiteConversations, subscriptions, creditTransactions] = await Promise.all([
      db.organization.count({ where: { isDemo: false } }),
      db.websiteVisitorSession.count(),
      db.subscription.count(),
      db.aiCreditTransaction.count()
    ]);
    return { organizations, websiteConversations, subscriptions, creditTransactions };
  });
}

async function main() {
  const current = validateDashboardDataSnapshot(await snapshot());
  const baselinePath = process.argv[2];
  if (!baselinePath) {
    process.stdout.write(`${JSON.stringify(current)}\n`);
    return;
  }

  const baseline = validateDashboardDataSnapshot(JSON.parse(await readFile(baselinePath, "utf8")));
  const failures = compareDashboardDataSnapshots(baseline, current);
  if (failures.length) throw new Error(`Dashboard data invariant failed:\n- ${failures.join("\n- ")}`);
  console.log(`Dashboard data invariant passed: ${JSON.stringify(current)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
