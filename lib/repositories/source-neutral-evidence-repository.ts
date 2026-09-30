import { withCanonicalRole } from "@/lib/canonical-db-context";
import { rankDeliverableEvidence, type EvidenceLocator, type GovernedSourceType } from "@/lib/source-neutral-answer-framework";

type EvidenceRow = {
  organization_id: string;
  property_id: string;
  release_id: string;
  consent_id: string;
  source_revision_id: string;
  source_type: GovernedSourceType;
  authority_rank: number;
  evidence_id: string;
  quotation: string;
  quotation_hash: string;
  locator: unknown;
  observed_at: Date;
  effective_until: Date | null;
  entry_id: string;
  claim_question: string;
  canonical_answer: string;
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function string(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function integer(value: unknown, fallback: number) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; }

export function normalizeEvidenceLocator(sourceType: GovernedSourceType, raw: unknown, fallbackId: string): EvidenceLocator {
  const locator = object(raw);
  if (sourceType === "WEBSITE") return { sourceType, url: string(locator.url, ""), pageId: string(locator.pageId ?? locator.page_id, fallbackId), chunkId: string(locator.chunkId ?? locator.chunk_id, fallbackId) };
  if (sourceType === "PDF") return { sourceType, fileId: string(locator.fileId ?? locator.file_id, fallbackId), page: integer(locator.page ?? locator.pageNumber, 1), blockId: string(locator.blockId ?? locator.block_id, fallbackId) };
  if (sourceType === "SPREADSHEET") return { sourceType, fileId: string(locator.fileId ?? locator.file_id, fallbackId), sheet: string(locator.sheet ?? locator.sheetName, "Sheet1"), row: integer(locator.row ?? locator.rowNumber, 1), stableKey: string(locator.stableKey ?? locator.rowKey, fallbackId) };
  if (sourceType === "FORM" || sourceType === "PROFILE") return { sourceType, formId: string(locator.formId, fallbackId), field: string(locator.field, fallbackId) };
  return { sourceType: "CONNECTOR", connectorId: string(locator.connectorId, fallbackId), recordType: string(locator.recordType, "record"), recordId: string(locator.recordId, fallbackId) };
}

/** Reads only evidence that is simultaneously in the active source release and
 * bound to a sealed claim in the active PUBLICATION. This makes the returned
 * claim IDs acceptable to the existing exact-answer delivery audit. */
export async function getActiveReleaseEvidence(input: { organizationId: string; propertyId: string; principal: string; question: string }) {
  const rows = await withCanonicalRole("aifrogi_public", { ...input, purpose: "PUBLIC_ANSWER" }, tx => tx.$queryRaw<EvidenceRow[]>`
    SELECT p."organizationId" AS organization_id,
           p.id AS property_id,
           release."releaseId" AS release_id,
           revision."consentId" AS consent_id,
           member."sourceRevisionId" AS source_revision_id,
           CASE WHEN member."sourceType"='OWNER_CORRECTION'::"KnowledgeSourceType" THEN 'FORM' ELSE member."sourceType"::text END AS source_type,
           member."authorityRank" AS authority_rank,
           evidence.id AS evidence_id,
           evidence.quotation,
           evidence."quotationHash" AS quotation_hash,
           evidence.locator,
           capture."capturedAt" AS observed_at,
           consent."effectiveUntil" AS effective_until,
           entry.id AS entry_id,
           entry.question AS claim_question,
           entry.answer AS canonical_answer
      FROM "KnowledgeReleaseActivePointer" active
      JOIN "KnowledgeReleaseArtifact" release
        ON release."propertyId"=active."propertyId" AND release.id=active."releaseArtifactId"
      JOIN "Property" p ON p.id=active."propertyId"
      JOIN "KnowledgeReleaseMember" member
        ON member."propertyId"=release."propertyId" AND member."releaseArtifactId"=release.id
      JOIN "KnowledgeSource" source
        ON source."propertyId"=member."propertyId" AND source.id=member."sourceId"
      JOIN "KnowledgeSourceRevision" revision
        ON revision."propertyId"=member."propertyId" AND revision.id=member."sourceRevisionId"
      JOIN "WebsiteSourceConsent" consent
        ON consent."propertyId"=revision."propertyId" AND consent.id=revision."consentId"
      JOIN "CaptureVersion" capture
        ON capture."propertyId"=member."propertyId" AND capture.id=member."captureVersionId"
      JOIN "KnowledgeClaimEvidence" evidence
        ON evidence."propertyId"=capture."propertyId" AND evidence."captureVersionId"=capture.id
      JOIN "KnowledgeEntry" entry
        ON entry."propertyId"=evidence."propertyId" AND entry.id=evidence."entryId"
      JOIN "KnowledgeServingPointer" serving
        ON serving."propertyId"=entry."propertyId" AND serving.audience='PUBLIC'::"KnowledgeAudience"
      JOIN "KnowledgePublication" publication
        ON publication."propertyId"=serving."propertyId" AND publication.id=serving."publicationId"
      JOIN "KnowledgePublicationClaim" published
        ON published."propertyId"=publication."propertyId" AND published."publicationId"=publication.id AND published."entryId"=entry.id
     WHERE active."propertyId"=${input.propertyId}
       AND p."organizationId"=${input.organizationId}
       AND release.state='ACTIVE' AND release."revokedAt" IS NULL
       AND source.state='AUTHORIZED'::"KnowledgeSourceState" AND source."revokedAt" IS NULL
       AND consent.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED')
       AND consent."effectiveFrom" <= clock_timestamp()
       AND (consent."effectiveUntil" IS NULL OR consent."effectiveUntil" > clock_timestamp())
       AND publication.state='SEALED'::"PublicationState" AND publication."revokedAt" IS NULL
       AND entry.status='PUBLISHED' AND entry."revisionState"='SEALED'::"ClaimRevisionState"
       AND entry."sealedAt" IS NOT NULL
       AND (entry."effectiveUntil" IS NULL OR entry."effectiveUntil" > clock_timestamp())
     ORDER BY member."authorityRank", evidence.id
     LIMIT 200
  `);
  if (!rows.length) return { releaseId: null, candidates: [] };
  const releaseId = rows[0].release_id;
  if (rows.some((row) => row.release_id !== releaseId)) throw new Error("MULTIPLE_ACTIVE_KNOWLEDGE_RELEASES");
  const candidates = rankDeliverableEvidence({
    organizationId: input.organizationId, propertyId: input.propertyId, releaseId, question: input.question,
    candidates: rows.map((row) => ({
      claimId: row.entry_id, claimQuestion: row.claim_question, canonicalAnswer: row.canonical_answer,
      unit: { id: row.evidence_id, organizationId: row.organization_id, propertyId: row.property_id, releaseId: row.release_id, authorizationId: row.consent_id, sourceVersionId: row.source_revision_id, sourceType: row.source_type, content: row.quotation, contentDigest: row.quotation_hash, authorityRank: row.authority_rank, observedAt: row.observed_at.toISOString(), effectiveUntil: row.effective_until?.toISOString() ?? null, locator: normalizeEvidenceLocator(row.source_type, row.locator, row.evidence_id) }
    }))
  });
  return { releaseId, candidates };
}
