export const CANONICAL_SERVING_CONTRACT_VERSION = 1 as const;

export function assertCanonicalServingStartup(env: NodeJS.ProcessEnv = process.env) {
  const required = env.AIFROGI_CANONICAL_SERVING_REQUIRED === "1";
  if (!required) return { enabled: false as const, reason: "CANONICAL_SERVING_NOT_REQUIRED" };
  if (env.AIFROGI_LEGACY_FACT_FALLBACK !== "0") throw new Error("LEGACY_FACT_FALLBACK_FORBIDDEN");
  if (env.AIFROGI_REQUIRED_SERVING_CONTRACT !== String(CANONICAL_SERVING_CONTRACT_VERSION)) throw new Error("CANONICAL_SERVING_BUILD_INCOMPATIBLE");
  if (!env.AIFROGI_BUILD_ID || env.AIFROGI_ADMITTED_RELEASE_ID !== env.AIFROGI_BUILD_ID) throw new Error("CANONICAL_RELEASE_NOT_ADMITTED");
  if (env.AIFROGI_SIGNED_BOT_RELEASE_REQUIRED === "1") {
    if (!env.AIFROGI_DATABASE_SCHEMA_VERSION) throw new Error("BOT_RELEASE_SCHEMA_IDENTITY_MISSING");
    if (!env.AIFROGI_BOT_SIGNER_PUBLIC_KEYS) throw new Error("BOT_RELEASE_SIGNER_KEYS_MISSING");
  }
  return { enabled: true as const, contractVersion: CANONICAL_SERVING_CONTRACT_VERSION };
}

export function canonicalFactsRequired(env: NodeJS.ProcessEnv = process.env) {
  return assertCanonicalServingStartup(env).enabled;
}
