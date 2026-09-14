import { getDb } from "@/lib/db";
import { runCoreLaunchCertification } from "@/lib/sovereign-intelligence/launch-certification";
import { getTenantKnowledgeRevision, readTenantCertification, runTenantCertification, tenantCertificationStatus } from "@/lib/tenant-intelligence/certification";

export type FleetTenantResult = {
  organizationId: string;
  organizationName: string;
  propertySlug: string;
  eligible: boolean;
  blocker: string | null;
};

export function assessFleetRelease(coreEligible: boolean, tenants: FleetTenantResult[]) {
  const blockers = [
    ...(!coreEligible ? ["Core Intelligence certification failed."] : []),
    ...tenants.filter((tenant) => !tenant.eligible).map((tenant) => `${tenant.organizationName} (${tenant.propertySlug}): ${tenant.blocker || "Golden certification failed."}`)
  ];
  return { eligible: blockers.length === 0, liveTenantCount: tenants.length, passedTenantCount: tenants.filter((tenant) => tenant.eligible).length, blockers };
}

export async function runFleetCoreReleaseGate() {
  const core = runCoreLaunchCertification();
  const db = getDb();
  if (!db) {
    const fleet = assessFleetRelease(core.eligible, []);
    return { core, fleet: { ...fleet, eligible: false, blockers: [...fleet.blockers, "Database unavailable; live tenant coverage cannot be verified."] }, tenants: [] };
  }

  const organizations = await db.organization.findMany({
    where: { isDemo: false, botProfile: { status: "LIVE" } },
    select: { id: true, name: true, properties: { select: { slug: true } } },
    orderBy: { name: "asc" }
  });
  const tenants: FleetTenantResult[] = [];
  for (const organization of organizations) {
    if (!organization.properties.length) {
      tenants.push({ organizationId: organization.id, organizationName: organization.name, propertySlug: "missing", eligible: false, blocker: "Live website bot has no tenant property." });
      continue;
    }
    for (const property of organization.properties) {
      const saved = await readTenantCertification(property.slug);
      if (saved.level !== "GOLDEN") {
        tenants.push({ organizationId: organization.id, organizationName: organization.name, propertySlug: property.slug, eligible: false, blocker: "Golden tenant bank is required for a Core release." });
        continue;
      }
      try {
        const revision = await getTenantKnowledgeRevision(property.slug);
        const rerun = await runTenantCertification(property.slug, revision, organization.id);
        const status = tenantCertificationStatus(rerun, revision);
        tenants.push({ organizationId: organization.id, organizationName: organization.name, propertySlug: property.slug, eligible: status.eligible, blocker: status.blocker });
      } catch (error) {
        tenants.push({ organizationId: organization.id, organizationName: organization.name, propertySlug: property.slug, eligible: false, blocker: error instanceof Error ? error.message : "Golden certification could not run." });
      }
    }
  }
  return { core, fleet: assessFleetRelease(core.eligible, tenants), tenants };
}
