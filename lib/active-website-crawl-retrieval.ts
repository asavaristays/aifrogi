import { withCanonicalRole } from "@/lib/canonical-db-context";
import { deterministicSemanticVector, hybridRetrieve } from "@/lib/hybrid-retrieval";

export type ActiveWebsiteChunk = {
  generation_id: string;
  page_id: string;
  chunk_id: string;
  url: string;
  title: string;
  content: string;
  rank: number;
};

export type ActiveWebsiteCrawlStatus = {
  generation_id: string;
  page_count: number;
  chunk_count: number;
};

export function readActiveWebsiteCrawlStatus(input: {
  organizationId: string;
  propertyId: string;
  principal: string;
}) {
  return withCanonicalRole("aifrogi_public", {
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    principal: input.principal,
    purpose: "PUBLIC_ANSWER"
  }, tx => tx.$queryRaw<ActiveWebsiteCrawlStatus[]>`
    SELECT * FROM aifrogi_security.active_website_crawl_status(${input.propertyId})
  `).then(rows => rows[0] ?? null);
}

export async function retrieveActiveWebsiteChunks(input: {
  organizationId: string;
  propertyId: string;
  principal: string;
  query: string;
  limit?: number;
}) {
  const limit=input.limit??6;
  const rows=await withCanonicalRole("aifrogi_public", {
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    principal: input.principal,
    purpose: "PUBLIC_ANSWER"
  }, tx => tx.$queryRaw<ActiveWebsiteChunk[]>`
    SELECT * FROM aifrogi_security.retrieve_active_website_chunks(
      ${input.propertyId}, ${input.query}, ${Math.max(limit*2,limit)}
    )
  `);
  if(!rows.length)return rows;
  const generation=rows[0].generation_id;
  const ordered=hybridRetrieve({propertyId:input.propertyId,releaseId:generation,queryEmbedding:deterministicSemanticVector(input.query),limit,candidates:rows.map(row=>({id:row.chunk_id,propertyId:input.propertyId,releaseId:row.generation_id,lexicalScore:Number(row.rank),embedding:deterministicSemanticVector(row.content)}))});
  const byId=new Map(rows.map(row=>[row.chunk_id,row])); return ordered.map(item=>byId.get(item.id)!);
}
