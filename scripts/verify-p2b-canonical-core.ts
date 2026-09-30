import assert from "node:assert/strict";
import {Pool,PoolClient} from "pg";

const databaseUrl=process.env.DATABASE_URL!;
const publisherUrl=process.env.AIFROGI_PUBLISHER_DATABASE_URL!;
const workerUrl=process.env.AIFROGI_WORKER_DATABASE_URL!;
if(!databaseUrl||!publisherUrl||!workerUrl) throw new Error("DATABASE_URL, AIFROGI_PUBLISHER_DATABASE_URL, and AIFROGI_WORKER_DATABASE_URL are required");
const owner=new Pool({connectionString:databaseUrl});
const publisher=new Pool({connectionString:publisherUrl});
const worker=new Pool({connectionString:workerUrl});

async function contextual<T>(pool:Pool,principal:string,purpose:string,work:(client:PoolClient)=>Promise<T>){
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  await client.query("SELECT set_config('app.organization_id','delivery-org',true),set_config('app.property_id','delivery-property',true),set_config('app.security_actor',$1,true),set_config('app.system_purpose',$2,true)",[principal,purpose]);
  const value=await work(client);
  await client.query("COMMIT");
  return value;
 }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}
async function expectReject(label:string,work:()=>Promise<unknown>,pattern:RegExp){
 try{await work();assert.fail(`${label} unexpectedly succeeded`);}catch(error){assert.match(String(error),pattern);console.log(`PASS ${label}`);}
}

