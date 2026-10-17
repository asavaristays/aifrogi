import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {readFile,writeFile} from 'node:fs/promises';
async function main(){
 assert.match(process.env.DATABASE_URL||'',/@127\.0\.0\.1:\d+\/p2b_rehearsal_business$/);
 const pool=new Pool({connectionString:process.env.DATABASE_URL});const results:string[]=[];
 const fixture=JSON.parse(await readFile(`${process.env.BUSINESS_TEST_ARTIFACT_DIR}/heldout-results.json`,'utf8')).results[0];
 const evidence=fixture.retrievedEvidence[0];assert.ok(evidence);const property=evidence.propertyId,org=evidence.organizationId;
 const client=await pool.connect();
 try{
  await client.query('BEGIN');await client.query(`SELECT set_config('app.platform_authority','true',true),set_config('app.security_actor','fixture-admin',true)`);
  const p=(await client.query('SELECT slug FROM "Property" WHERE id=$1',[property])).rows[0];assert.ok(p);
  const member=(await client.query(`SELECT email FROM "OrganizationMember" WHERE "organizationId"=$1 AND role='OWNER'`,[org])).rows[0];
  await client.query(`SELECT set_config('app.platform_authority','false',true),set_config('app.organization_id',$1,true),set_config('app.property_id',$2,true),set_config('app.security_actor',$3,true),set_config('app.system_purpose','knowledge-owner-workflow',true)`,[org,property,member.email]);
  const principal=(await client.query('SELECT aifrogi_security.provision_owner_answer_preview($1,$2) principal',[property,member.email])).rows[0].principal;
  assert.ok(principal.startsWith('owner-preview:'));results.push('Verified active owner can create time-limited private preview');
  await client.query('SAVEPOINT denied');await assert.rejects(()=>client.query('SELECT aifrogi_security.provision_owner_answer_preview($1,$2)',[property,'outsider@synthetic-business.invalid']),/OWNER_AUTHORITY_REQUIRED/);await client.query('ROLLBACK TO SAVEPOINT denied');results.push('Other owner cannot provision preview');
  await client.query(`SELECT set_config('app.organization_id','different-tenant',true)`);await client.query('SAVEPOINT foreign_scope');await assert.rejects(()=>client.query('SELECT aifrogi_security.provision_owner_answer_preview($1,$2)',[property,member.email]),/OWNER_AUTHORITY_REQUIRED/);await client.query('ROLLBACK TO SAVEPOINT foreign_scope');results.push('Foreign tenant cannot provision preview');
  await client.query(`SELECT set_config('app.organization_id',$1,true),set_config('app.platform_authority','true',true),set_config('app.security_actor','admin-test:operator@synthetic-business.invalid',true)`,[org]);
  const before=(await client.query('SELECT status FROM "BotProfile" WHERE "organizationId"=$1',[org])).rows[0].status;assert.equal(before,'DRAFT');
  await client.query('SELECT aifrogi_security.sync_website_bot_runtime($1,$2)',[org,'operator@synthetic-business.invalid']);
  assert.equal(Number((await client.query('SELECT count(*) n FROM "KnowledgeRuntimePrincipalGrant" WHERE "propertyId"=$1 AND "principalId"=$2 AND "revokedAt" IS NULL',[property,`public-bot:${p.slug}`])).rows[0].n),0);results.push('DRAFT synchronization grants no public runtime access');
  await client.query(`UPDATE "BotProfile" SET status='LIVE' WHERE "organizationId"=$1`,[org]);
  await client.query('SELECT aifrogi_security.sync_website_bot_runtime($1,$2)',[org,'operator@synthetic-business.invalid']);
  assert.equal(Number((await client.query('SELECT count(*) n FROM "KnowledgeRuntimePrincipalGrant" WHERE "propertyId"=$1 AND "principalId"=$2 AND "revokedAt" IS NULL',[property,`public-bot:${p.slug}`])).rows[0].n),2);results.push('Explicit LIVE lifecycle provisions exactly two scoped public roles');
  await client.query(`UPDATE "BotProfile" SET status='PAUSED' WHERE "organizationId"=$1`,[org]);await client.query('SELECT aifrogi_security.sync_website_bot_runtime($1,$2)',[org,'operator@synthetic-business.invalid']);
  assert.equal(Number((await client.query('SELECT count(*) n FROM "KnowledgeRuntimePrincipalGrant" WHERE "propertyId"=$1 AND "principalId"=$2 AND "revokedAt" IS NULL',[property,`public-bot:${p.slug}`])).rows[0].n),0);results.push('Pause revokes public role grants in the lifecycle transaction');
  await client.query(`SELECT set_config('app.platform_authority','false',true)`);await client.query('SAVEPOINT admin_denied');await assert.rejects(()=>client.query('SELECT aifrogi_security.sync_website_bot_runtime($1,$2)',[org,'operator@synthetic-business.invalid']),/PLATFORM_AUTHORITY_REQUIRED/);await client.query('ROLLBACK TO SAVEPOINT admin_denied');results.push('Owner cannot invoke platform lifecycle provisioning');
 }finally{await client.query('ROLLBACK');client.release();await pool.end();}
 await writeFile(`${process.env.BUSINESS_TEST_ARTIFACT_DIR}/runtime-provisioning-results.json`,JSON.stringify({scope:'Disposable synthetic database only; all lifecycle changes rolled back',passed:results.length,results},null,2));console.log(JSON.stringify({passed:results.length,results}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
