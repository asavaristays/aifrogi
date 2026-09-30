-- Bridge owner-approved legacy entries into the canonical P2-B authority.
-- All writes remain behind a SECURITY DEFINER routine and an exact publisher grant.

CREATE OR REPLACE FUNCTION aifrogi_security.provision_knowledge_publisher(
  p_property text,
  p_principal text,
  p_actor text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF session_user<>'leados_app' OR NOT aifrogi_security.has_platform_authority() THEN
    RAISE EXCEPTION 'PLATFORM_AUTHORITY_REQUIRED';
  END IF;
  IF p_property IS NULL OR p_principal IS NULL OR btrim(p_principal)='' THEN RAISE EXCEPTION 'PUBLISHER_IDENTITY_REQUIRED'; END IF;
  PERFORM 1 FROM public."Property" WHERE id=p_property;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROPERTY_NOT_FOUND'; END IF;
  INSERT INTO public."KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose,"createdAt")
  VALUES(gen_random_uuid()::text,p_property,lower(p_principal),'aifrogi_publisher','KNOWLEDGE_PUBLISH',clock_timestamp())
  ON CONFLICT ("propertyId","principalId","databaseRole",purpose)
  DO UPDATE SET "revokedAt"=NULL,"expiresAt"=NULL;
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.provision_knowledge_publisher(text,text,text) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.provision_knowledge_publisher(text,text,text) TO leados_app;

CREATE OR REPLACE FUNCTION aifrogi_security.canonical_publication_status(p_property text)
RETURNS TABLE(publication_id text,pointer_generation bigint,claim_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF session_user<>'leados_app' OR NOT aifrogi_security.has_platform_authority() THEN RAISE EXCEPTION 'PLATFORM_AUTHORITY_REQUIRED'; END IF;
  RETURN QUERY
  SELECT sp."publicationId",sp."pointerGeneration",count(pc.id)::bigint
    FROM public."KnowledgeServingPointer" sp
    JOIN public."KnowledgePublication" p ON (p."propertyId",p.audience,p.id)=(sp."propertyId",sp.audience,sp."publicationId")
    JOIN public."KnowledgePublicationClaim" pc ON pc."propertyId"=p."propertyId" AND pc."publicationId"=p.id
   WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND p.state='SEALED' AND p."revokedAt" IS NULL
   GROUP BY sp."publicationId",sp."pointerGeneration";
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.canonical_publication_status(text) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.canonical_publication_status(text) TO leados_app;

CREATE OR REPLACE FUNCTION aifrogi_security.publish_owner_approved_entries(
  p_property text,
  p_actor text,
  p_entry_ids text[]
) RETURNS TABLE(publication_id text, pointer_generation bigint, claim_count int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  now_at timestamptz := clock_timestamp();
  policy_id text;
  policy_version text;
  generation bigint;
  source_id text;
  consent_id text;
  source_revision_id text;
  capture_id text;
  finalize_job_id text;
  object_id text;
  capture_version_id text;
  approval_id text := gen_random_uuid()::text;
  publication text := gen_random_uuid()::text;
  source_identity text;
  source_hash text;
  snapshot jsonb;
  snapshot_hash text;
  members jsonb;
  publication_manifest jsonb;
  publication_hash text;
  expected_pointer bigint;
  entry_row public."KnowledgeEntry"%ROWTYPE;
  identity_id text;
  evidence_id text;
  seal_hash text;
  total int;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  IF cardinality(p_entry_ids) IS NULL OR cardinality(p_entry_ids)=0 THEN RAISE EXCEPTION 'NO_APPROVED_ENTRIES'; END IF;
  IF cardinality(p_entry_ids)<>cardinality(ARRAY(SELECT DISTINCT x FROM unnest(p_entry_ids) x)) THEN RAISE EXCEPTION 'DUPLICATE_ENTRY_ID'; END IF;

  SELECT count(*) INTO total FROM public."KnowledgeEntry"
   WHERE "propertyId"=p_property AND id=ANY(p_entry_ids) AND status='PUBLISHED'
     AND "previewApprovedAt" IS NOT NULL AND "previewApprovedBy" IS NOT NULL
     AND "conflictStatus"='CLEAR' AND ("expiresAt" IS NULL OR "expiresAt">now_at);
  IF total<>cardinality(p_entry_ids) THEN RAISE EXCEPTION 'ENTRY_NOT_OWNER_APPROVED_OR_CURRENT'; END IF;

  SELECT sp."publicationId",sp."pointerGeneration" INTO publication_id,pointer_generation
    FROM public."KnowledgeServingPointer" sp
    JOIN public."KnowledgePublication" p ON (p."propertyId",p.audience,p.id)=(sp."propertyId",sp.audience,sp."publicationId")
   WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND p.state='SEALED' AND p."revokedAt" IS NULL
     AND (SELECT array_agg(pc."entryId" ORDER BY pc."entryId") FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p.id)
         = (SELECT array_agg(x ORDER BY x) FROM unnest(p_entry_ids) x);
  IF FOUND THEN claim_count:=cardinality(p_entry_ids); RETURN NEXT; RETURN; END IF;

  SELECT pip."currentPolicyVersionId",pv.version::text,pip."eligibilityGeneration"
    INTO policy_id,policy_version,generation
    FROM public."PropertyIntelligencePolicy" pip
    JOIN public."KnowledgePolicyVersion" pv ON (pv."propertyId",pv.id)=(pip."propertyId",pip."currentPolicyVersionId")
   WHERE pip."propertyId"=p_property AND pv.mode='CLAIMS_ONLY' FOR UPDATE OF pip;
  IF NOT FOUND THEN
    policy_id:=gen_random_uuid()::text; policy_version:='1'; generation:=1;
    INSERT INTO public."KnowledgePolicyVersion"(id,"propertyId",version,mode,owner,"publicationAutomation","freshnessRules","evidenceRules","policyHash","createdAt")
    VALUES(policy_id,p_property,1,'CLAIMS_ONLY',p_actor,false,'{"maxAgeDays":3650}'::jsonb,'{"ownerApproved":true,"fullStatementCoverage":true}'::jsonb,
      aifrogi_security.hash_json(jsonb_build_object('mode','CLAIMS_ONLY','owner',p_actor,'version',1)),now_at);
    INSERT INTO public."PropertyIntelligencePolicy"("propertyId","currentPolicyVersionId","eligibilityGeneration","reviewRequired","updatedAt")
    VALUES(p_property,policy_id,1,true,now_at);
  END IF;

  snapshot:=(SELECT jsonb_agg(jsonb_build_object('id',id,'question',question,'answer',answer,'approvedBy',"previewApprovedBy",'approvedAt',"previewApprovedAt") ORDER BY id)
              FROM public."KnowledgeEntry" WHERE "propertyId"=p_property AND id=ANY(p_entry_ids));
  snapshot_hash:=aifrogi_security.hash_json(snapshot);
  source_identity:='owner-approved-form:'||p_property||':'||snapshot_hash;
  source_hash:=encode(public.digest(convert_to(source_identity,'UTF8'),'sha256'),'hex');

  SELECT id INTO source_id FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND "sourceType"='FORM' AND "canonicalIdentityHash"=source_hash FOR UPDATE;
  IF source_id IS NULL THEN
    source_id:=gen_random_uuid()::text;
    INSERT INTO public."KnowledgeSource"(id,"propertyId","sourceType","canonicalIdentity","canonicalIdentityHash",state,"audienceCeiling","currentRevision","createdAt","updatedAt")
    VALUES(source_id,p_property,'FORM',source_identity,source_hash,'AUTHORIZED','PUBLIC',0,now_at,now_at);
  END IF;

  consent_id:=gen_random_uuid()::text;
  INSERT INTO public."WebsiteSourceConsent"(id,"propertyId","termsVersion",status,"trialAuthorizedAt","trialExpiresAt","acceptedByEmail","postTrialMethod","postTrialApprovedBy","postTrialApprovedAt","approvalEvidenceRef","createdAt","updatedAt","sourceType","canonicalIdentity","canonicalIdentityHash","sourceId","authorityScope","audienceCeiling","effectiveFrom","effectiveUntil")
  VALUES(consent_id,p_property,'OWNER_FORM_V1','POST_TRIAL_APPROVED',now_at,now_at+interval '100 years',p_actor,'EMAIL',p_actor,now_at,'legacy-preview-approval',now_at,now_at,'FORM',source_identity,source_hash,source_id,'{"capture":true,"publish":true}'::jsonb,'PUBLIC',now_at,now_at+interval '100 years');
  UPDATE public."KnowledgeSource" SET "currentRevision"="currentRevision"+1,state='AUTHORIZED',"revokedAt"=NULL,"updatedAt"=now_at WHERE id=source_id RETURNING "currentRevision" INTO total;
  source_revision_id:=gen_random_uuid()::text;
  INSERT INTO public."KnowledgeSourceRevision"(id,"propertyId","sourceId",revision,configuration,"configurationHash","consentId","createdBy","createdAt")
  VALUES(source_revision_id,p_property,source_id,total,jsonb_build_object('kind','OWNER_APPROVED_FORM','snapshotHash',snapshot_hash),snapshot_hash,consent_id,p_actor,now_at);
  capture_id:=gen_random_uuid()::text;
  INSERT INTO public."SourceCapture"(id,"propertyId","sourceId","sourceRevisionId","requestedGeneration","operationKey",status,"requestedAt","startedAt","completedAt")
  VALUES(capture_id,p_property,source_id,source_revision_id,generation,'owner-form:'||p_property||':'||snapshot_hash,'SUCCEEDED',now_at,now_at,now_at);
  finalize_job_id:=gen_random_uuid()::text;
  INSERT INTO public."AutomationJob"(id,"propertyId","workflowId","workflowVersion","triggerType","actionType",status,priority,payload,result,"idempotencyKey","scheduledFor","nextRunAt","maxAttempts","attemptCount","createdBy","completedAt","createdAt","updatedAt","operationKey","operationType","operationVersion","inputGeneration","canonicalInputHash","fencingToken")
  VALUES(finalize_job_id,p_property,'OWNER_APPROVED_FORM',1,'OWNER_APPROVAL','CANONICALIZE_FORM','COMPLETED',5,jsonb_build_object('snapshotHash',snapshot_hash),jsonb_build_object('verified',true),'owner-form-finalize:'||snapshot_hash,now_at,now_at,1,1,p_actor,now_at,now_at,now_at,'owner-form-finalize:'||snapshot_hash,'KNOWLEDGE_FINALIZE',1,generation,snapshot_hash,1);
  object_id:=gen_random_uuid()::text;
  INSERT INTO public."KnowledgeObject"(id,"propertyId","storageNamespace","objectKey",checksum,"byteSize","mediaType",state,"stagingTokenHash","finalizedByJobId","finalizedFence","retainUntil","legalHold","createdAt","usableAt")
  VALUES(object_id,p_property,'database-owner-form','owner-form/'||snapshot_hash,snapshot_hash,octet_length(snapshot::text),'application/json','USABLE',snapshot_hash,finalize_job_id,1,now_at+interval '7 years',false,now_at,now_at);
  INSERT INTO public."KnowledgeObjectReference"(id,"propertyId","objectId","sourceId",purpose,"retainUntil","legalHold","createdAt")
  VALUES(gen_random_uuid()::text,p_property,object_id,source_id,'OWNER_APPROVED_EVIDENCE',now_at+interval '7 years',false,now_at);
  capture_version_id:=gen_random_uuid()::text;
  INSERT INTO public."CaptureVersion"(id,"propertyId","captureId","objectId",checksum,manifest,"capturedAt","createdAt")
  VALUES(capture_version_id,p_property,capture_id,object_id,snapshot_hash,jsonb_build_object('canonicalizer','PG14_JSONB_V1','snapshot',snapshot),now_at,now_at);

  FOREACH identity_id IN ARRAY p_entry_ids LOOP
    SELECT * INTO STRICT entry_row FROM public."KnowledgeEntry" WHERE "propertyId"=p_property AND id=identity_id FOR UPDATE;
    IF entry_row."sealedAt" IS NULL THEN
      INSERT INTO public."KnowledgeClaimIdentity"(id,"propertyId","stableKey","entityKey","fieldKey",qualifiers,"keyVersion","createdAt")
      VALUES(gen_random_uuid()::text,p_property,COALESCE(entry_row."claimKey",entry_row.id),'business',COALESCE(entry_row."claimKey",entry_row.id),jsonb_build_object('question',entry_row.question),1,now_at)
      ON CONFLICT ("propertyId","stableKey") DO UPDATE SET "stableKey"=EXCLUDED."stableKey" RETURNING id INTO identity_id;
      UPDATE public."KnowledgeEntry" SET "claimIdentityId"=identity_id,"revisionNumber"=entry_row.version,
        "normalizedValue"=jsonb_build_object('answer',entry_row.answer),"valueHash"=aifrogi_security.hash_json(jsonb_build_object('answer',entry_row.answer)),
        "quoteText"=entry_row.answer,audience='PUBLIC',"effectiveFrom"=COALESCE(entry_row."effectiveAt",now_at),"effectiveUntil"=entry_row."expiresAt",
        "verificationStatus"='SUPPORTED',"revisionState"='DRAFT',"requiredComponents"=ARRAY['answer'],"updatedAt"=now_at
       WHERE "propertyId"=p_property AND id=entry_row.id;
      evidence_id:=gen_random_uuid()::text;
      INSERT INTO public."KnowledgeClaimEvidence"(id,"propertyId","entryId","captureVersionId",locator,"locatorHash",quotation,"quotationHash","supportedComponents","bindingHash","createdAt")
      VALUES(evidence_id,p_property,entry_row.id,capture_version_id,jsonb_build_object('entryId',entry_row.id),aifrogi_security.hash_json(jsonb_build_object('entryId',entry_row.id)),entry_row.answer,
        encode(public.digest(convert_to(entry_row.answer,'UTF8'),'sha256'),'hex'),ARRAY['answer'],aifrogi_security.hash_json(jsonb_build_object('entryId',entry_row.id,'snapshotHash',snapshot_hash)),now_at);
      INSERT INTO public."KnowledgeRevisionEvidenceBinding"(id,"propertyId","entryId","evidenceId","bindingHash","createdAt")
      VALUES(gen_random_uuid()::text,p_property,entry_row.id,evidence_id,aifrogi_security.hash_json(jsonb_build_object('entryId',entry_row.id,'evidenceId',evidence_id)),now_at);
      seal_hash:=aifrogi_security.seal_claim_revision(p_property,entry_row.id,p_actor,policy_version);
    END IF;
  END LOOP;

  SELECT jsonb_agg(jsonb_build_object('claimIdentityId',e."claimIdentityId",'entryId',e.id,'sealManifestHash',e."sealManifestHash") ORDER BY e."claimIdentityId",e.id)
    INTO members FROM public."KnowledgeEntry" e WHERE e."propertyId"=p_property AND e.id=ANY(p_entry_ids);
  publication_manifest:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',p_property,'audience','PUBLIC','policyVersion',policy_version,'evidencePolicyVersion','OWNER_FORM_V1','approvalId',approval_id,'claims',members);
  publication_hash:=aifrogi_security.hash_json(publication_manifest);
  INSERT INTO public."KnowledgeApprovalEvidence"(id,"propertyId",purpose,decision,"scopeManifest","scopeHash",audience,"policyVersion","actorId","actorEmailHash",authority,"decidedAt")
  VALUES(approval_id,p_property,'PUBLICATION_AUTHORIZATION','APPROVED',publication_manifest,publication_hash,'PUBLIC',policy_version,p_actor,encode(public.digest(convert_to(lower(p_actor),'UTF8'),'sha256'),'hex'),'OWNER_PREVIEW_APPROVAL',now_at);
  INSERT INTO public."KnowledgePublication"(id,"propertyId",audience,"manifestHash","policyVersion","evidencePolicyVersion","approvalId",state,"createdAt")
  VALUES(publication,p_property,'PUBLIC',publication_hash,policy_version,'OWNER_FORM_V1',approval_id,'CANDIDATE',now_at);
  INSERT INTO public."KnowledgePublicationClaim"(id,"propertyId","publicationId","claimIdentityId","entryId","sealManifestHash","createdAt")
  SELECT gen_random_uuid()::text,p_property,publication,e."claimIdentityId",e.id,e."sealManifestHash",now_at FROM public."KnowledgeEntry" e WHERE e."propertyId"=p_property AND e.id=ANY(p_entry_ids);
  PERFORM aifrogi_security.seal_publication(p_property,publication,p_actor,generation);
  SELECT COALESCE("pointerGeneration",0) INTO expected_pointer FROM public."KnowledgeServingPointer" WHERE "propertyId"=p_property AND audience='PUBLIC' FOR UPDATE;
  pointer_generation:=aifrogi_security.advance_serving_pointer(p_property,'PUBLIC',publication,COALESCE(expected_pointer,0),p_actor);
  publication_id:=publication; claim_count:=cardinality(p_entry_ids); RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.publish_owner_approved_entries(text,text,text[]) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,leados_app;
GRANT EXECUTE ON FUNCTION aifrogi_security.publish_owner_approved_entries(text,text,text[]) TO aifrogi_publisher;
