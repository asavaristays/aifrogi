import { createHash, sign, verify, type KeyLike } from "node:crypto";

export const BOT_MACHINE_POLICY_SCHEMA_VERSION = 1 as const;
export const BOT_RELEASE_MANIFEST_SCHEMA_VERSION = 1 as const;

const sourceTypes = ["WEBSITE", "PDF", "SPREADSHEET", "FORM", "PROFILE", "CONNECTOR"] as const;
const conflictBehaviors = ["FAIL_CLOSED", "AUTHORITY_ORDER", "DISCLOSE_AND_HANDOVER"] as const;

export type BotMachinePolicyV1 = {
  schemaVersion: 1;
  constitutionVersion: "1.1";
  propertyId: string;
  timezone: string;
  languages: string[];
  channels: string[];
  capabilities: string[];
  sources: Array<{
    sourceId: string;
    type: (typeof sourceTypes)[number];
    authorizationId: string;
    versionId: string;
    digest: string;
    authorityRank: number;
    effectiveUntil: string | null;
  }>;
  evidence: {
    minimumScore: number;
    maximumUnits: number;
    conflictBehavior: (typeof conflictBehaviors)[number];
  };
  handover: {
    enabled: boolean;
    route: string | null;
    consentFields: string[];
    responseSlaMinutes: number | null;
  };
  retention: { policyId: string; payloadDays: number; auditMetadataDays: number };
  delivery: { adapter: string; idempotencyRequired: true; uncertainOutcomeRequired: true };
  compatibility: {
    minimumServingContract: number;
    schemaVersion: string;
    retrievalVersion: string;
    channelAdapterVersions: Record<string, string>;
  };
};

export type BotReleaseManifestV1 = {
  schemaVersion: 1;
  releaseId: string;
  propertyId: string;
  policyHash: string;
  knowledgeReleaseHash: string;
  applicationBuildId: string;
  databaseSchemaVersion: string;
  servingContract: number;
  retrievalVersion: string;
  channelAdapterVersions: Record<string, string>;
  createdAt: string;
};

export type SignedArtifact<T> = { artifact: T; hash: string; algorithm: "RSA-SHA256"; signature: string };

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}_MUST_BE_OBJECT`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${label}_UNKNOWN_FIELDS:${unexpected.sort().join(",")}`);
}