async function main(){
 await expectReject("forged consent identity mutation is denied",()=>owner.query(`UPDATE "WebsiteSourceConsent" SET "canonicalIdentityHash"='forged' WHERE id='core-job-consent'`),/CONSENT_SOURCE_IDENTITY_MISMATCH/);
 await expectReject("incomplete claim sealing is denied",()=>contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query("SELECT aifrogi_security.seal_claim_revision('delivery-property','core-incomplete','publisher:test','v1')")),/FULL_STATEMENT_EVIDENCE_INSUFFICIENT/);
 const seal=(await contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query<{seal:string}>("SELECT aifrogi_security.seal_claim_revision('delivery-property','core-entry','publisher:test','v1') seal"))).rows[0].seal;
 assert.equal(typeof seal,"string");
 const sealed=await owner.query('SELECT "revisionState","sealManifestHash",answer,"requiredComponents" FROM "KnowledgeEntry" WHERE id=$1',["core-entry"]);
 assert.equal(sealed.rows[0].revisionState,"SEALED"); assert.equal(sealed.rows[0].sealManifestHash,seal); assert.equal(sealed.rows[0].answer,"Checkout is at 11 AM.");
 console.log("PASS complete claim and qualifications seal into the manifest");
 await expectReject("sealed evidence mutation is denied",()=>owner.query('UPDATE "KnowledgeClaimEvidence" SET quotation=$1 WHERE id=$2',["changed","core-evidence"]),/SEALED_EVIDENCE(_SET)?_IMMUTABLE/);

 await owner.query(`INSERT INTO "KnowledgeApprovalEvidence"(id,"propertyId",purpose,decision,"scopeManifest","scopeHash",audience,"policyVersion","actorId","actorEmailHash",authority) VALUES ('core-approval','delivery-property','PUBLICATION_AUTHORIZATION','APPROVED','{}','wrong','PUBLIC','v1','publisher:test','email','OWNER')`);
 await owner.query(`INSERT INTO "KnowledgePublication"(id,"propertyId",audience,"manifestHash","policyVersion","evidencePolicyVersion","approvalId") VALUES ('core-publication','delivery-property','PUBLIC','candidate-core','v1','v1','core-approval')`);
 await owner.query(`INSERT INTO "KnowledgePublicationClaim"(id,"propertyId","publicationId","claimIdentityId","entryId","sealManifestHash") VALUES ('core-publication-claim','delivery-property','core-publication','delivery-identity','core-entry',$1)`,[seal]);
 await expectReject("publication with inexact authorization is denied",()=>contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query("SELECT aifrogi_security.seal_publication('delivery-property','core-publication','publisher:test',1)")),/EXACT_PUBLICATION_AUTHORIZATION_MISSING/);
 const exact=await owner.query<{hash:string}>(`SELECT aifrogi_security.hash_json(jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId','delivery-property','audience','PUBLIC','policyVersion','v1','evidencePolicyVersion','v1','approvalId','core-approval-exact','claims',jsonb_build_array(jsonb_build_object('claimIdentityId','delivery-identity','entryId','core-entry','sealManifestHash',$1::text)))) hash`,[seal]);
 await owner.query(`INSERT INTO "KnowledgeApprovalEvidence"(id,"propertyId",purpose,decision,"scopeManifest","scopeHash",audience,"policyVersion","actorId","actorEmailHash",authority) VALUES ('core-approval-exact','delivery-property','PUBLICATION_AUTHORIZATION','APPROVED','{}',$1,'PUBLIC','v1','publisher:test','email-exact','OWNER')`,[exact.rows[0].hash]);
 await owner.query(`INSERT INTO "KnowledgePublication"(id,"propertyId",audience,"manifestHash","policyVersion","evidencePolicyVersion","approvalId") VALUES ('core-publication-exact','delivery-property','PUBLIC','candidate-core-exact','v1','v1','core-approval-exact')`);
 await owner.query(`INSERT INTO "KnowledgePublicationClaim"(id,"propertyId","publicationId","claimIdentityId","entryId","sealManifestHash") VALUES ('core-publication-claim-exact','delivery-property','core-publication-exact','delivery-identity','core-entry',$1)`,[seal]);
 const publicationSeal=(await contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query<{seal:string}>("SELECT aifrogi_security.seal_publication('delivery-property','core-publication-exact','publisher:test',1) seal"))).rows[0].seal;
 assert.equal(publicationSeal,exact.rows[0].hash); console.log("PASS exact publication authorization seals");
 await expectReject("sealed publication membership mutation is denied",()=>owner.query(`INSERT INTO "KnowledgePublicationClaim"(id,"propertyId","publicationId","claimIdentityId","entryId","sealManifestHash") VALUES ('late','delivery-property','core-publication-exact','delivery-identity','core-entry',$1)`,[seal]),/PUBLICATION_MEMBERSHIP_CLOSED|duplicate key/);

 const generation=(await contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query<{g:string}>("SELECT aifrogi_security.advance_serving_pointer('delivery-property','PUBLIC','core-publication-exact',1,'publisher:test') g"))).rows[0].g;
 assert.equal(String(generation),"2");
 await expectReject("stale pointer CAS is denied",()=>contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query("SELECT aifrogi_security.advance_serving_pointer('delivery-property','PUBLIC','core-publication-exact',1,'publisher:test')")),/POINTER_GENERATION_CONFLICT/);
 console.log("PASS pointer compare-and-set advancement");

 const claimed=await contextual(worker,"worker:test","KNOWLEDGE_CAPTURE",c=>c.query<{job_id:string,fence:string}>("SELECT * FROM aifrogi_security.claim_job('delivery-property','worker:test',60)"));
 assert.equal(claimed.rows[0].job_id,"core-job"); const fence=claimed.rows[0].fence;
 await expectReject("wrong worker fence renewal is denied",()=>contextual(worker,"worker:test","KNOWLEDGE_CAPTURE",c=>c.query("SELECT aifrogi_security.renew_job('delivery-property','core-job','worker:test',$1,60)",[Number(fence)+1])),/STALE|FENCE|lease/i);
 await contextual(worker,"worker:test","KNOWLEDGE_CAPTURE",c=>c.query("SELECT aifrogi_security.renew_job('delivery-property','core-job','worker:test',$1,60)",[fence]));
 await owner.query(`UPDATE "AutomationJob" SET "leaseExpiresAt"=clock_timestamp()-interval '1 second' WHERE id='core-job'`);
 const reclaimed=(await contextual(worker,"worker:test","KNOWLEDGE_CAPTURE",c=>c.query<{fence:string}>("SELECT aifrogi_security.reclaim_job('delivery-property','core-job','worker:test',60) fence"))).rows[0].fence;
 assert.ok(BigInt(reclaimed)>BigInt(fence)); console.log("PASS job claim, renewal fencing and expired-lease reclaim");
 await owner.query(`INSERT INTO "KnowledgeObject"(id,"propertyId","storageNamespace","objectKey",checksum,"byteSize","mediaType",state,"stagingTokenHash") VALUES ('core-finalize-object','delivery-property','test','core-finalize-object','core-object-hash',12,'text/plain','STAGED','core-stage-hash')`);
 await owner.query(`INSERT INTO "KnowledgeObjectReference"(id,"propertyId","objectId","sourceId",purpose) VALUES ('core-finalize-ref','delivery-property','core-finalize-object','core-job-source','CAPTURE')`);
 await contextual(worker,"worker:test","KNOWLEDGE_CAPTURE",c=>c.query("SELECT aifrogi_security.finalize_capture('delivery-property','core-job','worker:test',$1,1,'core-finalize-object','core-stage-hash','core-job-capture','core-capture-version','{}'::jsonb,'CAPTURE_FINALIZED')",[reclaimed]));
 const finalized=await owner.query(`SELECT o.state,j.status,c.status,(SELECT count(*)::int FROM "CaptureVersion" WHERE id='core-capture-version') versions FROM "KnowledgeObject" o JOIN "AutomationJob" j ON j.id='core-job' JOIN "SourceCapture" c ON c.id='core-job-capture' WHERE o.id='core-finalize-object'`);
 assert.deepEqual([finalized.rows[0].state,finalized.rows[0].status,finalized.rows[0].versions],["USABLE","SUCCEEDED",1]);
 console.log("PASS fenced capture finalization atomically publishes object, capture version, job and outbox");
 await owner.query(`INSERT INTO "KnowledgeClaimIdentity"(id,"propertyId","stableKey","entityKey","fieldKey",qualifiers,"keyVersion") VALUES ('independent-identity','delivery-property','hotel.phone','hotel','phone','{}',1)`);
 await owner.query(`INSERT INTO "KnowledgeEntry"(id,"propertyId",question,answer,"createdBy","updatedAt","claimIdentityId","revisionNumber","normalizedValue","valueHash","quoteText",audience,"verificationStatus","revisionState","requiredComponents") VALUES ('independent-entry','delivery-property','Phone?','Call 123.','owner',clock_timestamp(),'independent-identity',1,'{"phone":"123"}','independent-value','Call 123.','PUBLIC','SUPPORTED','DRAFT',ARRAY['phone'])`);
 await owner.query(`INSERT INTO "KnowledgeClaimEvidence"(id,"propertyId","entryId","captureVersionId",locator,"locatorHash",quotation,"quotationHash","supportedComponents","bindingHash") VALUES ('independent-evidence','delivery-property','independent-entry','core-capture-version','{"row":1}','independent-locator','Call 123.','independent-quote',ARRAY['phone'],'independent-binding')`);
 await owner.query(`INSERT INTO "KnowledgeRevisionEvidenceBinding"(id,"propertyId","entryId","evidenceId","bindingHash") VALUES ('independent-binding-row','delivery-property','independent-entry','independent-evidence','independent-binding')`);
 await contextual(publisher,"publisher:test","KNOWLEDGE_PUBLISH",c=>c.query("SELECT aifrogi_security.seal_claim_revision('delivery-property','independent-entry','publisher:test','v1')"));

 const before=await owner.query<{g:string}>(`SELECT "eligibilityGeneration" g FROM "PropertyIntelligencePolicy" WHERE "propertyId"='delivery-property'`);
 const revoked=(await contextual(publisher,"publisher:test","KNOWLEDGE_REVOKE",c=>c.query<{g:string}>("SELECT aifrogi_security.revoke_source('delivery-property','delivery-source','publisher:test','test revocation','core-revoke-op') g"))).rows[0].g;
 assert.equal(BigInt(revoked),BigInt(before.rows[0].g)+BigInt(1));
 assert.equal((await owner.query(`SELECT count(*)::int n FROM "KnowledgeOutboxEvent" WHERE "operationKey"='core-revoke-op'`)).rows[0].n,1);
 const eligibility=await owner.query<{revoked:boolean,independent:boolean}>(`SELECT aifrogi_security.eligible_claim('delivery-property','delivery-entry','PUBLIC',clock_timestamp(),$1) revoked,aifrogi_security.eligible_claim('delivery-property','independent-entry','PUBLIC',clock_timestamp(),$1) independent`,[revoked]);
 assert.equal(eligibility.rows[0].revoked,false); assert.equal(eligibility.rows[0].independent,true);
 console.log("PASS source revocation invalidates only dependent evidence and leaves unrelated approved claims eligible");

 await Promise.all([owner.end(),publisher.end(),worker.end()]);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
