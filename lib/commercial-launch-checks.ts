import type { PrismaClient } from "../generated/prisma/client";

export type CommercialLaunchInventory = {
  organizations: number;
  liveBots: number;
  openIncidents: number;
  blockingIncidents: number;
  deadJobs: number;
};

/** Read-only platform inventory: RLS authority exists only inside this transaction. */
export async function readCommercialLaunchInventory(db: Pick<PrismaClient, "$transaction">): Promise<CommercialLaunchInventory> {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$queryRaw`SELECT set_config('app.organization_id', '', true), set_config('app.platform_authority', 'true', true), set_config('app.security_actor', 'commercial-launch-verifier', true), set_config('app.system_purpose', 'commercial-launch-inventory', true)`;
    const unresolved = { status: { notIn: ["RESOLVED", "CLOSED"] } };
    const [organizations, liveBots, openIncidents, blockingIncidents, deadJobs] = await Promise.all([
      tx.organization.count({ where: { isDemo: false } }),
      tx.botProfile.count({ where: { status: "LIVE", organization: { isDemo: false } } }),
      tx.platformIncident.count({ where: unresolved }),
      // Unknown severities require review, rather than silently allowing launch.
      tx.platformIncident.count({ where: { ...unresolved, severity: { notIn: ["LOW", "MEDIUM"] } } }),
      tx.automationJob.count({ where: { status: "DEAD" } })
    ]);
    return { organizations, liveBots, openIncidents, blockingIncidents, deadJobs };
  });
}

export function assertCommercialLaunchInventory(inventory: CommercialLaunchInventory) {
  const failures: string[] = [];
  for (const [name, value] of Object.entries(inventory)) {
    if (!Number.isSafeInteger(value) || value < 0) failures.push(`Invalid ${name} evidence`);
  }
  if (inventory.organizations < 1 || inventory.liveBots < 1) failures.push("No live non-demo bot inventory is visible");
  if (inventory.blockingIncidents > 0) failures.push(`${inventory.blockingIncidents} unresolved severe or unclassified incidents`);
  if (inventory.deadJobs > 0) failures.push(`${inventory.deadJobs} dead automation jobs require resolution`);
  if (failures.length) throw new Error(`Commercial launch blocked: ${failures.join("; ")}`);
}
