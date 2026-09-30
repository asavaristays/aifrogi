import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { redactBeforePersistence, sanitizePersistencePayload } from "../../lib/pre-persistence-redaction";
import { resolveSourceAuthority } from "../../lib/source-authority-resolution";
import { confirmTransaction, executeGovernedTransaction, previewTransaction, truthfulTransactionOutcome, type TransactionOutcome } from "../../lib/transaction-capability-gateway";
import { buildReleaseSourceManifest, compareRuntimeRelease, runtimeReleaseDriftFromEnv } from "../../lib/release-integrity";
import { assertCanonicalFactualEnvelope } from "../../lib/canonical-channel-boundary";
import { deliveryUncertaintyAlerts } from "../../lib/fleet-knowledge-observability";
import { createHash, generateKeyPairSync } from "node:crypto";
import { signReleaseSource, verifyReleaseSource } from "../../lib/release-source-signature";
import { ADMITTED_TRANSACTION_CONNECTORS, qualifyConnectorAmbiguity } from "../../lib/connector-qualification";
import { approveGovernanceRecord, approveMaterialAction, authorizeBreakGlass, consumeMaterialApproval, executeRepairCommand, issueBreakGlass, reviewBreakGlass } from "../../lib/platform-governance-controls";
import { hybridRetrieve } from "../../lib/hybrid-retrieval";

test("secrets are redacted recursively before persistence", () => {
  const result=redactBeforePersistence("password=hunter2 otp 123456 api_key=abcdefghijk card 4111 1111 1111 1111");
  assert.deepEqual(result.findings,["PASSWORD","OTP","CARD","API_KEY"]);
  assert.doesNotMatch(result.redacted,/hunter2|123456|abcdefghijk|4111/);
  assert.deepEqual(sanitizePersistencePayload({body:"Bearer abc.def.ghi",nested:["cvv 123"]}),{body:"[REDACTED:BEARER]",nested:["[REDACTED:CVV]"]});
});

test("source conflicts obey signed authority behavior",()=>{
  const candidates=[{sourceId:"owner",versionId:"1",authorityRank:1,effectiveAt:"2026-09-30T00:00:00Z",valueDigest:"a"},{sourceId:"web",versionId:"2",authorityRank:2,effectiveAt:"2026-09-30T01:00:00Z",valueDigest:"b"}];
  assert.equal(resolveSourceAuthority(candidates,"FAIL_CLOSED").disposition,"BLOCK");
  assert.equal(resolveSourceAuthority(candidates,"AUTHORITY_ORDER").selected?.sourceId,"owner");
  assert.equal(resolveSourceAuthority(candidates,"DISCLOSE_AND_HANDOVER").disposition,"HANDOVER");
  assert.throws(()=>assertCanonicalFactualEnvelope({channel:"WEBSITE",factual:true,answer:"A",claimIds:["c"],sourceAuthority:{candidates,behavior:"FAIL_CLOSED"}},{NODE_ENV:"test",AIFROGI_CANONICAL_SERVING_REQUIRED:"1",AIFROGI_LEGACY_FACT_FALLBACK:"0",AIFROGI_REQUIRED_SERVING_CONTRACT:"1",AIFROGI_BUILD_ID:"test-build",AIFROGI_ADMITTED_RELEASE_ID:"test-build"}),/SOURCE_CONFLICT_UNRESOLVED/);
});

test("transaction gateway requires capability, preview, confirmation and stable idempotency",()=>{
  const enabled=[{capability:"CREATE_BOOKING",connector:"PMS",requiresConfirmation:true as const,idempotencyRequired:true as const}];
  const preview=previewTransaction({propertyId:"p",capability:"CREATE_BOOKING",connector:"PMS",payload:{date:"2026-10-01"},enabled,now:new Date("2026-09-30T00:00:00Z")});
  const first=confirmTransaction({preview,payload:{date:"2026-10-01"},confirmationId:"yes",idempotencyKey:"k1",now:new Date("2026-09-30T00:01:00Z")});
  const duplicate=confirmTransaction({preview,payload:{date:"2026-10-01"},confirmationId:"yes",idempotencyKey:"k1",now:new Date("2026-09-30T00:01:00Z")});
  assert.equal(first.operationKey,duplicate.operationKey);
  assert.throws(()=>confirmTransaction({preview,payload:{date:"changed"},confirmationId:"yes",idempotencyKey:"k1",now:new Date("2026-09-30T00:01:00Z")}),/INPUT_CHANGED/);
  assert.equal(truthfulTransactionOutcome({accepted:true,providerReference:"r",commitSucceeded:false}).state,"UNCERTAIN");
  assert.equal(truthfulTransactionOutcome({accepted:true,providerReference:"r",commitSucceeded:true}).state,"CONFIRMED");
});

