import assert from 'node:assert/strict';
import {Pool} from 'pg';
import ExcelJS from 'exceljs';
import {writeFile,mkdir} from 'node:fs/promises';
import {registerTrialOrganization} from '../lib/repositories/trial-registration-repository';
import {activateInvitation} from '../lib/repositories/team-repository';
import {authorizeTrialWebsiteSource} from '../lib/repositories/website-source-consent-repository';
import {withDatabaseIdentity,getBootstrapDb,getDb} from '../lib/db';
import {withTenantPropertyDatabaseContext} from '../lib/security/tenant-database-context';
import {initializeCanonicalRoleClients,withCanonicalRole,disconnectCanonicalRoleClients} from '../lib/canonical-db-context';
import {captureBusinessWebsite} from '../lib/services/business-website-review';
import {readCrawlReviewRows,buildCrawlReviewWorkbook} from '../lib/services/crawl-review-workbook';
import {applyCategorizedKnowledgeWorkbook,parseCategorizedKnowledgeWorkbook} from '../lib/services/categorized-workbook-service';
import {reviewKnowledgeDocument} from '../lib/repositories/knowledge-content-repository';
import {fieldApproveClaim,generateClaimPreview,reviewClaimPreview,editAndApproveKnowledgeClaim} from '../lib/repositories/knowledge-verification-repository';
import {activateReviewedRagKnowledge} from '../lib/rag-owner-publication';
const ownerUrl=process.env.BUSINESS_TEST_OWNER_URL!;
assert.ok(ownerUrl,'BUSINESS_TEST_OWNER_URL must target the disposable synthetic database.');
const artifactDir=process.env.BUSINESS_TEST_ARTIFACT_DIR||'/private/tmp/aifrogi-business-review';
assert.equal(new URL(ownerUrl).hostname,'127.0.0.1');assert.match(new URL(ownerUrl).pathname,/^\/p2b_rehearsal_business$/);
const pool=new Pool({connectionString:ownerUrl});
const results:Array<{name:string;passed:boolean;ms:number}>=[];
async function check(name:string,work:()=>Promise<void>){const start=Date.now();await work();results.push({name,passed:true,ms:Date.now()-start});console.log('PASS',name);}
const scope={organizationId:'',propertyId:'',actor:'asha@synthetic-business.invalid'};let slug='';let draft:Uint8Array;let reviewed:File;let docId='';let ids:string[]=[];
async function owner<T>(work:()=>Promise<T>){return withTenantPropertyDatabaseContext(scope,work);}
async function search(query:string,identity=scope){return withCanonicalRole('aifrogi_public',{...identity,principal:`public-bot:${slug}`,purpose:'PUBLIC_ANSWER'},tx=>tx.$queryRaw<Array<{content:string;entry_id:string}>>`SELECT * FROM aifrogi_security.rag_search_claims(${scope.propertyId},${query},NULL,24)`);}
async function main(){
 await mkdir(artifactDir,{recursive:true});
 // Disposable fixture grants mirror the application's baseline permissions;
 // all public/worker/publisher role restrictions and forced RLS remain active.
 await pool.query('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO leados_app');
 initializeCanonicalRoleClients();
 await check('new BUSINESS_AI account verifies ownership and records restricted website consent',async()=>{
  await withDatabaseIdentity({organizationId:'',platformAuthority:true,actor:'synthetic-registration',systemPurpose:'test'},async()=>{
   const registration=await registerTrialOrganization({companyName:'Synthetic Business',ownerName:'Asha Owner',ownerEmail:scope.actor,website:'https://synthetic-business.invalid',industry:'Software',country:'India',timezone:'Asia/Kolkata',botCategory:'BUSINESS_AI'});
   scope.organizationId=registration.organizationId;scope.propertyId=registration.propertyId;
   const member=await activateInvitation(registration.token,'Synthetic-business-test-2026!');slug=member.installation!.propertySlug;
  });
  await owner(()=>authorizeTrialWebsiteSource({...scope,sourceUrl:'https://synthetic-business.invalid',ownerEmail:scope.actor,authorizedAt:new Date(),trialExpiresAt:new Date(Date.now()+15*86400000)}));
  const consent=await pool.query('SELECT "audienceCeiling" FROM "WebsiteSourceConsent" WHERE "propertyId"=$1',[scope.propertyId]);assert.equal(consent.rows[0].audienceCeiling,'RESTRICTED');
 });
 await check('real crawler extracts synthetic HTML, respects robots and stores a versioned private database capture',async()=>{
  const capture=await captureBusinessWebsite({...scope,propertySlug:slug});assert.equal(capture.pagesSynced,3);assert.equal(capture.reviewRequired,true);
  assert.ok(!(globalThis as unknown as {__syntheticCrawlRequests:string[]}).__syntheticCrawlRequests.includes('/private'));
  const rows=await owner(()=>readCrawlReviewRows(scope.propertyId,scope.organizationId));assert.equal(rows.length,3);assert.ok(rows.some(r=>r.content.includes('iOS and Android')));
  assert.equal((await pool.query('SELECT status FROM "BotProfile" WHERE "organizationId"=$1',[scope.organizationId])).rows[0].status,'DRAFT');
 });
 await check('failed refresh leaves the last complete private capture intact and releases the job fence',async()=>{
  const before=await owner(()=>readCrawlReviewRows(scope.propertyId,scope.organizationId));
  (globalThis as unknown as {__syntheticCrawlFault:boolean}).__syntheticCrawlFault=true;
  try{await assert.rejects(()=>captureBusinessWebsite({...scope,propertySlug:slug}),/robots policy could not/);}finally{(globalThis as unknown as {__syntheticCrawlFault:boolean}).__syntheticCrawlFault=false;}
  assert.deepEqual(await owner(()=>readCrawlReviewRows(scope.propertyId,scope.organizationId)),before);
  const dead=await pool.query(`SELECT count(*) n FROM "AutomationJob" WHERE "propertyId"=$1 AND "actionType"='CAPTURE_AUTHORIZED_WEBSITE' AND status='DEAD' AND "lockedBy" IS NULL`,[scope.propertyId]);assert.equal(Number(dead.rows[0].n),1);
 });
 await check('Excel export preserves tenant/version/source identity and every row starts private pending',async()=>{
  draft=await owner(async()=>buildCrawlReviewWorkbook(await readCrawlReviewRows(scope.propertyId,scope.organizationId)));
  await writeFile(`${artifactDir}/Synthetic-Business-Website-Review.xlsx`,draft);
  const p=await parseCategorizedKnowledgeWorkbook({bytes:draft,expectedTenantId:scope.propertyId,allowedSourceOrigin:'https://synthetic-business.invalid'});assert.equal(p.approvedRows,0);assert.equal(p.pendingRows,3);
 });
 await check('no approved rows, formulas and other-tenant workbooks cannot stage knowledge',async()=>{
  await assert.rejects(owner(()=>applyCategorizedKnowledgeWorkbook({...scope,actorEmail:scope.actor,allowedSourceOrigin:'https://synthetic-business.invalid',file:new File([draft as BlobPart],'review.xlsx')})),/No Approved/);
  const book=new ExcelJS.Workbook();await book.xlsx.load(draft as unknown as ExcelJS.Buffer);const sheet=book.getWorksheet('Categorized Content')!;sheet.getCell('G2').value='Approved';sheet.getCell('H2').value='Public';sheet.getCell('D2').value={formula:'1+1',result:2};
  await assert.rejects(()=>book.xlsx.writeBuffer().then(bytes=>parseCategorizedKnowledgeWorkbook({bytes:new Uint8Array(bytes),expectedTenantId:scope.propertyId,allowedSourceOrigin:'https://synthetic-business.invalid'})),/Formulas/);
 });
 await check('reviewed public corrections stage atomically and duplicate file imports reuse document/claims',async()=>{
  const book=new ExcelJS.Workbook();await book.xlsx.load(draft as unknown as ExcelJS.Buffer);const sheet=book.getWorksheet('Categorized Content')!;
  for(let n=2;n<=sheet.rowCount;n++){sheet.getCell(`G${n}`).value='Approved';sheet.getCell(`H${n}`).value='Public';sheet.getCell(`F${n}`).value='';
   if(String(sheet.getCell(`E${n}`).value).endsWith('/services'))sheet.getCell(`K${n}`).value='We develop custom applications for service businesses. Our applications support iOS and Android. Project prices depend on the agreed scope and are provided on request.';
  }
  reviewed=new File([new Uint8Array(await book.xlsx.writeBuffer())],'reviewed-business.xlsx');await writeFile(`${artifactDir}/Synthetic-Business-Reviewed.xlsx`,new Uint8Array(await reviewed.arrayBuffer()));
  const [first,repeated]=await Promise.all([1,2].map(()=>owner(()=>applyCategorizedKnowledgeWorkbook({...scope,actorEmail:scope.actor,allowedSourceOrigin:'https://synthetic-business.invalid',file:reviewed}))));assert.equal(first.documentId,repeated.documentId);assert.equal(first.stagedCount,3);docId=first.documentId;
  ids=(await pool.query('SELECT id FROM "KnowledgeEntry" WHERE "documentId"=$1 ORDER BY id',[docId])).rows.map(r=>r.id);
  await pool.query(`INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES(gen_random_uuid()::text,$1,$2,'aifrogi_public','PUBLIC_ANSWER')`,[scope.propertyId,`public-bot:${slug}`]);
  assert.equal((await search('applications')).length,0);
 });
 await check('document approval alone cannot make unreviewed rows public',async()=>{
  await owner(()=>reviewKnowledgeDocument({propertyId:scope.propertyId,id:docId,action:'APPROVE',actorEmail:scope.actor,confirmConflict:true}));
  await activateReviewedRagKnowledge(scope);assert.equal((await search('applications')).length,0);
 });
 await check('field and preview approvals publish exact reviewed answers with a durable index job',async()=>{
  for(const id of ids)await owner(async()=>{await fieldApproveClaim({propertyId:scope.propertyId,entryId:id,actorEmail:scope.actor});const preview=await generateClaimPreview({propertyId:scope.propertyId,entryId:id});await reviewClaimPreview({propertyId:scope.propertyId,previewId:preview.id,actorEmail:scope.actor,approve:true});});
  const release=await activateReviewedRagKnowledge(scope);assert.ok(release.publicationId);assert.equal(release.claimCount,3);
  const rows=await search('applications');assert.ok(rows.some(r=>r.content.includes('iOS and Android')));assert.ok(rows.some(r=>r.content.includes('provided on request')));
  assert.ok(Number((await pool.query(`SELECT count(*) n FROM "AutomationJob" WHERE "propertyId"=$1 AND "actionType"='RAG_CLAIM_INDEX'`,[scope.propertyId])).rows[0].n)>0);
 });
 await check('owner correction creates an immutable replacement; old facts no longer retrieve',async()=>{
  const old=(await search('iOS')).find(r=>r.content.includes('iOS and Android'))!;assert.ok(old);
  const changed=await owner(()=>editAndApproveKnowledgeClaim({propertyId:scope.propertyId,entryId:old.entry_id,question:'Which platforms do your applications support?',answer:'Our applications support iOS, Android and web browsers.',category:'Services',actorEmail:scope.actor}));
  await activateReviewedRagKnowledge(scope);const current=await search('applications');assert.ok(current.some(r=>r.content==='Our applications support iOS, Android and web browsers.'));assert.ok(!current.some(r=>r.entry_id===old.entry_id));
  assert.equal((await pool.query('SELECT answer FROM "KnowledgeEntry" WHERE id=$1',[old.entry_id])).rows[0].answer,old.content);
  assert.equal(changed.createdVersion,true);
 });
 await check('other owner and tenant cannot export, import or publish this business',async()=>{
  await assert.rejects(()=>withTenantPropertyDatabaseContext({...scope,actor:'outsider@example.invalid'},()=>readCrawlReviewRows(scope.propertyId,scope.organizationId)),/OWNER_AUTHORITY_REQUIRED/);
  await assert.rejects(()=>withTenantPropertyDatabaseContext({...scope,organizationId:'other-org'},()=>readCrawlReviewRows(scope.propertyId,'other-org')),/does not belong/);
  await assert.rejects(()=>activateReviewedRagKnowledge({...scope,actor:'outsider@example.invalid'}),/OWNER_AUTHORITY_REQUIRED/);
 });
 await check('edited source text is rejected and no partial import persists',async()=>{
  const book=new ExcelJS.Workbook();await book.xlsx.load(new Uint8Array(await reviewed.arrayBuffer()) as unknown as ExcelJS.Buffer);book.getWorksheet('Categorized Content')!.getCell('D2').value='Forged website statement.';
  const before=(await pool.query('SELECT count(*) n FROM "KnowledgeDocument" WHERE "propertyId"=$1',[scope.propertyId])).rows[0].n;
  await assert.rejects(owner(async()=>applyCategorizedKnowledgeWorkbook({...scope,actorEmail:scope.actor,allowedSourceOrigin:'https://synthetic-business.invalid',file:new File([new Uint8Array(await book.xlsx.writeBuffer())],'tampered.xlsx')})),/source text unchanged/);
  assert.equal((await pool.query('SELECT count(*) n FROM "KnowledgeDocument" WHERE "propertyId"=$1',[scope.propertyId])).rows[0].n,before);
 });
 await check('stale workbook generation is rejected without partial staging',async()=>{
  const book=new ExcelJS.Workbook();await book.xlsx.load(new Uint8Array(await reviewed.arrayBuffer()) as unknown as ExcelJS.Buffer);book.getWorksheet('Categorized Content')!.getCell('J2').value='obsolete-capture';
  const before=(await pool.query('SELECT count(*) n FROM "KnowledgeDocument" WHERE "propertyId"=$1',[scope.propertyId])).rows[0].n;
  await assert.rejects(owner(async()=>applyCategorizedKnowledgeWorkbook({...scope,actorEmail:scope.actor,allowedSourceOrigin:'https://synthetic-business.invalid',file:new File([new Uint8Array(await book.xlsx.writeBuffer())],'stale.xlsx')})),/version or source row changed/);
  assert.equal((await pool.query('SELECT count(*) n FROM "KnowledgeDocument" WHERE "propertyId"=$1',[scope.propertyId])).rows[0].n,before);
 });
 await check('expired website consent blocks refresh/export while the independent approved publication remains available',async()=>{
  const before=await search('applications');
  await owner(async()=>{await getDb()!.$executeRaw`UPDATE "WebsiteSourceConsent" SET "effectiveUntil"=clock_timestamp()+interval '1 second' WHERE "propertyId"=${scope.propertyId} AND "sourceType"='WEBSITE'`;});
  await new Promise(resolve=>setTimeout(resolve,1200));
  await assert.rejects(()=>captureBusinessWebsite({...scope,propertySlug:slug}),/CURRENT_WEBSITE_CAPTURE_AUTHORIZATION_REQUIRED/);
  assert.deepEqual(await search('applications'),before);
  await assert.rejects(owner(()=>readCrawlReviewRows(scope.propertyId,scope.organizationId)),/No current authorised/);
 });
 console.log('BUSINESS_CRAWL_EXCEL_JOURNEY_PASS');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
 await writeFile(`${artifactDir}/business-journey-results.json`,JSON.stringify({mode:'real PostgreSQL and application workflow; synthetic website transport; no provider requests',scope,slug,results},null,2));
 await pool.end();await getBootstrapDb()?.$disconnect();await disconnectCanonicalRoleClients();
});
