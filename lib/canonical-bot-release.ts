import { createPublicKey } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { canonicalJson, verifySignedBotReleaseManifest, type BotReleaseManifestV1 } from "./bot-machine-policy";
import { withCanonicalRole, type CanonicalIdentity } from "./canonical-db-context";

type ActiveReleaseRow = {
  releaseId: string;
  manifestHash: string;
  policyHash: string;
  knowledgeReleaseHash: string;
  applicationBuildId: string;
  databaseSchemaVersion: string;
  servingContract: number;
  retrievalVersion: string;
  canonicalPayload: string;
  signature: string;
  signerKeyId: string;
};

function signerKeys(env: NodeJS.ProcessEnv) {
  let parsed: unknown;
  try { parsed = JSON.parse(env.AIFROGI_BOT_SIGNER_PUBLIC_KEYS || "{}"); } catch { throw new Error("BOT_SIGNER_KEYS_INVALID"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("BOT_SIGNER_KEYS_INVALID");
  return parsed as Record<string, string>;
}

export function signedBotReleaseRequired(env: NodeJS.ProcessEnv = process.env) {
  return env.AIFROGI_SIGNED_BOT_RELEASE_REQUIRED === "1";
}

export function verifyActiveReleaseRow(row: ActiveReleaseRow, env: NodeJS.ProcessEnv = process.env) {
  const buildId = env.AIFROGI_BUILD_ID;
  const schemaVersion = env.AIFROGI_DATABASE_SCHEMA_VERSION;
  const servingContract = Number(env.AIFROGI_REQUIRED_SERVING_CONTRACT);
  if (!buildId || !schemaVersion || !Number.isInteger(servingContract)) throw new Error("BOT_RELEASE_RUNTIME_IDENTITY_INCOMPLETE");
  let artifact: BotReleaseManifestV1;
  try { artifact = JSON.parse(row.canonicalPayload) as BotReleaseManifestV1; } catch { throw new Error("BOT_RELEASE_PAYLOAD_INVALID"); }
  if (canonicalJson(artifact) !== row.canonicalPayload) throw new Error("BOT_RELEASE_PAYLOAD_NOT_CANONICAL");
  const pem = signerKeys(env)[row.signerKeyId];
  if (!pem) throw new Error("BOT_RELEASE_SIGNER_NOT_TRUSTED");
  return verifySignedBotReleaseManifest(
    { artifact, hash: row.manifestHash, algorithm: "RSA-SHA256", signature: row.signature },
    createPublicKey(pem),
    { propertyId: artifact.propertyId, policyHash: row.policyHash, knowledgeReleaseHash: row.knowledgeReleaseHash, applicationBuildId: buildId, databaseSchemaVersion: schemaVersion, servingContract }
  );
}

export async function requireActiveBotRelease(identity: CanonicalIdentity, env: NodeJS.ProcessEnv = process.env) {
  if (!signedBotReleaseRequired(env)) return { enabled: false as const };
  const row = await withCanonicalRole("aifrogi_public", { ...identity, purpose: "PUBLIC_ANSWER" }, async (tx) => {
    const rows = await tx.$queryRaw<ActiveReleaseRow[]>(Prisma.sql`SELECT * FROM aifrogi_security.active_bot_release(${identity.propertyId})`);
    if (rows.length !== 1) throw new Error("ACTIVE_BOT_RELEASE_MISSING");
    return rows[0];
  });
  return { enabled: true as const, manifest: verifyActiveReleaseRow(row, env) };
}