test("connector execution preserves duplicates and durable uncertain outcomes",async()=>{
  const outcomes=new Map<string,TransactionOutcome>();
  let finalizeFails=true, sends=0;
  const store={reserve:async(key:string)=>({existing:outcomes.get(key)??null}),finalize:async(key:string,outcome:TransactionOutcome)=>{if(finalizeFails)throw new Error("COMMIT_FAILED");outcomes.set(key,outcome);},markUncertain:async(key:string,outcome:TransactionOutcome)=>{outcomes.set(key,outcome);}};
  const uncertain=await executeGovernedTransaction({operationKey:"k",timeoutMs:50,store,send:async()=>{sends++;return{accepted:true,providerReference:"provider-1"};}});
  assert.equal(uncertain.state,"UNCERTAIN");
  finalizeFails=false;
  const duplicate=await executeGovernedTransaction({operationKey:"k",timeoutMs:50,store,send:async()=>{sends++;return{accepted:true,providerReference:"provider-2"};}});
  assert.equal(duplicate.state,"UNCERTAIN"); assert.equal(sends,1);
  const timedOut=await executeGovernedTransaction({operationKey:"timeout",timeoutMs:5,store,send:async()=>new Promise(()=>{})});
  assert.equal(timedOut.state,"UNCERTAIN");
});

test("release manifest detects runtime drift",()=>{
  const expected=buildReleaseSourceManifest({releaseId:"r1",gitCommit:"a".repeat(40),files:[{path:"b",sha256:"b".repeat(64)},{path:"a",sha256:"a".repeat(64)}]});
  assert.equal(compareRuntimeRelease(expected,{releaseId:"r1",gitCommit:"a".repeat(40),files:[{path:"a",sha256:"a".repeat(64)},{path:"b",sha256:"b".repeat(64)}]}).drift,false);
  assert.equal(compareRuntimeRelease(expected,{releaseId:"r1",gitCommit:"a".repeat(40),files:[{path:"a",sha256:"c".repeat(64)},{path:"b",sha256:"b".repeat(64)}]}).drift,true);
  const runtime={releaseId:"r1",gitCommit:"a".repeat(40),files:[{path:"a",sha256:"a".repeat(64)},{path:"b",sha256:"b".repeat(64)}]};
  assert.equal(runtimeReleaseDriftFromEnv({NODE_ENV:"test",AIFROGI_EXPECTED_SOURCE_MANIFEST:JSON.stringify(expected),AIFROGI_RUNTIME_SOURCE_MANIFEST:JSON.stringify(runtime)}).drift,false);
});

test("delivery uncertainty alerts expose age and provider",()=>{
  const alerts=deliveryUncertaintyAlerts([{propertyId:"p",provider:"SMTP",occurredAt:"2026-09-30T10:00:00Z",deliveryKey:"k"}],new Date("2026-09-30T11:01:00Z"),15);
  assert.equal(alerts[0].severity,"CRITICAL"); assert.equal(alerts[0].provider,"SMTP");
});

test("release operations enforce catalog parity and closed-edge rollback",()=>{
  assert.match(readFileSync("ops/verify-restored-catalog-parity.sh","utf8"),/catalog drift/);
  assert.match(readFileSync("ops/verify-edge-closed-rollback.sh","utf8"),/edge must be CLOSED before rollback/);
  assert.match(readFileSync("scripts/verify-privileged-routine-authority.sql","utf8"),/PUBLIC_SECURITY_DEFINER_EXECUTE_FOUND/);
});

test("release source snapshot requires a trusted signature and rejects mutation",()=>{
  const pair=generateKeyPairSync("rsa",{modulusLength:2048,publicKeyEncoding:{type:"spki",format:"pem"},privateKeyEncoding:{type:"pkcs8",format:"pem"}});
  const signed=signReleaseSource({manifest:{releaseId:"r1",files:[{path:"a",sha256:"a".repeat(64)}]},privateKeyPem:pair.privateKey,keyId:"release-test"});
  assert.equal(verifyReleaseSource(signed,{"release-test":pair.publicKey}).verified,true);
  assert.throws(()=>verifyReleaseSource({...signed,manifest:{releaseId:"mutated"}},{"release-test":pair.publicKey}),/MANIFEST_MUTATED/);
  assert.throws(()=>verifyReleaseSource(signed,{}),/SIGNER_UNTRUSTED/);
});

test("every admitted transaction connector passes ambiguity and duplicate qualification",async()=>{
  const results=await Promise.all(ADMITTED_TRANSACTION_CONNECTORS.map(qualifyConnectorAmbiguity));
  assert.ok(results.every(result=>result.pass),JSON.stringify(results));
});

