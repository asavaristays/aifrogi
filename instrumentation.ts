import { assertCanonicalServingStartup } from "@/lib/canonical-serving-gate";
import { initializeCanonicalRoleClients } from "@/lib/canonical-db-context";

export async function register() {
  const gate = assertCanonicalServingStartup();
  if (gate.enabled) initializeCanonicalRoleClients();
}
