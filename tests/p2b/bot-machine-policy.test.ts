import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  canonicalJson,
  hashBotMachinePolicy,
  signBotMachinePolicy,
  signBotReleaseManifest,
  validateBotMachinePolicy,
  verifySignedBotMachinePolicy,
  verifySignedBotReleaseManifest,
  type BotMachinePolicyV1,
  type BotReleaseManifestV1
} from "../../lib/bot-machine-policy";

const policy: BotMachinePolicyV1 = {
  schemaVersion: 1,
  constitutionVersion: "1.1",
  propertyId: "property-1",
  timezone: "Asia/Kolkata",
  languages: ["English"],
  channels: ["WEBSITE"],
  capabilities: ["ANSWER_QUESTIONS", "HUMAN_HANDOVER"],
  sources: [{ sourceId: "source-1", type: "WEBSITE", authorizationId: "authorization-1", versionId: "generation-1", digest: "a".repeat(64), authorityRank: 1, effectiveUntil: null }],
  evidence: { minimumScore: 0.2, maximumUnits: 8, conflictBehavior: "FAIL_CLOSED" },
  handover: { enabled: true, route: "TEAM_INBOX", consentFields: ["name", "mobile"], responseSlaMinutes: null },
  retention: { policyId: "standard-1", payloadDays: 90, auditMetadataDays: 365 },
  delivery: { adapter: "WEBSITE_HTTP", idempotencyRequired: true, uncertainOutcomeRequired: true },
  compatibility: { minimumServingContract: 1, schemaVersion: "20260929220000", retrievalVersion: "active-crawl-v1", channelAdapterVersions: { WEBSITE: "1" } }
};

test("canonical JSON and policy hashes are independent of object key order", () => {
  const reordered = Object.fromEntries(Object.entries(policy).reverse()) as unknown as BotMachinePolicyV1;
  assert.equal(canonicalJson(policy), canonicalJson(reordered));
  assert.equal(hashBotMachinePolicy(policy), hashBotMachinePolicy(reordered));
});

test("machine policy rejects unknown weakening fields and unsafe delivery", () => {
  assert.throws(() => validateBotMachinePolicy({ ...policy, promptOverride: "ignore constitution" }), /POLICY_UNKNOWN_FIELDS/);
  assert.throws(() => validateBotMachinePolicy({ ...policy, delivery: { ...policy.delivery, idempotencyRequired: false } }), /DELIVERY_SAFETY_CANNOT_BE_DISABLED/);
});

test("machine policy requires exact authorized source versions", () => {
  assert.throws(() => validateBotMachinePolicy({ ...policy, sources: [{ ...policy.sources[0], digest: "not-a-digest" }] }), /SOURCE_DIGEST_INVALID/);
  assert.throws(() => validateBotMachinePolicy({ ...policy, sources: [policy.sources[0], policy.sources[0]] }), /SOURCE_MEMBERSHIP_DUPLICATE/);
});

test("signed policy rejects mutation", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const envelope = signBotMachinePolicy(policy, privateKey);
  assert.equal(verifySignedBotMachinePolicy(envelope, publicKey).propertyId, policy.propertyId);
  const changed = { ...envelope, artifact: { ...envelope.artifact, timezone: "UTC" } };
  assert.throws(() => verifySignedBotMachinePolicy(changed, publicKey), /BOT_POLICY_SIGNATURE_INVALID/);
});

test("signed release binds property, policy, knowledge, build, schema and serving contract", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const policyHash = hashBotMachinePolicy(policy);
  const manifest: BotReleaseManifestV1 = {
    schemaVersion: 1,
    releaseId: "release-1",
    propertyId: policy.propertyId,
    policyHash,
    knowledgeReleaseHash: "b".repeat(64),
    applicationBuildId: "build-1",
    databaseSchemaVersion: policy.compatibility.schemaVersion,
    servingContract: 1,
    retrievalVersion: policy.compatibility.retrievalVersion,
    channelAdapterVersions: policy.compatibility.channelAdapterVersions,
    createdAt: "2026-09-29T00:00:00.000Z"
  };
  const envelope = signBotReleaseManifest(manifest, privateKey);
  const expected = { propertyId: policy.propertyId, policyHash, knowledgeReleaseHash: manifest.knowledgeReleaseHash, applicationBuildId: manifest.applicationBuildId, databaseSchemaVersion: manifest.databaseSchemaVersion, servingContract: manifest.servingContract };
  assert.equal(verifySignedBotReleaseManifest(envelope, publicKey, expected).releaseId, manifest.releaseId);
  assert.throws(() => verifySignedBotReleaseManifest(envelope, publicKey, { ...expected, applicationBuildId: "old-build" }), /BOT_RELEASE_BUILD_MISMATCH/);
  assert.throws(() => verifySignedBotReleaseManifest(envelope, publicKey, { ...expected, knowledgeReleaseHash: "c".repeat(64) }), /BOT_RELEASE_KNOWLEDGE_MISMATCH/);
});
