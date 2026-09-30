import assert from "node:assert/strict";
import {Pool,PoolClient} from "pg";
const url=process.env.DATABASE_URL!;
const publisherUrl=process.env.AIFROGI_PUBLISHER_DATABASE_URL!;
if(!url||!publisherUrl) throw new Error("DATABASE_URL and AIFROGI_PUBLISHER_DATABASE_URL are required");
const owner=new Pool({connectionString:url});
const publisher=new Pool({connectionString:publisherUrl});
async function publish<T>(work:(c:PoolClient)=>Promise<T>){const c=await publisher.connect();try{await c.query("BEGIN");await c.query("SELECT set_config('app.organization_id','delivery-org',true),set_config('app.property_id','delivery-property',true),set_config('app.security_actor','publisher:test',true),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',true)");const v=await work(c);await c.query("COMMIT");return v;}catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}}
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 await owner.query(`INSERT INTO "KnowledgeEntry"(id,"propertyId",question,answer,"createdBy","updatedAt","claimIdentityId","revisionNumber","normalizedValue","valueHash","quoteText",audience,"verificationStatus","revisionState","requiredComponents") VALUES ('race-entry','delivery-property','Race?','Stable.','owner',clock_timestamp(),'independent-identity',2,'{"value":"stable"}','race-value','Stable.','PUBLIC','SUPPORTED','DRAFT',ARRAY['value'])`);
 await owner.query(`INSERT INTO "KnowledgeClaimEvidence"(id,"propertyId","entryId","captureVersionId",locator,"locatorHash",quotation,"quotationHash","supportedComponents","bindingHash") VALUES ('race-evidence','delivery-property','race-entry','core-capture-version','{"row":2}','race-locator','Stable.','race-quote',ARRAY['value'],'race-binding')`);
 await owner.query(`INSERT INTO "KnowledgeRevisionEvidenceBinding"(id,"propertyId","entryId","evidenceId","bindingHash") VALUES ('race-binding-row','delivery-property','race-entry','race-evidence','race-binding')`);
 await owner.query(`CREATE OR REPLACE FUNCTION public.p2b_delay_claim_seal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."revisionState"='SEALED' AND OLD."revisionState"='DRAFT' THEN PERFORM pg_sleep(0.3); END IF; RETURN NEW; END $$; CREATE TRIGGER p2b_delay_claim_seal BEFORE UPDATE ON "KnowledgeEntry" FOR EACH ROW EXECUTE FUNCTION public.p2b_delay_claim_seal()`);
 const sealing=publish(c=>c.query("SELECT aifrogi_security.seal_claim_revision('delivery-property','race-entry','publisher:test','v1')"));
 await delay(50);
 let mutationRejected=false;
 try{await owner.query(`INSERT INTO "KnowledgeClaimEvidence"(id,"propertyId","entryId","captureVersionId",locator,"locatorHash",quotation,"quotationHash","supportedComponents","bindingHash") VALUES ('race-late-evidence','delivery-property','race-entry','core-capture-version','{"row":3}','race-late-locator','Late.','race-late-quote',ARRAY['value'],'race-late-binding')`);}catch(error){mutationRejected=/SEALED_EVIDENCE_IMMUTABLE/.test(String(error));}
 await sealing; assert.equal(mutationRejected,true); console.log("PASS concurrent evidence insertion serializes behind claim sealing and is rejected");

 const seal=(await owner.query<{seal:string}>(`SELECT "sealManifestHash" seal FROM "KnowledgeEntry" WHERE id='race-entry'`)).rows[0].seal;
 const hash=(await owner.query<{hash:string}>(`SELECT aifrogi_security.hash_json(jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId','delivery-property','audience','PUBLIC','policyVersion','v1','evidencePolicyVersion','v1','approvalId','race-approval','claims',jsonb_build_array(jsonb_build_object('claimIdentityId','independent-identity','entryId','race-entry','sealManifestHash',$1::text)))) hash`,[seal])).rows[0].hash;
 await owner.query(`INSERT INTO "KnowledgeApprovalEvidence"(id,"propertyId",purpose,decision,"scopeManifest","scopeHash",audience,"policyVersion","actorId","actorEmailHash",authority) VALUES ('race-approval','delivery-property','PUBLICATION_AUTHORIZATION','APPROVED','{}',$1,'PUBLIC','v1','publisher:test','race-email','OWNER')`,[hash]);
 await owner.query(`INSERT INTO "KnowledgePublication"(id,"propertyId",audience,"manifestHash","policyVersion","evidencePolicyVersion","approvalId") VALUES ('race-publication','delivery-property','PUBLIC','candidate-race','v1','v1','race-approval')`);
 await owner.query(`INSERT INTO "KnowledgePublicationClaim"(id,"propertyId","publicationId","claimIdentityId","entryId","sealManifestHash") VALUES ('race-member','delivery-property','race-publication','independent-identity','race-entry',$1)`,[seal]);
 await owner.query(`CREATE OR REPLACE FUNCTION public.p2b_delay_publication_seal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.state='SEALED' AND OLD.state='CANDIDATE' THEN PERFORM pg_sleep(0.3); END IF; RETURN NEW; END $$; CREATE TRIGGER p2b_delay_publication_seal BEFORE UPDATE ON "KnowledgePublication" FOR EACH ROW EXECUTE FUNCTION public.p2b_delay_publication_seal()`);
 const pubSealing=publish(c=>c.query("SELECT aifrogi_security.seal_publication('delivery-property','race-publication','publisher:test',2)"));
 await delay(50);
 let memberRejected=false;
 try{await owner.query(`DELETE FROM "KnowledgePublicationClaim" WHERE id='race-member'`);}catch(error){memberRejected=/PUBLICATION_MEMBERSHIP_CLOSED/.test(String(error));}
 await pubSealing; assert.equal(memberRejected,true); console.log("PASS concurrent membership mutation serializes behind publication sealing and is rejected");
 await Promise.all([owner.end(),publisher.end()]);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
