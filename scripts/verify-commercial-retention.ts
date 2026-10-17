import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDb,getBootstrapDb} from '../lib/db';
import {withTenantPropertyDatabaseContext} from '../lib/security/tenant-database-context';
import {ensureOrganizationSubscription} from '../lib/billing-super-admin';
import {reconcileSubscriptionLifecycleForOrganization} from '../lib/subscription-lifecycle';
async function main(){
 assert.match(process.env.DATABASE_URL||'',/@127\.0\.0\.1:\d+\/p2b_rehearsal_business$/);
 globalThis.fetch=async()=>{throw Error('RETENTION_TEST_EXTERNAL_IO_FORBIDDEN');};
 const {scope}=JSON.parse(await readFile(`${process.env.BUSINESS_TEST_ARTIFACT_DIR||'/private/tmp/aifrogi-business-review'}/business-journey-results.json`,'utf8'));
 await withTenantPropertyDatabaseContext(scope,async()=>{
  const db=getDb()!;await ensureOrganizationSubscription(scope.organizationId);const before=await db.subscription.findUniqueOrThrow({where:{organizationId:scope.organizationId}});
  const documents=await db.knowledgeDocument.count({where:{propertyId:scope.propertyId}});assert.ok(documents>0);
  try{
   await db.subscription.update({where:{id:before.id},data:{status:'SUSPENDED',trialEndsAt:new Date(Date.now()-40*86400000),graceEndsAt:new Date(Date.now()-37*86400000)}});
   const read=await reconcileSubscriptionLifecycleForOrganization(scope.organizationId,new Date(),false);
   assert.equal(read.deleted,false);assert.equal(read.state,'SUSPENDED');assert.equal(read.deletionReviewRequired,true);
   assert.equal(await db.platformAuditLog.count({where:{organizationId:scope.organizationId,action:'SUBSCRIPTION_RETENTION_REVIEW_REQUIRED'}}),0);
   await reconcileSubscriptionLifecycleForOrganization(scope.organizationId,new Date(),true);await reconcileSubscriptionLifecycleForOrganization(scope.organizationId,new Date(),true);
   assert.equal(await db.platformAuditLog.count({where:{organizationId:scope.organizationId,action:'SUBSCRIPTION_RETENTION_REVIEW_REQUIRED'}}),1);
   assert.ok(await db.organization.findUnique({where:{id:scope.organizationId}}));assert.equal(await db.knowledgeDocument.count({where:{propertyId:scope.propertyId}}),documents);
   console.log('RETENTION_PASS: ordinary reads cannot purge a used tenant; scheduled review is durable and idempotent; retained knowledge remains intact; external I/O blocked');
  }finally{await db.subscription.update({where:{id:before.id},data:{status:before.status,trialEndsAt:before.trialEndsAt,graceEndsAt:before.graceEndsAt}});}
 });
 await getBootstrapDb()?.$disconnect();
}
main().catch(error=>{console.error(error);process.exitCode=1;});
