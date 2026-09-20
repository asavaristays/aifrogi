import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertTypesafeStagingEligible, type TypesafePromotionEvidence } from "../lib/typesafe-promotion-gates";

async function main() {
  const evidencePath = process.argv[2];
  if (!evidencePath) throw new Error("Usage: npm run verify:typesafe:promotion -- <reviewed-evidence.json>");
  const evidence = JSON.parse(await readFile(resolve(evidencePath), "utf8")) as TypesafePromotionEvidence;
  const result = assertTypesafeStagingEligible(evidence);
  console.log(JSON.stringify({ eligibleForStagingReview: true, syntheticAccuracy: result.syntheticAccuracy, unavailableRate: result.unavailableRate, gates: result.gates }, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "TypeSafe promotion verification failed");
  process.exit(1);
});
