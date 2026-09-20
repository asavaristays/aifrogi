import { runFleetCoreReleaseGate } from "../lib/sovereign-intelligence/fleet-release-gate";
import { withDatabaseIdentity } from "../lib/db";

async function main() {
  const result = await withDatabaseIdentity({ organizationId: "", platformAuthority: true, actor: "release-certification", systemPurpose: "core-fleet-release-verification" }, runFleetCoreReleaseGate);
  console.log(JSON.stringify(result, null, 2));
  if (!result.fleet.liveTenantCount || !result.fleet.eligible) {
    if (!result.fleet.liveTenantCount) console.error("No live tenants found; production fleet coverage is unverified.");
    console.error(`Core fleet release blocked: ${result.fleet.blockers.join(" ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Core fleet release eligible: ${result.fleet.passedTenantCount}/${result.fleet.liveTenantCount} live tenants passed Golden certification.`);
}

main().catch((error) => {
  console.error("Core fleet release verification could not complete.", error);
  process.exitCode = 1;
});
