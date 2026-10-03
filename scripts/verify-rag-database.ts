import assert from 'node:assert/strict';
import {Pool,PoolClient} from 'pg';
import {writeFile} from 'node:fs/promises';
const url=process.env.RAG_TEST_DATABASE_URL;
if(!url || !['localhost','127.0.0.1'].includes(new URL(url).hostname)||!/^\/rag_(candidate|controls)$/.test(new URL(url).pathname)) throw new Error('ISOLATED_TEST_DATABASE_REQUIRED');
const owner=new Pool({connectionString:url});
const role=(name:string)=>new Pool({connectionString:url.replace(/\/\/[^@]+@/,'//'+name+'@')});
const pub=role('aifrogi_public'),web=role('aifrogi_web'),worker=role('aifrogi_worker'),publisher=role('aifrogi_publisher');
const results:Array<{case:string;passed:boolean;elapsedMs:number;detail?:string}>=[];
async function ctx<T>(pool:Pool,purpose:string,principal:string,fn:(c:PoolClient)=>Promise<T>,org='delivery-org') {
 const c=await pool.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.organization_id',$1,true),set_config('app.property_id','delivery-property',true),set_config('app.security_actor',$2,true),set_config('app.system_purpose',$3,true),set_config('app.guest_session_hash','rag-test-session',true)",[org,principal,purpose]);const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
async function check(name:string,work:()=>Promise<unknown>){const start=Date.now();try{await work();results.push({case:name,passed:true,elapsedMs:Date.now()-start});}catch(e){results.push({case:name,passed:false,elapsedMs:Date.now()-start,detail:String(e)});}}
async function main(){
 await check('document-only publication is ready without a crawl',async()=>{const r=await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',c=>c.query('SELECT * FROM aifrogi_security.rag_snapshot($1)',['delivery-property']));assert.equal(Number(r.rows[0].claim_count),1);assert.equal(r.rows[0].crawl_generation,null);});
 await check('lexical retrieval reads only current published claim',async()=>{const r=await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',c=>c.query('SELECT * FROM aifrogi_security.rag_search_claims($1,$2,NULL,12)',['delivery-property','check-in']));assert.equal(r.rows.length,1);assert.equal(r.rows[0].content,'Check-in is at 2 PM.');});
 await check('wrong tenant context is denied',async()=>{await assert.rejects(()=>ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',c=>c.query('SELECT * FROM aifrogi_security.rag_snapshot($1)',['delivery-property']),'other-org'),/AUTHORITY_CONTEXT_DENIED/);});
 await check('runtime roles cannot read raw index or receipts',async()=>{await assert.rejects(()=>pub.query('SELECT * FROM "RagClaimEmbedding"'),/permission denied/);await assert.rejects(()=>pub.query('SELECT * FROM "RagAnswerReceipt"'),/permission denied/);});
 const vector=Array(512).fill(0);vector[0]=1;
 await check('derived semantic index is idempotent and supports retrieval',async()=>{
 const c=(await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_search_claims($1,$2,NULL,12)',['delivery-property','check-in']))).rows[0];
 const digest=(await owner.query("SELECT encode(digest(convert_to($1,'UTF8'),'sha256'),'hex') hash",[c.content])).rows[0].hash;
 for(let i=0;i<2;i++) await ctx(worker,'KNOWLEDGE_INDEX','rag-indexer:delivery-property',tx=>tx.query('SELECT aifrogi_security.rag_store_embedding($1,$2,$3,$4,$5::double precision[])',['delivery-property',c.entry_id,c.seal_hash,digest,vector]));
 assert.equal((await owner.query('SELECT count(*)::int n FROM "RagClaimEmbedding"')).rows[0].n,1);
 const r=await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_search_claims($1,$2,$3::double precision[],12)',['delivery-property','arrival',vector]));assert.equal(r.rows[0].entry_id,'delivery-entry');
 });
 let snapshot:string;
 await check('grounded paraphrase receipt binds exact evidence and is idempotent',async()=>{
 snapshot=(await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_snapshot($1)',['delivery-property']))).rows[0].snapshot_hash;
 const hash=(await owner.query("SELECT encode(digest(convert_to('Check-in is at 2 PM.','UTF8'),'sha256'),'hex') h")).rows[0].h;
 const args=['delivery-property','delivery-conversation','rag-receipt-test',snapshot,'When may I arrive?','You can check in at 2 PM.',JSON.stringify([{id:'claim:delivery-entry',kind:'CLAIM',sourceId:'delivery-entry',sourceVersion:'entry-seal',digest:hash}]),JSON.stringify([{claim:'You can check in at 2 PM.',supported:true,evidenceIds:['claim:delivery-entry']}]),'{}'];
 let first='';for(let i=0;i<2;i++) {const r=await ctx(web,'PUBLIC_GUEST','public-bot:delivery-property',async tx=>{await tx.query("SELECT aifrogi_security.ensure_guest_session('delivery-property','delivery-conversation','rag-test-session',clock_timestamp()+interval '1 hour','public-bot:delivery-property')");return tx.query('SELECT aifrogi_security.record_rag_answer($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb) id',args);});if(!first)first=r.rows[0].id;else assert.equal(r.rows[0].id,first);}
 const changed=[...args];changed[5]='Check in whenever you like.';changed[7]=JSON.stringify([{claim:changed[5],supported:true,evidenceIds:['claim:delivery-entry']}]);await assert.rejects(()=>ctx(web,'PUBLIC_GUEST','public-bot:delivery-property',tx=>tx.query('SELECT aifrogi_security.record_rag_answer($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)',changed)),/DELIVERY_KEY_CONFLICT/);
 });
 await check('index-only worker cannot capture or publish knowledge',async()=>{await assert.rejects(()=>ctx(worker,'KNOWLEDGE_CAPTURE','rag-indexer:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_index_candidates($1)',['delivery-property'])),/AUTHORITY_CONTEXT_DENIED/);});
 await check('owner publication rejects an entry lacking preview approval',async()=>{
 await owner.query(`INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES('rag-publisher','delivery-property','publisher:test','aifrogi_publisher','KNOWLEDGE_PUBLISH') ON CONFLICT DO NOTHING`);
 await assert.rejects(()=>ctx(publisher,'KNOWLEDGE_PUBLISH','publisher:test',tx=>tx.query('SELECT * FROM aifrogi_security.publish_owner_approved_entries($1,$2,$3::text[])',['delivery-property','publisher:test',['delivery-entry']])),/ENTRY_NOT_OWNER_APPROVED_OR_CURRENT/);
 });
 await check('publication index queue deduplicates repeated requests',async()=>{
 const a=await ctx(publisher,'KNOWLEDGE_PUBLISH','publisher:test',tx=>tx.query('SELECT aifrogi_security.queue_rag_index($1,$2) id',['delivery-property','publisher:test']));
 const b=await ctx(publisher,'KNOWLEDGE_PUBLISH','publisher:test',tx=>tx.query('SELECT aifrogi_security.queue_rag_index($1,$2) id',['delivery-property','publisher:test']));assert.equal(a.rows[0].id,b.rows[0].id);
 assert.equal((await owner.query(`SELECT count(*)::int n FROM "AutomationJob" WHERE "actionType"='RAG_CLAIM_INDEX'`)).rows[0].n,1);
 });
 await check('source revocation invalidates retrieval, index and previous snapshot',async()=>{
 await owner.query("UPDATE \"KnowledgeSource\" SET state='REVOKED',\"revokedAt\"=clock_timestamp() WHERE id='delivery-source'");
 const r=await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_snapshot($1)',['delivery-property']));assert.equal(Number(r.rows[0].claim_count),0);assert.notEqual(r.rows[0].snapshot_hash,snapshot);
 const search=await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_search_claims($1,$2,$3::double precision[],12)',['delivery-property','check-in',vector]));assert.equal(search.rows.length,0);
 });
 await check('approved replacement publishes without mutating its sealed predecessor',async()=>{
 await owner.query(`UPDATE "KnowledgeSource" SET state='AUTHORIZED',"revokedAt"=NULL WHERE id='delivery-source'`);
 await owner.query(`INSERT INTO "KnowledgeEntry"(id,"propertyId",question,answer,category,"createdBy","updatedAt",status,version,"supersedesId","validationStatus","conflictStatus","fieldApprovedBy","fieldApprovedAt","previewApprovedBy","previewApprovedAt","publishedAt","effectiveAt","expiresAt") VALUES('rag-replacement','delivery-property','When is check-in?','Check-in is at 3 PM.','General','publisher:test',clock_timestamp(),'PUBLISHED',2,'delivery-entry','VALID','CLEAR','publisher:test',clock_timestamp(),'publisher:test',clock_timestamp(),clock_timestamp(),clock_timestamp()-interval '1 second',clock_timestamp()+interval '30 days')`);
 await ctx(publisher,'KNOWLEDGE_PUBLISH','publisher:test',tx=>tx.query('SELECT * FROM aifrogi_security.publish_owner_approved_entries($1,$2,$3::text[])',['delivery-property','publisher:test',['rag-replacement']]));
 const old=(await owner.query(`SELECT answer,"sealManifestHash" FROM "KnowledgeEntry" WHERE id='delivery-entry'`)).rows[0];assert.equal(old.answer,'Check-in is at 2 PM.');assert.equal(old.sealManifestHash,'entry-seal');
 const events=(await owner.query(`SELECT count(*)::int n FROM "KnowledgeRevisionEvent" WHERE "entryId"='delivery-entry' AND "eventType"='SUPERSEDED' AND "relatedEntryId"='rag-replacement'`)).rows[0];assert.equal(events.n,1);
 const r=await ctx(pub,'PUBLIC_ANSWER','public-bot:delivery-property',tx=>tx.query('SELECT * FROM aifrogi_security.rag_search_claims($1,$2,NULL,12)',['delivery-property','check-in']));assert.equal(r.rows.length,1);assert.equal(r.rows[0].content,'Check-in is at 3 PM.');
 });
 await check('unchanged publication is idempotent and retains one stable owner source',async()=>{
 const args=['delivery-property','publisher:test',['rag-replacement']];const sql='SELECT * FROM aifrogi_security.publish_owner_approved_entries($1,$2,$3::text[])';
 const a=await ctx(publisher,'KNOWLEDGE_PUBLISH','publisher:test',tx=>tx.query(sql,args));const b=await ctx(publisher,'KNOWLEDGE_PUBLISH','publisher:test',tx=>tx.query(sql,args));assert.equal(a.rows[0].publication_id,b.rows[0].publication_id);
 assert.equal((await owner.query(`SELECT count(*)::int n FROM "KnowledgeSource" WHERE "canonicalIdentity"='owner-approved-form:delivery-property'`)).rows[0].n,1);
 assert.equal((await owner.query(`SELECT "claimIdentityId" FROM "KnowledgeEntry" WHERE id='rag-replacement'`)).rows[0].claimIdentityId,'delivery-identity');
 });
 console.log(JSON.stringify(results));await writeFile('deliverables/RAG_DATABASE_TESTS_2026-10-03.json',JSON.stringify({mode:'isolated PostgreSQL; synthetic approval fixture',results},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
}
main().catch(e=>{console.error(String(e));process.exitCode=1;}).finally(async()=>{await Promise.all([owner.end(),pub.end(),web.end(),worker.end(),publisher.end()]);});