test("Super Admin fleet health has a read-only rendered surface",()=>{
  const page=readFileSync("app/admin/fleet-health/page.tsx","utf8");
  const shell=readFileSync("components/admin/admin-shell.tsx","utf8");
  assert.match(page,/withCurrentPlatformAdminDatabaseContext/);
  assert.match(page,/This screen does not repair or activate bots/);
  assert.match(shell,/\/admin\/fleet-health/);
});

test("constitutional exceptions are independent, expiring, evidenced and cannot waive core controls",()=>{
  const base={kind:"EXCEPTION" as const,owner:"owner",approver:"reviewer",affectedControls:["STYLE"],rationale:"Temporary compatibility",compatibilityImpact:"No authority change",expiresAt:"2026-10-02T00:00:00Z",remediationAt:"2026-10-01T00:00:00Z",evidence:["test-1"]};
  assert.match(approveGovernanceRecord(base,new Date("2026-09-30T00:00:00Z")).digest,/^[a-f0-9]{64}$/);
  assert.throws(()=>approveGovernanceRecord({...base,affectedControls:["TENANT_ISOLATION"]},new Date("2026-09-30T00:00:00Z")),/NON_WAIVABLE/);
});

test("hybrid retrieval is release and tenant scoped while semantic evidence rescues synonyms",()=>{
  const result=hybridRetrieve({propertyId:"p1",releaseId:"r1",queryEmbedding:[1,0],limit:2,candidates:[{id:"semantic",propertyId:"p1",releaseId:"r1",lexicalScore:0.01,embedding:[1,0]},{id:"lexical",propertyId:"p1",releaseId:"r1",lexicalScore:1,embedding:[0,1]},{id:"foreign",propertyId:"p2",releaseId:"r1",lexicalScore:99,embedding:[1,0]}]});
  assert.deepEqual(new Set(result.map(x=>x.id)),new Set(["semantic","lexical"])); assert.ok(result.every(x=>x.propertyId==="p1"));
});

test("repair commands require expected version and converge by idempotency key",()=>{
  const seen=new Map(); let runs=0; const command={idempotencyKey:"k",propertyId:"p",command:"RECRAWL" as const,expectedVersion:3,reason:"coverage low",payload:{source:"s"}};
  assert.equal(executeRepairCommand({command,actualVersion:3,seen,run:()=>++runs}),1); assert.equal(executeRepairCommand({command,actualVersion:3,seen,run:()=>++runs}),1); assert.equal(runs,1);
  assert.throws(()=>executeRepairCommand({command:{...command,idempotencyKey:"k2"},actualVersion:4,seen,run:()=>0}),/VERSION_STALE/);
});

test("material actions require a different approver and exact approved payload",()=>{
  const payload={release:"r1"},hash=createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const pending={id:"a",action:"ACTIVATE_RELEASE",target:"p",payloadHash:hash,requestedBy:"one",expiresAt:"2026-10-01T00:00:00Z",state:"PENDING" as const};
  assert.throws(()=>approveMaterialAction(pending,"one",new Date("2026-09-30T00:00:00Z")),/TWO_PERSON/);
  const approved=approveMaterialAction(pending,"two",new Date("2026-09-30T00:00:00Z")); assert.equal(consumeMaterialApproval(approved,payload,new Date("2026-09-30T00:00:00Z")).state,"EXECUTED");
});

test("break glass is incident-bound, scoped, short-lived and independently reviewed",()=>{
  const grant=issueBreakGlass({incidentId:"INC-ABCD-1",actor:"one",scopes:["CLOSE_FACTUAL_EDGE"],reason:"active incident",expiresAt:"2026-09-30T00:30:00Z"},new Date("2026-09-30T00:00:00Z"));
  assert.equal(authorizeBreakGlass(grant,"CLOSE_FACTUAL_EDGE","one",new Date("2026-09-30T00:10:00Z")),true); assert.equal(reviewBreakGlass(grant,"two").reviewedBy,"two");
  assert.throws(()=>authorizeBreakGlass(grant,"OPEN_FACTUAL_EDGE","one",new Date("2026-09-30T00:10:00Z")),/DENIED/);
});

test("governance controls are database-backed and hybrid ranking is on the active crawl path",()=>{
  const migration=readFileSync("prisma/migrations/20260930010000_governed_control_plane/migration.sql","utf8");
  const active=readFileSync("lib/active-website-crawl-retrieval.ts","utf8");
  for(const routine of ["record_governance_control","request_material_approval","approve_material_action","consume_material_approval","queue_repair_command","issue_break_glass","review_break_glass"])assert.match(migration,new RegExp(routine));
  assert.match(migration,/FORCE ROW LEVEL SECURITY/); assert.match(migration,/REVOKE ALL/); assert.match(active,/hybridRetrieve/); assert.match(active,/generation_id/);
});
