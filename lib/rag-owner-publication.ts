import {getDb} from './db';
import {withTenantPropertyDatabaseContext} from './security/tenant-database-context';
import {withCanonicalRole} from './canonical-db-context';

/** Publish only after the owner review transaction has committed. */
export async function activateReviewedRagKnowledge(input:{organizationId:string;propertyId:string;actor:string}) {
  await withTenantPropertyDatabaseContext(input,async()=>{
    await getDb()!.$executeRaw`SELECT aifrogi_security.provision_rag_owner_publisher(${input.propertyId},${input.actor})`;
  });
  return withCanonicalRole('aifrogi_publisher',{...input,principal:input.actor,purpose:'KNOWLEDGE_PUBLISH'},async tx=>{
    const rows=await tx.$queryRaw<Array<{publication_id:string|null;pointer_generation:bigint|null;claim_count:number}>>`SELECT * FROM aifrogi_security.publish_current_rag_knowledge(${input.propertyId},${input.actor})`;
    const r=rows[0];if(!r) throw new Error('PUBLICATION_RESULT_MISSING');
    return {publicationId:r.publication_id,pointerGeneration:r.pointer_generation?.toString()??null,claimCount:r.claim_count};
  });
}
