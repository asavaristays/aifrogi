import {randomUUID} from 'node:crypto';
import {getDb} from '@/lib/db';
import {withTenantPropertyDatabaseContext} from '@/lib/security/tenant-database-context';
import {getWebsiteKnowledgeBase} from './website-knowledge-service';
import {recordCanonicalWebsiteSnapshot} from '@/lib/canonical-website-capture';
export async function captureBusinessWebsite(input:{organizationId:string;propertyId:string;actor:string;propertySlug:string}) {
 const jobId=randomUUID();
 await withTenantPropertyDatabaseContext(input,async()=>{
  const property=await getDb()!.property.findFirst({where:{id:input.propertyId,organizationId:input.organizationId,slug:input.propertySlug},select:{id:true}});
  if(!property)throw Error('The website does not belong to this workspace.');
  await getDb()!.$queryRaw`SELECT aifrogi_security.begin_owner_website_capture(${input.propertyId},${input.actor},${jobId})`;
 });
 try {
  // Crawl outside a database transaction; restricted capture consent is enough
  // for private review, never for public answers.
  const snapshot=await getWebsiteKnowledgeBase(input.propertySlug,true,{organizationId:input.organizationId,propertyId:input.propertyId});
  if(!snapshot.pages.length || snapshot.pages.some(page=>new URL(page.url).origin!==new URL(snapshot.baseUrl).origin))throw Error('The capture contains invalid or foreign source pages.');
  const captured=await recordCanonicalWebsiteSnapshot({organizationId:input.organizationId,propertyId:input.propertyId,jobId,snapshot});
  await withTenantPropertyDatabaseContext(input,async()=>{
   const changed=await getDb()!.automationJob.updateMany({where:{id:jobId,propertyId:input.propertyId,status:'RUNNING',lockedBy:jobId,leaseExpiresAt:{gt:new Date()}},data:{status:'SUCCEEDED',completedAt:new Date(),lockedBy:null,leaseExpiresAt:null,result:{generationId:captured.generation_id,pages:captured.page_count,chunks:captured.chunk_count}}});
   if(changed.count!==1)throw Error('Website capture completion fence was lost.');
  });
  return {pagesSynced:snapshot.pages.length,generationId:captured.generation_id,reviewRequired:true};
 }catch(error){
  await withTenantPropertyDatabaseContext(input,()=>getDb()!.automationJob.updateMany({where:{id:jobId,propertyId:input.propertyId,status:'RUNNING',lockedBy:jobId},data:{status:'DEAD',completedAt:new Date(),lockedBy:null,leaseExpiresAt:null,lastError:error instanceof Error?error.message.slice(0,240):'Capture failed'}}));
  throw error;
 }
}
