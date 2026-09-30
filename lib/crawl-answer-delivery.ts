import { withCanonicalRole, type CanonicalIdentity } from "@/lib/canonical-db-context";

export function recordDeliveredCrawlAnswer(input: {
  identity: CanonicalIdentity;
  conversationId: string;
  sessionHash: string;
  expiresAt: Date;
  generationId: string;
  chunkIds: string[];
  question: string;
  answer: string;
  model: string;
  deliveryKey: string;
  materialClaimDecisions: Array<{ claim: string; supported: boolean; matchedTerms: string[]; missingNumbers: string[] }>;
}) {
  return withCanonicalRole("aifrogi_web", input.identity, async tx => {
    await tx.$executeRaw`SELECT aifrogi_security.ensure_guest_session(${input.identity.propertyId},${input.conversationId},${input.sessionHash},${input.expiresAt.toISOString()}::timestamptz,${input.identity.principal})`;
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT aifrogi_security.record_crawl_answer(
        ${input.identity.propertyId}, ${input.conversationId}, ${input.generationId},
        ${input.chunkIds}::text[], ${input.question}, ${input.answer}, ${input.model},
        ${input.deliveryKey}, 'DELIVERED', ${JSON.stringify(input.materialClaimDecisions)}::jsonb
      ) AS id
    `;
    if (!rows[0]?.id) throw new Error("CRAWL_ANSWER_AUDIT_NOT_CREATED");
    return rows[0].id;
  });
}
