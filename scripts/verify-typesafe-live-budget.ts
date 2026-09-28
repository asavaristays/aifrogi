import { withDatabaseIdentity } from "../lib/db";
import { CASTLE_PILOT_TENANT, reservePilotAttempt } from "../lib/typesafe-pilot-store";

// Consumes at most one pilot reservation; no external request or customer write.
async function main() {
  const results = await withDatabaseIdentity({ organizationId: CASTLE_PILOT_TENANT, platformAuthority: false, actor: "authorized-budget-check", systemPurpose: "typesafe-budget-verification" }, async () => Promise.all([
    reservePilotAttempt(CASTLE_PILOT_TENANT), reservePilotAttempt(CASTLE_PILOT_TENANT), reservePilotAttempt("not-authorized")
  ]));
  if (results.filter(Boolean).length !== 1 || results[2]) throw Error("Expected exactly one tenant-bound reservation; inspect quota before retrying");
  console.log(JSON.stringify({ concurrentRequests: 2, accepted: 1, otherTenantBlocked: true, providerRequests: 0 }));
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error.message);process.exit(1);});
