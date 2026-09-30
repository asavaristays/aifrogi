import { withCanonicalRole } from "@/lib/canonical-db-context";

const WEBSITE_CAPTURE_PRINCIPAL = "website-capture-worker";

export async function recordCanonicalWebsiteSnapshot(input: {
  organizationId: string;
  propertyId: string;
  jobId: string;
  snapshot: unknown;
}) {
  return withCanonicalRole("aifrogi_worker", {
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    principal: WEBSITE_CAPTURE_PRINCIPAL,
    purpose: "KNOWLEDGE_CAPTURE"
  }, async (tx) => {
    const captures = await tx.$queryRaw<Array<{ capture_id: string; object_id: string; capture_version_id: string; page_count: number }>>`
      SELECT * FROM aifrogi_security.record_authorized_website_snapshot(
      ${input.propertyId},
      ${input.jobId},
      ${WEBSITE_CAPTURE_PRINCIPAL},
      ${JSON.stringify(input.snapshot)}::jsonb
      )
    `;
    const capture = captures[0];
    if (!capture) throw new Error("Canonical website capture was not recorded.");
    const generations = await tx.$queryRaw<Array<{ generation_id: string; page_count: number; chunk_count: number }>>`
      SELECT * FROM aifrogi_security.materialize_website_crawl(
        ${input.propertyId}, ${capture.capture_version_id}, ${WEBSITE_CAPTURE_PRINCIPAL}
      )
    `;
    const generation = generations[0];
    if (!generation) throw new Error("Website crawl generation was not materialized.");
    return { ...capture, ...generation };
  });
}
