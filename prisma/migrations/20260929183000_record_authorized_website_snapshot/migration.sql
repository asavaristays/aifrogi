CREATE OR REPLACE FUNCTION aifrogi_security.record_authorized_website_snapshot(
  p_property text,
  p_job text,
  p_principal text,
  p_snapshot jsonb
) RETURNS TABLE(capture_id text, object_id text, capture_version_id text, page_count int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  now_at timestamptz := clock_timestamp();
  job_row public."AutomationJob"%ROWTYPE;
  source_row public."KnowledgeSource"%ROWTYPE;
  consent_row public."WebsiteSourceConsent"%ROWTYPE;
  revision_id text;
  snapshot_hash text;
  generation bigint;
  revision_number int;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_principal);
  IF jsonb_typeof(p_snapshot)<>'object' OR jsonb_typeof(p_snapshot->'pages')<>'array' THEN
    RAISE EXCEPTION 'WEBSITE_SNAPSHOT_INVALID';
  END IF;

  SELECT * INTO STRICT job_row FROM public."AutomationJob"
   WHERE id=p_job AND "propertyId"=p_property AND "actionType"='CAPTURE_AUTHORIZED_WEBSITE'
     AND status IN ('RUNNING','SUCCEEDED') FOR SHARE;
  IF job_row.status='RUNNING' AND job_row."leaseExpiresAt"<=now_at THEN RAISE EXCEPTION 'WEBSITE_CAPTURE_LEASE_EXPIRED'; END IF;

  SELECT * INTO STRICT source_row FROM public."KnowledgeSource"
   WHERE "propertyId"=p_property AND "sourceType"='WEBSITE' AND state='AUTHORIZED' AND "revokedAt" IS NULL FOR UPDATE;
  SELECT * INTO STRICT consent_row FROM public."WebsiteSourceConsent"
   WHERE "propertyId"=p_property AND "sourceId"=source_row.id
     AND status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND "revokedAt" IS NULL
     AND COALESCE("effectiveFrom","trialAuthorizedAt")<=now_at
     AND COALESCE("effectiveUntil","trialExpiresAt")>now_at
     AND "authorityScope" @> '{"capture":true}'::jsonb
   ORDER BY "createdAt" DESC LIMIT 1 FOR SHARE;

  snapshot_hash:=aifrogi_security.hash_json(p_snapshot);
  SELECT cv."captureId",cv."objectId",cv.id,jsonb_array_length(p_snapshot->'pages')
    INTO capture_id,object_id,capture_version_id,page_count
    FROM public."CaptureVersion" cv
    JOIN public."SourceCapture" sc ON (sc."propertyId",sc.id)=(cv."propertyId",cv."captureId")
   WHERE cv."propertyId"=p_property AND sc."operationKey"='website-crawl:'||p_job AND cv.checksum=snapshot_hash;
  IF FOUND THEN RETURN NEXT; RETURN; END IF;

  SELECT COALESCE("eligibilityGeneration",1) INTO generation
    FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
  SELECT GREATEST(COALESCE(generation,1),COALESCE(max("requestedGeneration")+1,1)) INTO generation
    FROM public."SourceCapture" WHERE "propertyId"=p_property AND "sourceId"=source_row.id;
  revision_number:=source_row."currentRevision"+1;
  revision_id:=gen_random_uuid()::text;
  INSERT INTO public."KnowledgeSourceRevision"(id,"propertyId","sourceId",revision,configuration,"configurationHash","consentId","createdBy","createdAt")
  VALUES(revision_id,p_property,source_row.id,revision_number,
    jsonb_build_object('kind','AUTHORIZED_WEBSITE_CRAWL','baseUrl',p_snapshot->>'baseUrl','snapshotHash',snapshot_hash,'jobId',p_job),
    snapshot_hash,consent_row.id,p_principal,now_at);
  UPDATE public."KnowledgeSource" SET "currentRevision"=revision_number,"updatedAt"=now_at WHERE id=source_row.id;

  capture_id:=gen_random_uuid()::text;
  INSERT INTO public."SourceCapture"(id,"propertyId","sourceId","sourceRevisionId","requestedGeneration","operationKey",status,"requestedAt","startedAt","completedAt")
  VALUES(capture_id,p_property,source_row.id,revision_id,generation,'website-crawl:'||p_job,'SUCCEEDED',job_row."createdAt",job_row."lockedAt",now_at);
  object_id:=gen_random_uuid()::text;
  INSERT INTO public."KnowledgeObject"(id,"propertyId","storageNamespace","objectKey",checksum,"byteSize","mediaType",state,"stagingTokenHash","finalizedByJobId","finalizedFence","retainUntil","legalHold","createdAt","usableAt")
  VALUES(object_id,p_property,'database-authorized-website','website/'||snapshot_hash,snapshot_hash,
    octet_length(convert_to(p_snapshot::text,'UTF8')),'application/json','USABLE',snapshot_hash,p_job,GREATEST(job_row."attemptCount",1),
    consent_row."effectiveUntil",false,now_at,now_at);
  INSERT INTO public."KnowledgeObjectReference"(id,"propertyId","objectId","sourceId",purpose,"retainUntil","legalHold","createdAt")
  VALUES(gen_random_uuid()::text,p_property,object_id,source_row.id,'AUTHORIZED_WEBSITE_CAPTURE',consent_row."effectiveUntil",false,now_at);
  capture_version_id:=gen_random_uuid()::text;
  INSERT INTO public."CaptureVersion"(id,"propertyId","captureId","objectId",checksum,manifest,"capturedAt","createdAt")
  VALUES(capture_version_id,p_property,capture_id,object_id,snapshot_hash,
    jsonb_build_object('canonicalizer','PG14_JSONB_V1','snapshot',p_snapshot,'sourceUrl',source_row."canonicalIdentity",'consentId',consent_row.id,'jobId',p_job),
    COALESCE((p_snapshot->>'crawledAt')::timestamptz,now_at),now_at);
  page_count:=jsonb_array_length(p_snapshot->'pages');
  RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.record_authorized_website_snapshot(text,text,text,jsonb)
  FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.record_authorized_website_snapshot(text,text,text,jsonb) TO aifrogi_worker;
