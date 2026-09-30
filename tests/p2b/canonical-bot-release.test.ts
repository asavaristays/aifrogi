import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { canonicalJson, hashBotMachinePolicy, signBotReleaseManifest, type BotMachinePolicyV1, type BotReleaseManifestV1 } from "../../lib/bot-machine-policy";
import { verifyActiveReleaseRow } from "../../lib/canonical-bot-release";
import { assertCanonicalServingStartup } from "../../lib/canonical-serving-gate";

const policy = { schemaVersion:1, constitutionVersion:"1.1", propertyId:"p-1", timezone:"UTC", languages:["English"], channels:["WEBSITE"], capabilities:["ANSWER_QUESTIONS"], sources:[{sourceId:"s-1",type:"WEBSITE",authorizationId:"a-1",versionId:"v-1",digest:"a".repeat(64),authorityRank:1,effectiveUntil:null}], evidence:{minimumScore:0.5,maximumUnits:5,conflictBehavior:"FAIL_CLOSED"}, handover:{enabled:false,route:null,consentFields:[],responseSlaMinutes:null}, retention:{policyId:"r-1",payloadDays:30,auditMetadataDays:365}, delivery:{adapter:"WEBSITE_HTTP",idempotencyRequired:true,uncertainOutcomeRequired:true}, compatibility:{minimumServingContract:1,schemaVersion:"20260929233000",retrievalVersion:"active-crawl-v1",channelAdapterVersions:{WEBSITE:"1"}} } satisfies BotMachinePolicyV1;

function fixture() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const manifest = { schemaVersion:1,releaseId:"release-1",propertyId:"p-1",policyHash:hashBotMachinePolicy(policy),knowledgeReleaseHash:"b".repeat(64),applicationBuildId:"build-1",databaseSchemaVersion:"20260929233000",servingContract:1,retrievalVersion:"active-crawl-v1",channelAdapterVersions:{WEBSITE:"1"},createdAt:"2026-09-29T00:00:00.000Z" } satisfies BotReleaseManifestV1;
  const signed = signBotReleaseManifest(manifest, privateKey);
  const keyId = "release-key-1";
  const env = { NODE_ENV:"test",AIFROGI_BUILD_ID:"build-1",AIFROGI_DATABASE_SCHEMA_VERSION:"20260929233000",AIFROGI_REQUIRED_SERVING_CONTRACT:"1",AIFROGI_BOT_SIGNER_PUBLIC_KEYS:JSON.stringify({[keyId]:publicKey.export({type:"spki",format:"pem"}).toString()}) } as NodeJS.ProcessEnv;
  const row = {releaseId:manifest.releaseId,manifestHash:signed.hash,policyHash:manifest.policyHash,knowledgeReleaseHash:manifest.knowledgeReleaseHash,applicationBuildId:manifest.applicationBuildId,databaseSchemaVersion:manifest.databaseSchemaVersion,servingContract:1,retrievalVersion:manifest.retrievalVersion,canonicalPayload:canonicalJson(manifest),signature:signed.signature,signerKeyId:keyId};
  return { env, row };
}

test("active release verifies exact signed runtime identity", () => {
  const {env,row}=fixture();
  assert.equal(verifyActiveReleaseRow(row,env).releaseId,"release-1");
  assert.throws(()=>verifyActiveReleaseRow({...row,knowledgeReleaseHash:"c".repeat(64)},env),/BOT_RELEASE_KNOWLEDGE_MISMATCH/);
  assert.throws(()=>verifyActiveReleaseRow(row,{...env,AIFROGI_BUILD_ID:"old-build"}),/BOT_RELEASE_BUILD_MISMATCH/);
});

test("startup refuses signed release enforcement without schema and trust keys", () => {
  const base={NODE_ENV:"test",AIFROGI_CANONICAL_SERVING_REQUIRED:"1",AIFROGI_LEGACY_FACT_FALLBACK:"0",AIFROGI_REQUIRED_SERVING_CONTRACT:"1",AIFROGI_BUILD_ID:"build-1",AIFROGI_ADMITTED_RELEASE_ID:"build-1",AIFROGI_SIGNED_BOT_RELEASE_REQUIRED:"1"} as NodeJS.ProcessEnv;
  assert.throws(()=>assertCanonicalServingStartup(base),/BOT_RELEASE_SCHEMA_IDENTITY_MISSING/);
  assert.throws(()=>assertCanonicalServingStartup({...base,AIFROGI_DATABASE_SCHEMA_VERSION:"20260929233000"}),/BOT_RELEASE_SIGNER_KEYS_MISSING/);
});
