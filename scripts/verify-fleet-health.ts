import assert from "node:assert/strict";
import { readFleetKnowledgeHealth } from "@/lib/repositories/fleet-health-repository";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

async function main() {
  const result = await withTenantDatabaseContext({ kind: "platform-admin", actor: "fleet-health-fixture" }, () => readFleetKnowledgeHealth(new Date("2026-09-30T12:00:00.000Z")));
  assert.equal(result.bots.length, 1);
  assert.equal(result.bots[0].propertyId, "fleet-property");
  assert.equal(result.bots[0].readiness.ready, false);
  assert.equal(result.gapTopics.length, 1);
  assert.equal(result.gapTopics[0].propertyId, "fleet-property");
  console.log("FLEET_KNOWLEDGE_HEALTH_PASS");
  process.exit(0);
}
main().catch((error) => { console.error(error); process.exit(1); });
