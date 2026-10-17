-- Narrow owner review/capture bridge. No public-source or publication authority is granted here.
CREATE FUNCTION aifrogi_security.begin_owner_website_capture(p_property text,p_actor text,p_job text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE matches integer;
BEGIN
 IF NOT aifrogi_security.rag_owner_authorized(p_property,p_actor) THEN RAISE EXCEPTION 'OWNER_AUTHORITY_REQUIRED'; END IF;
 IF p_job IS NULL OR length(p_job)<20 THEN RAISE EXCEPTION 'CAPTURE_REQUEST_ID_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('owner-capture:'||p_property,0));
 IF EXISTS(SELECT 1 FROM "AutomationJob" WHERE "propertyId"=p_property AND "actionType"='CAPTURE_AUTHORIZED_WEBSITE' AND status='RUNNING' AND "leaseExpiresAt">clock_timestamp()) THEN RAISE EXCEPTION 'WEBSITE_CAPTURE_ALREADY_RUNNING'; END IF;
 SELECT count(DISTINCT s.id) INTO matches FROM "KnowledgeSource" s JOIN "WebsiteSourceConsent" c ON(c."propertyId",c."sourceId",c."canonicalIdentityHash")=(s."propertyId",s.id,s."canonicalIdentityHash")
 WHERE s."propertyId"=p_property AND s."sourceType"='WEBSITE' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
 AND c.status IN('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND c."authorityScope" @> '{"capture":true}'::jsonb
 AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp();
 IF matches<>1 THEN RAISE EXCEPTION 'CURRENT_WEBSITE_CAPTURE_AUTHORIZATION_REQUIRED'; END IF;
 INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose,"expiresAt")
 VALUES(gen_random_uuid()::text,p_property,'website-capture-worker','aifrogi_worker','KNOWLEDGE_CAPTURE',clock_timestamp()+interval '30 minutes')
 ON CONFLICT("propertyId","principalId","databaseRole",purpose) DO UPDATE SET "revokedAt"=NULL,"expiresAt"=clock_timestamp()+interval '30 minutes';
 INSERT INTO "AutomationJob"(id,"propertyId","workflowId","triggerType","actionType",status,payload,"idempotencyKey","lockedBy","lockedAt","leaseExpiresAt","attemptCount","maxAttempts","createdBy","updatedAt")
 VALUES(p_job,p_property,'business-website-review','OWNER_REVIEW','CAPTURE_AUTHORIZED_WEBSITE','RUNNING','{}','business-capture:'||p_job,p_job,clock_timestamp(),clock_timestamp()+interval '30 minutes',1,1,p_actor,clock_timestamp());
 RETURN p_job;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.begin_owner_website_capture(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.begin_owner_website_capture(text,text,text) TO leados_app;

CREATE FUNCTION aifrogi_security.worker_capture_source(p_property text)
RETURNS TABLE(source_url text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE matches integer;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],'website-capture-worker');
 SELECT count(DISTINCT s.id) INTO matches FROM "KnowledgeSource" s JOIN "WebsiteSourceConsent" c ON(c."propertyId",c."sourceId",c."canonicalIdentityHash")=(s."propertyId",s.id,s."canonicalIdentityHash")
 WHERE s."propertyId"=p_property AND s."sourceType"='WEBSITE' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
 AND c.status IN('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND c."authorityScope" @> '{"capture":true}'::jsonb
 AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp();
 IF matches<>1 THEN RAISE EXCEPTION 'CURRENT_WEBSITE_CAPTURE_AUTHORIZATION_REQUIRED'; END IF;
 RETURN QUERY SELECT DISTINCT s."canonicalIdentity" FROM "KnowledgeSource" s JOIN "WebsiteSourceConsent" c ON(c."propertyId",c."sourceId",c."canonicalIdentityHash")=(s."propertyId",s.id,s."canonicalIdentityHash")
 WHERE s."propertyId"=p_property AND s."sourceType"='WEBSITE' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
 AND c.status IN('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND c."authorityScope" @> '{"capture":true}'::jsonb
 AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp();
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.worker_capture_source(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.worker_capture_source(text) TO aifrogi_worker;

CREATE FUNCTION aifrogi_security.owner_crawl_review_rows(p_property text,p_actor text)
RETURNS TABLE(id text,"propertyId" text,"generationId" text,content text,url text,title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT aifrogi_security.rag_owner_authorized(p_property,p_actor) THEN RAISE EXCEPTION 'OWNER_AUTHORITY_REQUIRED'; END IF;
 RETURN QUERY SELECT ch.id,ch."propertyId",ch."generationId",ch.content,p.url,p.title
 FROM "WebsiteCrawlGeneration" g
 JOIN "WebsiteCrawlPage" p ON(p."propertyId",p."generationId")=(g."propertyId",g.id)
 JOIN "WebsiteCrawlChunk" ch ON(ch."propertyId",ch."generationId",ch."pageId")=(p."propertyId",p."generationId",p.id)
 JOIN "CaptureVersion" cv ON(cv."propertyId",cv.id)=(g."propertyId",g."captureVersionId")
 JOIN "SourceCapture" sc ON(sc."propertyId",sc.id)=(cv."propertyId",cv."captureId")
 JOIN "KnowledgeSource" s ON(s."propertyId",s.id)=(sc."propertyId",sc."sourceId")
 JOIN "KnowledgeSourceRevision" sr ON(sr."propertyId",sr.id,sr."sourceId")=(sc."propertyId",sc."sourceRevisionId",s.id)
 JOIN "WebsiteSourceConsent" c ON(c."propertyId",c.id,c."sourceId")=(sr."propertyId",sr."consentId",s.id)
 WHERE g."propertyId"=p_property AND g.status='ACTIVE' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL AND sc.status='SUCCEEDED'
 AND c.status IN('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND c."authorityScope" @> '{"capture":true}'::jsonb
 AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp()
 ORDER BY p.url,ch.ordinal LIMIT 2001 FOR SHARE OF g,s,c;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.owner_crawl_review_rows(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.owner_crawl_review_rows(text,text) TO leados_app;
