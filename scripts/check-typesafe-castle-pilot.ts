import { observeTypesafeRuntime } from "../lib/typesafe-runtime-shadow";

async function main() {
  const observation = await observeTypesafeRuntime({ organizationId: "cmu2dcedu003284kxjotchehs", message: "please book room", primaryIntent: "BUSINESS" });
  if (!observation || observation.status !== "OBSERVED") throw new Error("Synthetic shadow connectivity check did not return an observation");
  console.log(JSON.stringify({ synthetic: true, customerConversationCreated: false, observation }));
}
main().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
