import {getDb} from './db';
import {withCanonicalRole,type CanonicalIdentity} from './canonical-db-context';
import {SharedAnswerProvider,sharedProviderConfig} from './shared-answer-provider';
import {evidenceDigest} from './shared-answer-engine';

/** Derived, idempotent index. Retrieval still checks current publication authority. */
export async function indexPublishedRagClaims(identity:CanonicalIdentity) {
  const provider=new SharedAnswerProvider({...sharedProviderConfig(),totalBudgetMs:120000});
  const rows=await withCanonicalRole('aifrogi_worker',identity,tx=>tx.$queryRaw<Array<{entry_id:string;content:string;question:string;title:string;seal_hash:string}>>`SELECT * FROM aifrogi_security.rag_index_candidates(${identity.propertyId})`);
  let indexed=0;
  for(let i=0;i<rows.length;i+=16) {
    const batch=rows.slice(i,i+16);
    const vectors=await provider.embed(batch.map(r=>`${r.question}\n${r.title}\n${r.content}`));
    for(let j=0;j<batch.length;j++) {
      const r=batch[j];
      await withCanonicalRole('aifrogi_worker',identity,tx=>tx.$executeRaw`SELECT aifrogi_security.rag_store_embedding(${identity.propertyId},${r.entry_id},${r.seal_hash},${evidenceDigest(r.content)},${vectors[j]}::double precision[])`);
      indexed++;
    }
  }
  const next=await withCanonicalRole('aifrogi_worker',identity,tx=>tx.$queryRaw<Array<{queued:boolean}>>`SELECT aifrogi_security.rag_continue_index(${identity.propertyId}) AS queued`);
  return {indexed,inputTokens:provider.usage.inputTokens,continuationQueued:next[0]?.queued??false};
}

export async function executeRagIndexJob(propertyId:string) {
  const db=getDb();if(!db) throw new Error('DATABASE_UNAVAILABLE');
  const property=await db.property.findUnique({where:{id:propertyId},select:{organizationId:true}});
  if(!property?.organizationId) throw new Error('PROPERTY_NOT_FOUND');
  return indexPublishedRagClaims({organizationId:property.organizationId,propertyId,principal:`rag-indexer:${propertyId}`,purpose:'KNOWLEDGE_INDEX'});
}
