import { runFleetCoreReleaseGate } from "../lib/sovereign-intelligence/fleet-release-gate";

async function main() {
  const result = await runFleetCoreReleaseGate();
  console.log(JSON.stringify(result, null, 2));
  if (!result.fleet.eligible) {
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
