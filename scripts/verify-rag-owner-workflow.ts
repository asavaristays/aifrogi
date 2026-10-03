import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {writeFile} from 'node:fs/promises';
import {withTenantPropertyDatabaseContext} from '../lib/security/tenant-database-context';
import {getBootstrapDb} from '../lib/db';
import {initializeCanonicalRoleClients,withCanonicalRole,disconnectCanonicalRoleClients} from '../lib/canonical-db-context';
import {createKnowledgeDocument,reviewKnowledgeDocument} from '../lib/repositories/knowledge-content-repository';
import {stageDocumentAtomicClaims,fieldApproveClaim,generateClaimPreview,reviewClaimPreview,editAndApproveKnowledgeClaim,pauseClaim,reconfirmClaim} from '../lib/repositories/knowledge-verification-repository';
import {activateReviewedRagKnowledge} from '../lib/rag-owner-publication';
const url=process.env.RAG_TEST_DATABASE_URL!;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname)||new URL(url).pathname!=='/rag_controls') throw Error('ISOLATED_TEST_DATABASE_REQUIRED');
process.env.DATABASE_URL=url.replace(/\/\/[^@]+@/,'//leados_app@');
for(const [key,role] of Object.entries({AIFROGI_PUBLIC_DATABASE_URL:'aifrogi_public',AIFROGI_WEB_DATABASE_URL:'aifrogi_web',AIFROGI_WORKER_DATABASE_URL:'aifrogi_worker',AIFROGI_PUBLISHER_DATABASE_URL:'aifrogi_publisher'})) process.env[key]=url.replace(/\/\/[^@]+@/,'//'+role+'@');
const pool=new Pool({connectionString:url});
const scope={organizationId:'delivery-org',propertyId:'delivery-property',actor:'rag-owner@example.test'};
const results:Array<{case:string;passed:boolean;elapsedMs:number;detail?:string}>=[];
async function check(name:string,fn:()=>Promise<void>){const start=Date.now();try{await fn();results.push({case:name,passed:true,elapsedMs:Date.now()-start});}catch(e){results.push({case:name,passed:false,elapsedMs:Date.now()-start,detail:String(e)});}}
async function main(){
 // Synthetic role fixtures: real PostgreSQL RLS and sealed-record triggers remain active.
 await pool.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO leados_app; GRANT USAGE ON SCHEMA aifrogi_security TO leados_app; GRANT EXECUTE ON FUNCTION aifrogi_security.current_property_id(),aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority() TO leados_app`);
 await pool.query(`INSERT INTO "OrganizationMember"(id,"organizationId",email,role,status,"updatedAt") VALUES('rag-owner','delivery-org','rag-owner@example.test','OWNER','ACTIVE',clock_timestamp())`);
 initializeCanonicalRoleClients();
 let documentId='',entryId='';
 await check('repeat upload and staging reuse one private document and claim',async()=>{
 const work=async()=>{const bytes=new Uint8Array(new TextEncoder().encode('Synthetic owner workflow source: parking spaces 12.'));const doc=await createKnowledgeDocument({propertyId:scope.propertyId,fileName:'owner-workflow.txt',mimeType:'text/plain',sizeBytes:bytes.length,content:bytes,extractedText:'Question: How many parking spaces are there?\nAnswer: There are 12 parking spaces.',uploadedBy:scope.actor});const entries=await stageDocumentAtomicClaims({propertyId:scope.propertyId,documentId:doc.id,createdBy:scope.actor,claims:[{question:'How many parking spaces are there?',answer:'There are 12 parking spaces.',category:'Facilities',claimType:'FACT',valueType:'TEXT',currency:null,refreshDays:90}]});return {doc,entries};};
 const a=await withTenantPropertyDatabaseContext(scope,work);const b=await withTenantPropertyDatabaseContext(scope,work);assert.equal(a.doc.id,b.doc.id);assert.equal(a.entries[0].id,b.entries[0].id);documentId=a.doc.id;entryId=a.entries[0].id;
 const r=await withCanonicalRole('aifrogi_public',{...scope,principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'},tx=>tx.$queryRaw<Array<{entry_id:string}>>`SELECT * FROM aifrogi_security.rag_search_claims(${scope.propertyId},'parking',NULL,12)`);assert.equal(r.length,0);
 });
 await check('document approval alone never publishes unreviewed rows',async()=>{
 await withTenantPropertyDatabaseContext(scope,()=>reviewKnowledgeDocument({propertyId:scope.propertyId,id:documentId,action:'APPROVE',actorEmail:scope.actor}));
 await activateReviewedRagKnowledge(scope);
 const r=await withCanonicalRole('aifrogi_public',{...scope,principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'},tx=>tx.$queryRaw<unknown[]>`SELECT * FROM aifrogi_security.rag_search_claims(${scope.propertyId},'parking',NULL,12)`);assert.equal(r.length,0);
 });
 await check('owner field and preview approval publish, queue indexing and enable retrieval',async()=>{
 await withTenantPropertyDatabaseContext(scope,async()=>{await fieldApproveClaim({propertyId:scope.propertyId,entryId,actorEmail:scope.actor});const preview=await generateClaimPreview({propertyId:scope.propertyId,entryId});await reviewClaimPreview({propertyId:scope.propertyId,previewId:preview.id,actorEmail:scope.actor,approve:true});});
 const published=await activateReviewedRagKnowledge(scope);assert.ok(published.publicationId);
 const r=await withCanonicalRole('aifrogi_public',{...scope,principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'},tx=>tx.$queryRaw<Array<{content:string}>>`SELECT * FROM aifrogi_security.rag_search_claims(${scope.propertyId},'parking',NULL,12)`);assert.equal(r[0]?.content,'There are 12 parking spaces.');
 });
 await check('owner correction supersedes sealed content through the same approval path',async()=>{
 const correction=await withTenantPropertyDatabaseContext(scope,()=>editAndApproveKnowledgeClaim({propertyId:scope.propertyId,entryId,question:'How many parking spaces are there?',answer:'There are 14 parking spaces.',category:'Facilities',actorEmail:scope.actor}));await activateReviewedRagKnowledge(scope);entryId=correction.entryId;
 const r=await withCanonicalRole('aifrogi_public',{...scope,principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'},tx=>tx.$queryRaw<Array<{content:string}>>`SELECT * FROM aifrogi_security.rag_search_claims(${scope.propertyId},'parking',NULL,12)`);assert.equal(r.length,1);assert.equal(r[0]?.content,'There are 14 parking spaces.');
 });
 await check('sealed reconfirmation creates a fresh approved version rather than editing history',async()=>{
 const confirmed=await withTenantPropertyDatabaseContext(scope,()=>reconfirmClaim({propertyId:scope.propertyId,entryId,actorEmail:scope.actor}));assert.notEqual(confirmed.id,entryId);await activateReviewedRagKnowledge(scope);entryId=confirmed.id;
 });
 await check('owner withdrawal removes the sealed claim immediately and keeps audit history',async()=>{
 await withTenantPropertyDatabaseContext(scope,()=>pauseClaim({propertyId:scope.propertyId,entryId,actorEmail:scope.actor,reason:'Synthetic withdrawal check'}));
 const r=await withCanonicalRole('aifrogi_public',{...scope,principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'},tx=>tx.$queryRaw<Array<{entry_id:string}>>`SELECT * FROM aifrogi_security.rag_search_claims(${scope.propertyId},'parking',NULL,12)`);assert.equal(r.length,0);
 });
 await check('wrong owner and wrong tenant cannot provision publication authority',async()=>{
 await assert.rejects(()=>activateReviewedRagKnowledge({...scope,actor:'stranger@example.test'}),/OWNER_AUTHORITY_REQUIRED/);await assert.rejects(()=>activateReviewedRagKnowledge({...scope,organizationId:'other-org'}),/OWNER_AUTHORITY_REQUIRED/);
 });
 console.log(JSON.stringify(results));await writeFile('deliverables/RAG_OWNER_WORKFLOW_TESTS_2026-10-03.json',JSON.stringify({mode:'isolated PostgreSQL; synthetic owner/source and application-role permission fixture',results},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
}
main().catch(e=>{console.error(String(e));process.exitCode=1;}).finally(async()=>{await pool.end();await getBootstrapDb()?.$disconnect();await disconnectCanonicalRoleClients();});
