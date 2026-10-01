-- Public answers use a narrow authority function, never direct table grants.
CREATE FUNCTION aifrogi_security.public_active_release_evidence(p_property text)
RETURNS TABLE (
  organization_id text, property_id text, release_id text, consent_id text,
  source_revision_id text, source_type text, authority_rank integer,
  evidence_id text, quotation text, quotation_hash text, locator jsonb,
  observed_at timestamp(3), effective_until timestamp(3), entry_id text,
  claim_question text, canonical_answer text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  RETURN QUERY
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
      JOIN "SourceCapture" member_capture
        ON member_capture."propertyId"=member."propertyId" AND member_capture."sourceId"=member."sourceId"
       AND member_capture."sourceRevisionId"=member."sourceRevisionId" AND member_capture.status='SUCCEEDED'
       AND (member."captureId" IS NULL OR member_capture.id=member."captureId")
      JOIN "CaptureVersion" capture
        ON capture."propertyId"=member_capture."propertyId" AND capture."captureId"=member_capture.id
       AND (member."captureVersionId" IS NULL OR capture.id=member."captureVersionId")
      JOIN "KnowledgeObject" evidence_object
        ON evidence_object."propertyId"=capture."propertyId" AND evidence_object.id=capture."objectId" AND evidence_object.state='USABLE'
      JOIN "PropertyIntelligencePolicy" intelligence_policy
        ON intelligence_policy."propertyId"=member."propertyId"
      JOIN "KnowledgePolicyVersion" knowledge_policy
        ON knowledge_policy."propertyId"=intelligence_policy."propertyId" AND knowledge_policy.id=intelligence_policy."currentPolicyVersionId"
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
     WHERE active."propertyId"=p_property
       AND p."organizationId"=aifrogi_security.current_organization_id()
       AND release.state='ACTIVE' AND release."revokedAt" IS NULL
       AND source.state='AUTHORIZED'::"KnowledgeSourceState" AND source."revokedAt" IS NULL
       AND member."sourceType"=source."sourceType"
       AND revision."sourceId"=source.id AND consent."sourceId"=source.id
       AND consent."sourceType"=source."sourceType" AND consent."canonicalIdentityHash"=source."canonicalIdentityHash"
       AND consent."audienceCeiling"='PUBLIC'::"KnowledgeAudience"
       AND consent.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED')
       AND consent."effectiveFrom" <= clock_timestamp()
       AND (consent."effectiveUntil" IS NULL OR consent."effectiveUntil" > clock_timestamp())
       AND publication.state='SEALED'::"PublicationState" AND publication."revokedAt" IS NULL
       AND entry.status='PUBLISHED' AND entry."revisionState"='SEALED'::"ClaimRevisionState"
       AND entry."sealedAt" IS NOT NULL
       AND (entry."effectiveUntil" IS NULL OR entry."effectiveUntil" > clock_timestamp())
       AND capture."capturedAt">=statement_timestamp()-(COALESCE((knowledge_policy."freshnessRules"->>'maxAgeDays')::int,entry."refreshDays")*interval '1 day')
       AND aifrogi_security.eligible_claim(p_property,entry.id,'PUBLIC'::"KnowledgeAudience",statement_timestamp(),serving."eligibilityGeneration")
       AND EXISTS (
         SELECT 1 FROM "KnowledgeRevisionEvidenceBinding" binding
         WHERE binding."propertyId"=entry."propertyId" AND binding."entryId"=entry.id AND binding."evidenceId"=evidence.id
       )
     ORDER BY member."authorityRank", evidence.id
     LIMIT 200;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.public_active_release_evidence(text)
  FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.public_active_release_evidence(text) TO aifrogi_public;