function nonEmpty(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}_REQUIRED`);
  return value;
}

function stringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== "string" || !item.trim())) throw new Error(`${label}_INVALID`);
  if (new Set(value).size !== value.length) throw new Error(`${label}_DUPLICATE`);
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, canonicalValue(child)]));
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalValue(value));
}

export function validateBotMachinePolicy(value: unknown): asserts value is BotMachinePolicyV1 {
  const policy = record(value, "POLICY");
  exactKeys(policy, ["schemaVersion", "constitutionVersion", "propertyId", "timezone", "languages", "channels", "capabilities", "sources", "evidence", "handover", "retention", "delivery", "compatibility"], "POLICY");
  if (policy.schemaVersion !== BOT_MACHINE_POLICY_SCHEMA_VERSION) throw new Error("POLICY_SCHEMA_UNSUPPORTED");
  if (policy.constitutionVersion !== "1.1") throw new Error("CONSTITUTION_VERSION_UNSUPPORTED");
  nonEmpty(policy.propertyId, "PROPERTY_ID");
  const timezone = nonEmpty(policy.timezone, "TIMEZONE");
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); } catch { throw new Error("TIMEZONE_INVALID"); }
  stringArray(policy.languages, "LANGUAGES");
  stringArray(policy.channels, "CHANNELS");
  stringArray(policy.capabilities, "CAPABILITIES");

  if (!Array.isArray(policy.sources) || !policy.sources.length) throw new Error("SOURCES_REQUIRED");
  const memberships = new Set<string>();
  for (const rawSource of policy.sources) {
    const source = record(rawSource, "SOURCE");
    exactKeys(source, ["sourceId", "type", "authorizationId", "versionId", "digest", "authorityRank", "effectiveUntil"], "SOURCE");
    const sourceId = nonEmpty(source.sourceId, "SOURCE_ID");
    nonEmpty(source.authorizationId, "SOURCE_AUTHORIZATION_ID");
    const versionId = nonEmpty(source.versionId, "SOURCE_VERSION_ID");
    if (!sourceTypes.includes(source.type as (typeof sourceTypes)[number])) throw new Error("SOURCE_TYPE_INVALID");
    if (typeof source.digest !== "string" || !/^[a-f0-9]{64}$/.test(source.digest)) throw new Error("SOURCE_DIGEST_INVALID");
    if (!Number.isInteger(source.authorityRank) || Number(source.authorityRank) < 1) throw new Error("SOURCE_AUTHORITY_RANK_INVALID");
    if (source.effectiveUntil !== null && (typeof source.effectiveUntil !== "string" || !Number.isFinite(Date.parse(source.effectiveUntil)))) throw new Error("SOURCE_EFFECTIVE_UNTIL_INVALID");
    const membership = `${sourceId}:${versionId}`;
    if (memberships.has(membership)) throw new Error("SOURCE_MEMBERSHIP_DUPLICATE");
    memberships.add(membership);
  }

  const evidence = record(policy.evidence, "EVIDENCE");
  exactKeys(evidence, ["minimumScore", "maximumUnits", "conflictBehavior"], "EVIDENCE");
  if (typeof evidence.minimumScore !== "number" || evidence.minimumScore < 0 || evidence.minimumScore > 1) throw new Error("EVIDENCE_MINIMUM_SCORE_INVALID");
  if (!Number.isInteger(evidence.maximumUnits) || Number(evidence.maximumUnits) < 1 || Number(evidence.maximumUnits) > 20) throw new Error("EVIDENCE_MAXIMUM_UNITS_INVALID");
  if (!conflictBehaviors.includes(evidence.conflictBehavior as (typeof conflictBehaviors)[number])) throw new Error("EVIDENCE_CONFLICT_BEHAVIOR_INVALID");

  const handover = record(policy.handover, "HANDOVER");
  exactKeys(handover, ["enabled", "route", "consentFields", "responseSlaMinutes"], "HANDOVER");
  if (typeof handover.enabled !== "boolean") throw new Error("HANDOVER_ENABLED_INVALID");
  if (handover.route !== null && (typeof handover.route !== "string" || !handover.route.trim())) throw new Error("HANDOVER_ROUTE_INVALID");
  if (handover.enabled && !handover.route) throw new Error("HANDOVER_ROUTE_REQUIRED");
  if (!Array.isArray(handover.consentFields) || handover.consentFields.some((field) => typeof field !== "string" || !field.trim())) throw new Error("HANDOVER_CONSENT_FIELDS_INVALID");
  if (handover.responseSlaMinutes !== null && (!Number.isInteger(handover.responseSlaMinutes) || Number(handover.responseSlaMinutes) < 1)) throw new Error("HANDOVER_SLA_INVALID");

  const retention = record(policy.retention, "RETENTION");
  exactKeys(retention, ["policyId", "payloadDays", "auditMetadataDays"], "RETENTION");
  nonEmpty(retention.policyId, "RETENTION_POLICY_ID");
  if (!Number.isInteger(retention.payloadDays) || Number(retention.payloadDays) < 0) throw new Error("RETENTION_PAYLOAD_DAYS_INVALID");
  if (!Number.isInteger(retention.auditMetadataDays) || Number(retention.auditMetadataDays) < Number(retention.payloadDays)) throw new Error("RETENTION_AUDIT_DAYS_INVALID");

  const delivery = record(policy.delivery, "DELIVERY");
  exactKeys(delivery, ["adapter", "idempotencyRequired", "uncertainOutcomeRequired"], "DELIVERY");
  nonEmpty(delivery.adapter, "DELIVERY_ADAPTER");
  if (delivery.idempotencyRequired !== true || delivery.uncertainOutcomeRequired !== true) throw new Error("DELIVERY_SAFETY_CANNOT_BE_DISABLED");

  const compatibility = record(policy.compatibility, "COMPATIBILITY");
  exactKeys(compatibility, ["minimumServingContract", "schemaVersion", "retrievalVersion", "channelAdapterVersions"], "COMPATIBILITY");
  if (!Number.isInteger(compatibility.minimumServingContract) || Number(compatibility.minimumServingContract) < 1) throw new Error("SERVING_CONTRACT_INVALID");
  nonEmpty(compatibility.schemaVersion, "DATABASE_SCHEMA_VERSION");
  nonEmpty(compatibility.retrievalVersion, "RETRIEVAL_VERSION");
  const adapters = record(compatibility.channelAdapterVersions, "CHANNEL_ADAPTER_VERSIONS");
  if (!Object.keys(adapters).length || Object.values(adapters).some((version) => typeof version !== "string" || !version.trim())) throw new Error("CHANNEL_ADAPTER_VERSIONS_INVALID");
  for (const channel of policy.channels as string[]) if (!adapters[channel]) throw new Error(`CHANNEL_ADAPTER_VERSION_MISSING:${channel}`);
}

export function validateBotReleaseManifest(value: unknown): asserts value is BotReleaseManifestV1 {
  const manifest = record(value, "RELEASE");
  exactKeys(manifest, ["schemaVersion", "releaseId", "propertyId", "policyHash", "knowledgeReleaseHash", "applicationBuildId", "databaseSchemaVersion", "servingContract", "retrievalVersion", "channelAdapterVersions", "createdAt"], "RELEASE");
  if (manifest.schemaVersion !== BOT_RELEASE_MANIFEST_SCHEMA_VERSION) throw new Error("RELEASE_SCHEMA_UNSUPPORTED");
  for (const [key, label] of [["releaseId", "RELEASE_ID"], ["propertyId", "PROPERTY_ID"], ["applicationBuildId", "APPLICATION_BUILD_ID"], ["databaseSchemaVersion", "DATABASE_SCHEMA_VERSION"], ["retrievalVersion", "RETRIEVAL_VERSION"]] as const) nonEmpty(manifest[key], label);
  for (const key of ["policyHash", "knowledgeReleaseHash"] as const) if (typeof manifest[key] !== "string" || !/^[a-f0-9]{64}$/.test(manifest[key])) throw new Error(`${key.toUpperCase()}_INVALID`);
  if (!Number.isInteger(manifest.servingContract) || Number(manifest.servingContract) < 1) throw new Error("SERVING_CONTRACT_INVALID");
  if (typeof manifest.createdAt !== "string" || !Number.isFinite(Date.parse(manifest.createdAt))) throw new Error("RELEASE_CREATED_AT_INVALID");
  const adapters = record(manifest.channelAdapterVersions, "CHANNEL_ADAPTER_VERSIONS");
  if (!Object.keys(adapters).length || Object.values(adapters).some((version) => typeof version !== "string" || !version.trim())) throw new Error("CHANNEL_ADAPTER_VERSIONS_INVALID");
}

export function hashBotMachinePolicy(policy: BotMachinePolicyV1) {
  validateBotMachinePolicy(policy);
  return sha256(canonicalJson(policy));
}

export function hashBotReleaseManifest(manifest: BotReleaseManifestV1) {
  validateBotReleaseManifest(manifest);
  return sha256(canonicalJson(manifest));
}

function signed<T>(artifact: T, hash: string, privateKey: KeyLike): SignedArtifact<T> {
  return { artifact, hash, algorithm: "RSA-SHA256", signature: sign("RSA-SHA256", Buffer.from(hash, "utf8"), privateKey).toString("base64url") };
}

export function signBotMachinePolicy(policy: BotMachinePolicyV1, privateKey: KeyLike) {
  return signed(policy, hashBotMachinePolicy(policy), privateKey);
}

export function signBotReleaseManifest(manifest: BotReleaseManifestV1, privateKey: KeyLike) {
  return signed(manifest, hashBotReleaseManifest(manifest), privateKey);
}

export function verifySignedBotMachinePolicy(envelope: SignedArtifact<BotMachinePolicyV1>, publicKey: KeyLike) {
  validateBotMachinePolicy(envelope.artifact);
  const hash = hashBotMachinePolicy(envelope.artifact);
  if (envelope.algorithm !== "RSA-SHA256" || envelope.hash !== hash || !verify("RSA-SHA256", Buffer.from(hash, "utf8"), publicKey, Buffer.from(envelope.signature, "base64url"))) throw new Error("BOT_POLICY_SIGNATURE_INVALID");
  return envelope.artifact;
}

export function verifySignedBotReleaseManifest(envelope: SignedArtifact<BotReleaseManifestV1>, publicKey: KeyLike, expected: { propertyId: string; policyHash: string; knowledgeReleaseHash: string; applicationBuildId: string; databaseSchemaVersion: string; servingContract: number }) {
  validateBotReleaseManifest(envelope.artifact);
  const hash = hashBotReleaseManifest(envelope.artifact);
  if (envelope.algorithm !== "RSA-SHA256" || envelope.hash !== hash || !verify("RSA-SHA256", Buffer.from(hash, "utf8"), publicKey, Buffer.from(envelope.signature, "base64url"))) throw new Error("BOT_RELEASE_SIGNATURE_INVALID");
  const manifest = envelope.artifact;
  if (manifest.propertyId !== expected.propertyId) throw new Error("BOT_RELEASE_PROPERTY_MISMATCH");
  if (manifest.policyHash !== expected.policyHash) throw new Error("BOT_RELEASE_POLICY_MISMATCH");
  if (manifest.knowledgeReleaseHash !== expected.knowledgeReleaseHash) throw new Error("BOT_RELEASE_KNOWLEDGE_MISMATCH");
  if (manifest.applicationBuildId !== expected.applicationBuildId) throw new Error("BOT_RELEASE_BUILD_MISMATCH");
  if (manifest.databaseSchemaVersion !== expected.databaseSchemaVersion) throw new Error("BOT_RELEASE_SCHEMA_MISMATCH");
  if (manifest.servingContract !== expected.servingContract) throw new Error("BOT_RELEASE_CONTRACT_MISMATCH");
  return manifest;
}
