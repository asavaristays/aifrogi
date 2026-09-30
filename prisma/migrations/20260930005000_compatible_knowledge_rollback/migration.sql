-- Atomic, compatibility-checked rollback of both knowledge and bot releases.
CREATE FUNCTION aifrogi_security.rollback_knowledge_release(
 p_property text,p_target_knowledge text,p_target_bot text,
 p_expected_knowledge_generation bigint,p_expected_bot_generation bigint,
 p_runtime jsonb,p_actor text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE k "KnowledgeReleaseArtifact"%ROWTYPE; b "BotReleaseArtifact"%ROWTYPE; bp "BotMachinePolicyArtifact"%ROWTYPE; kg bigint; bg bigint; expected_members int; actual_members int;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_ROLLBACK'],p_actor);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_property,8841));
 PERFORM pg_advisory_xact_lock(hashtextextended(p_property,7319));
 SELECT * INTO STRICT k FROM "KnowledgeReleaseArtifact" WHERE ("propertyId",id)=(p_property,p_target_knowledge) AND state='SUPERSEDED' FOR UPDATE;
 SELECT * INTO STRICT b FROM "BotReleaseArtifact" WHERE ("propertyId",id)=(p_property,p_target_bot) AND state='SUPERSEDED' FOR UPDATE;
 SELECT * INTO STRICT bp FROM "BotMachinePolicyArtifact" WHERE ("propertyId",id)=(p_property,b."policyArtifactId") FOR SHARE;
 IF b."knowledgeReleaseHash"<>k."manifestHash" OR b."policyHash"<>bp."policyHash" THEN RAISE EXCEPTION 'ROLLBACK_RELEASE_BINDING_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "KnowledgeReleaseApproval" a WHERE (a."propertyId",a.id,a."manifestHash",a.decision)=(p_property,k."approvalId",k."manifestHash",'APPROVED')) THEN RAISE EXCEPTION 'ROLLBACK_APPROVAL_NOT_CURRENT'; END IF;
 IF jsonb_typeof(p_runtime)<>'object'
   OR p_runtime->>'applicationBuildId' IS DISTINCT FROM b.manifest->>'applicationBuildId'
   OR p_runtime->>'databaseSchemaVersion' IS DISTINCT FROM b.manifest->>'databaseSchemaVersion'
   OR p_runtime->>'servingContract' IS DISTINCT FROM b.manifest->>'servingContract'
   OR p_runtime->>'retrievalVersion' IS DISTINCT FROM b.manifest->>'retrievalVersion'
   OR p_runtime->'channelAdapterVersions' IS DISTINCT FROM b.manifest->'channelAdapterVersions'
 THEN RAISE EXCEPTION 'ROLLBACK_RUNTIME_INCOMPATIBLE'; END IF;
 expected_members:=jsonb_array_length(k.manifest->'members');
 SELECT count(*) INTO actual_members FROM "KnowledgeReleaseMember" WHERE ("propertyId","releaseArtifactId")=(p_property,p_target_knowledge);
 IF expected_members=0 OR actual_members<>expected_members OR EXISTS(
   SELECT 1 FROM jsonb_array_elements(k.manifest->'members') x WHERE NOT EXISTS(
     SELECT 1 FROM "KnowledgeReleaseMember" m
     JOIN "KnowledgeSource" s ON (s."propertyId",s.id)=(m."propertyId",m."sourceId")
     JOIN "KnowledgeSourceRevision" sr ON (sr."propertyId",sr."sourceId",sr.id)=(m."propertyId",m."sourceId",m."sourceRevisionId")
     JOIN "WebsiteSourceConsent" c ON (c."propertyId",c."sourceId",c.id)=(sr."propertyId",sr."sourceId",sr."consentId")
     LEFT JOIN "SourceCapture" sc ON (sc."propertyId",sc."sourceId",sc."sourceRevisionId",sc.id)=(m."propertyId",m."sourceId",m."sourceRevisionId",m."captureId")
     LEFT JOIN "CaptureVersion" cv ON (cv."propertyId",cv."captureId",cv.id)=(m."propertyId",m."captureId",m."captureVersionId")
     LEFT JOIN "KnowledgeObject" ko ON (ko."propertyId",ko.id)=(cv."propertyId",cv."objectId")
     WHERE (m."propertyId",m."releaseArtifactId")=(p_property,p_target_knowledge)
       AND m."sourceId"=x->>'sourceId' AND m."sourceRevisionId"=x->>'sourceRevisionId'
       AND m."sourceType"::text=x->>'sourceType' AND m."contentDigest"=x->>'contentDigest' AND m."authorityRank"=(x->>'authorityRank')::int
       AND m."captureId" IS NOT DISTINCT FROM nullif(x->>'captureId','') AND m."captureVersionId" IS NOT DISTINCT FROM nullif(x->>'captureVersionId','')
       AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
       AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL
       AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp()
       AND c."authorityScope" @> '{"capture":true}'::jsonb AND c."audienceCeiling"='PUBLIC'
       AND ((m."sourceType" IN ('FORM','OWNER_CORRECTION') AND m."captureId" IS NULL AND sr."configurationHash"=m."contentDigest")
         OR (m."sourceType" NOT IN ('FORM','OWNER_CORRECTION') AND sc.status='SUCCEEDED' AND cv.checksum=m."contentDigest" AND ko.state='USABLE' AND ko."payloadDisposedAt" IS NULL))
   )
 ) THEN RAISE EXCEPTION 'ROLLBACK_MIXED_SOURCE_INCOMPATIBLE'; END IF;
 UPDATE "KnowledgeReleaseActivePointer" SET "releaseArtifactId"=p_target_knowledge,"pointerGeneration"="pointerGeneration"+1,"updatedBy"=p_actor,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "pointerGeneration"=p_expected_knowledge_generation RETURNING "pointerGeneration" INTO kg;
 IF NOT FOUND THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_POINTER_STALE'; END IF;
 UPDATE "BotReleasePointer" SET "releaseArtifactId"=p_target_bot,"pointerGeneration"="pointerGeneration"+1,"updatedBy"=p_actor,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "pointerGeneration"=p_expected_bot_generation RETURNING "pointerGeneration" INTO bg;
 IF NOT FOUND THEN RAISE EXCEPTION 'BOT_RELEASE_POINTER_STALE'; END IF;
 UPDATE "KnowledgeReleaseArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE';
 UPDATE "KnowledgeReleaseArtifact" SET state='ACTIVE' WHERE ("propertyId",id)=(p_property,p_target_knowledge);
 UPDATE "BotReleaseArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE';
 UPDATE "BotReleaseArtifact" SET state='ACTIVE',"activatedAt"=coalesce("activatedAt",clock_timestamp()) WHERE ("propertyId",id)=(p_property,p_target_bot);
 UPDATE "BotMachinePolicyArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE' AND id<>b."policyArtifactId";
 UPDATE "BotMachinePolicyArtifact" SET state='ACTIVE',"activatedAt"=coalesce("activatedAt",clock_timestamp()) WHERE ("propertyId",id)=(p_property,b."policyArtifactId");
 RETURN jsonb_build_object('knowledgeGeneration',kg,'botGeneration',bg,'knowledgeReleaseId',k."releaseId",'botReleaseId',b."releaseId");
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.rollback_knowledge_release(text,text,text,bigint,bigint,jsonb,text) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.rollback_knowledge_release(text,text,text,bigint,bigint,jsonb,text) TO aifrogi_publisher;
