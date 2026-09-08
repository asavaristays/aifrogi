import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDb,withDatabaseTransaction} from '../lib/db';
import {createAtomicClaim,fieldApproveClaim,generateClaimPreview,reviewClaimPreview,pauseClaim,deleteUnpublishedClaim,reconfirmClaim} from '../lib/repositories/knowledge-verification-repository';
const db=getDb();if(!db)throw Error('Database unavailable');
const marker='QA-5B-'+randomUUID(),rollback=new Error('EXPECTED_QA_ROLLBACK');
const checks:string[]=[];function pass(name:string){checks.push(name);console.log(JSON.stringify({check:name,passed:true}));}
async function main(){
 const property=await db!.property.findUnique({where:{slug:'showcase-clinicgpt'},include:{organization:{select:{isDemo:true}}}});
 const other=await db!.property.findUnique({where:{slug:'showcase-hotelgpt'},select:{id:true}});
 assert.ok(property?.organization?.isDemo&&other);
 try{await db!.$transaction(async tx=>{
  // All repository transactions share this explicit rollback-only transaction.
  // This proves DB constraints/lifecycle, not independent-transaction concurrency.
  const scoped=new Proxy(tx,{get(target,key){if(key==='$transaction')return async(work:unknown)=>typeof work==='function'?work(scoped):Promise.all(work as Promise<unknown>[]);return Reflect.get(target,key);}});
  await withDatabaseTransaction(scoped,async()=>{
   const actorEmail='qa-5b@example.invalid',propertyId=property.id;
   const gap=await tx.knowledgeGap.create({data:{propertyId,question:marker,normalizedQuestion:marker}});
   const base={propertyId,question:'Which synthetic service is offered for '+marker+'?',answer:'The fictional service is a demonstration consultation.',category:marker,createdBy:actorEmail,gapId:gap.id};
   await assert.rejects(createAtomicClaim({...base,propertyId:other.id}),/workspace/);pass('Foreign gap cannot attach to a correction');
   const first=await createAtomicClaim(base);assert.equal(first.status,'VALIDATED');assert.equal((await tx.knowledgeGap.findUnique({where:{id:gap.id}}))?.status,'OPEN');pass('Draft does not resolve the knowledge gap');
   await assert.rejects(generateClaimPreview({propertyId,entryId:first.id}),/approval/);pass('Preview requires field approval');
   await assert.rejects(fieldApproveClaim({propertyId:other.id,entryId:first.id,actorEmail}),/not found/);pass('Foreign tenant field approval rejected');
   await fieldApproveClaim({propertyId,entryId:first.id,actorEmail});const preview=await generateClaimPreview({propertyId,entryId:first.id});
   await tx.knowledgeEntry.update({where:{id:first.id},data:{answer:'A changed answer invalidates the preview.'}});
   await assert.rejects(reviewClaimPreview({propertyId,previewId:preview.id,actorEmail,approve:true}),/stale/);pass('Stale preview cannot publish changed content');
   await tx.knowledgeEntry.update({where:{id:first.id},data:{answer:base.answer}});
   await pauseClaim({propertyId,entryId:first.id,actorEmail,reason:marker});
   await assert.rejects(reviewClaimPreview({propertyId,previewId:preview.id,actorEmail,approve:true}),/no longer/);pass('Paused preview cannot publish');
   await fieldApproveClaim({propertyId,entryId:first.id,actorEmail});const fresh=await generateClaimPreview({propertyId,entryId:first.id});
   assert.equal((await tx.knowledgePreview.findUnique({where:{id:preview.id}}))?.status,'REJECTED');pass('New preview invalidates earlier pending preview');
   await reviewClaimPreview({propertyId,previewId:fresh.id,actorEmail,approve:true});
   assert.equal((await tx.knowledgeGap.findUnique({where:{id:gap.id}}))?.status,'RESOLVED');
   assert.equal((await tx.knowledgeEntry.findUnique({where:{id:first.id}}))?.status,'PUBLISHED');pass('Approved regression-gated publication resolves the gap');
   const audit=await tx.onboardingActivity.findFirst({where:{organizationId:property.organizationId!,action:'KNOWLEDGE_PUBLICATION_GATE_PASSED',detail:{contains:first.id}}});assert.ok(audit);assert.equal(audit.actorEmail,actorEmail);pass('Publication regression and actor retained in audit');
   const second=await createAtomicClaim({...base,answer:'The fictional service is a demonstration follow-up.'});assert.equal(second.version,first.version+1);assert.equal((await tx.knowledgeEntry.findUnique({where:{id:first.id}}))?.status,'PAUSED');pass('Conflicting replacement pauses earlier published truth');
   await assert.rejects(fieldApproveClaim({propertyId,entryId:second.id,actorEmail}),/conflicts/);pass('Conflict cannot bypass explicit supersession');
   await assert.rejects(fieldApproveClaim({propertyId,entryId:second.id,actorEmail,supersedesId:second.id}),/itself/);pass('Self-supersession rejected');
   await fieldApproveClaim({propertyId,entryId:second.id,actorEmail,supersedesId:first.id});const next=await generateClaimPreview({propertyId,entryId:second.id});await reviewClaimPreview({propertyId,previewId:next.id,actorEmail,approve:true});
   assert.equal((await tx.knowledgeEntry.findUnique({where:{id:first.id}}))?.status,'SUPERSEDED');assert.equal(await tx.knowledgeEntry.count({where:{propertyId,claimKey:first.claimKey,status:'PUBLISHED'}}),1);pass('Only replacement is published; prior version retained');
   await assert.rejects(reconfirmClaim({propertyId,entryId:first.id,actorEmail}),/superseded/);pass('Reconfirmation cannot resurrect superseded truth');
   await pauseClaim({propertyId,entryId:second.id,actorEmail,reason:marker});await assert.rejects(deleteUnpublishedClaim({propertyId,entryId:second.id}),/retained/);pass('Paused published history cannot be deleted');
  });throw rollback;
 },{timeout:30000,isolationLevel:'Serializable'});}catch(error){if(error!==rollback)throw error;}
 assert.equal(await db!.knowledgeEntry.count({where:{category:marker}}),0);assert.equal(await db!.knowledgeGap.count({where:{normalizedQuestion:marker}}),0);pass('All synthetic correction fixtures rolled back');
 console.log(JSON.stringify({suite:'Bucket 5B rollback-only database lifecycle',passed:checks.length,marker,realKnowledgeChanged:false}));
}
main().catch(e=>{console.error(JSON.stringify({failed:true,message:e instanceof Error?e.message:'failure'}));process.exitCode=1;}).finally(async()=>{await db!.$disconnect();}).then(()=>process.stdout.write('5B QA cleanup complete\n',()=>process.exit(process.exitCode||0))).catch(()=>process.exit(1));
