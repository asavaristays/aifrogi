import { withDatabaseIdentity } from "../lib/db";
import { CASTLE_PILOT_TENANT, getPilotReport, setPilotPolicy } from "../lib/typesafe-pilot-store";

async function main() {
  await withDatabaseIdentity({ organizationId: CASTLE_PILOT_TENANT, platformAuthority: false, actor: "authorized-pilot-operator", systemPurpose: "typesafe-pilot-report" }, async () => {
    if (process.argv.includes("--initialize")) {
      const expiresAt = "2026-09-21T08:46:35.000Z";
      await setPilotPolicy(CASTLE_PILOT_TENANT, { enabled: true, dailyLimit: 20, expiresAt }, "authorized-pilot-operator");
    }
    console.log(JSON.stringify(await getPilotReport(), null, 2));
  });
}
main().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
