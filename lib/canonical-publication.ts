import { withCanonicalRole } from "@/lib/canonical-db-context";
import { getDb } from "@/lib/db";

type PublicationResult = { publicationId:string; pointerGeneration:bigint; claimCount:number };

/**
 * Converts the complete current owner-approved knowledge set into one sealed
 * canonical publication. This must run inside platform-admin DB context so the
 * narrowly-scoped publisher principal can be provisioned before role switching.
 */
export async function publishCurrentOwnerApprovedKnowledge(input:{
  organizationId:string;
  propertyId:string;
  platformActor:string;
}) {
  const db=getDb();
  if(!db) throw new Error("Database unavailable.");
  const candidates=await db.knowledgeEntry.findMany({
    where:{propertyId:input.propertyId,status:"PUBLISHED",previewApprovedAt:{not:null},previewApprovedBy:{not:null},conflictStatus:"CLEAR",revisionEvents:{none:{eventType:{in:["SUPERSEDED","WITHDRAWN"]}}},AND:[{OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},{OR:[{effectiveAt:null},{effectiveAt:{lte:new Date()}}]}]},
    select:{id:true,previewApprovedBy:true,supersedesId:true},orderBy:{id:"asc"}
  });
  const replaced=new Set(candidates.flatMap(entry=>entry.supersedesId?[entry.supersedesId]:[]));
  const entries=candidates.filter(entry=>!replaced.has(entry.id));
  if(!entries.length) throw new Error("No current owner-approved knowledge is available for canonical publication.");
  const approvers=[...new Set(entries.map(entry=>entry.previewApprovedBy!.trim().toLowerCase()))];
  if(approvers.length!==1) throw new Error("Canonical publication requires one accountable owner approval identity.");
  const publisher=approvers[0];
  await db.$executeRaw`SELECT aifrogi_security.provision_knowledge_publisher(${input.propertyId},${publisher},${input.platformActor})`;
  const rows=await withCanonicalRole("aifrogi_publisher",{
    organizationId:input.organizationId,propertyId:input.propertyId,principal:publisher,purpose:"KNOWLEDGE_PUBLISH"
  },tx=>tx.$queryRaw<Array<{publication_id:string;pointer_generation:bigint;claim_count:number}>>`
    SELECT * FROM aifrogi_security.publish_owner_approved_entries(${input.propertyId},${publisher},${entries.map(entry=>entry.id)}::text[])
  `);
  const result=rows[0];
  if(!result||result.claim_count!==entries.length) throw new Error("Canonical publication did not include the complete approved knowledge set.");
  return {publicationId:result.publication_id,pointerGeneration:result.pointer_generation,claimCount:result.claim_count} satisfies PublicationResult;
}

export async function assertCanonicalPublicServingPointer(propertyId:string) {
  const db=getDb();
  if(!db) throw new Error("Database unavailable.");
  const rows=await db.$queryRaw<Array<{publication_id:string;pointer_generation:bigint;claim_count:bigint}>>`
    SELECT * FROM aifrogi_security.canonical_publication_status(${propertyId})
  `;
  if(!rows[0]||rows[0].claim_count<BigInt(1)) throw new Error("Canonical public serving pointer is missing; the bot cannot go live.");
  return rows[0];
}
