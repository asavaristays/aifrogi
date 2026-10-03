CREATE OR REPLACE FUNCTION aifrogi_security.shared_answer_generation_authorized(p_property text, p_generation text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
 SELECT EXISTS(SELECT 1 FROM "WebsiteCrawlGeneration" g
 JOIN "CaptureVersion" cv ON(cv."propertyId",cv.id)=(g."propertyId",g."captureVersionId")
 JOIN "KnowledgeObject" ko ON(ko."propertyId",ko.id)=(cv."propertyId",cv."objectId") AND ko.state='USABLE'
 JOIN "SourceCapture" sc ON(sc."propertyId",sc.id)=(cv."propertyId",cv."captureId") AND sc.status='SUCCEEDED'
 JOIN "KnowledgeSource" s ON(s."propertyId",s.id)=(sc."propertyId",sc."sourceId") AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
 JOIN "KnowledgeSourceRevision" sr ON(sr."propertyId",sr.id,sr."sourceId")=(sc."propertyId",sc."sourceRevisionId",sc."sourceId")
 JOIN "WebsiteSourceConsent" con ON(con."propertyId",con.id,con."sourceId")=(sr."propertyId",sr."consentId",sr."sourceId")
 WHERE g."propertyId"=p_property AND g.id=p_generation AND con.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND con."revokedAt" IS NULL
 AND coalesce(con."effectiveFrom",con."trialAuthorizedAt")<=clock_timestamp() AND coalesce(con."effectiveUntil",con."trialExpiresAt")>clock_timestamp()
 AND con."authorityScope" @> '{"capture":true}'::jsonb AND con."audienceCeiling"='PUBLIC'
 AND con."canonicalIdentityHash"=s."canonicalIdentityHash" AND con."sourceType"=s."sourceType"
 AND cv."capturedAt">=statement_timestamp()-(coalesce((SELECT (kp."freshnessRules"->>'maxAgeDays')::int FROM "PropertyIntelligencePolicy" ip JOIN "KnowledgePolicyVersion" kp ON(kp."propertyId",kp.id)=(ip."propertyId",ip."currentPolicyVersionId") WHERE ip."propertyId"=p_property),30)*interval '1 day'));

$$;
CREATE OR REPLACE FUNCTION aifrogi_security.shared_answer_semantic_chunks(p_property text, p_generation text, p_query double precision[], p_limit integer) RETURNS TABLE(generation_id text, page_id text, chunk_id text, url text, title text, content text, rank real)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
 IF NOT aifrogi_security.shared_answer_generation_authorized(p_property,p_generation) THEN RAISE EXCEPTION 'SOURCE_NOT_AUTHORIZED'; END IF;
 IF cardinality(p_query)<>512 OR EXISTS(SELECT 1 FROM unnest(p_query) x WHERE x IS NULL OR x::text IN ('NaN','Infinity','-Infinity')) OR NOT EXISTS(SELECT 1 FROM unnest(p_query) x WHERE x<>0) THEN RAISE EXCEPTION 'QUERY_VECTOR_INVALID'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "WebsiteSemanticIndex" WHERE "propertyId"=p_property AND "generationId"=p_generation AND status='READY') THEN RAISE EXCEPTION 'SEMANTIC_INDEX_NOT_READY'; END IF;
 RETURN QUERY SELECT g.id,p.id,c.id,p.url,p.title,c.content,score.cosine::real
 FROM "WebsiteCrawlGeneration" g
 JOIN "CaptureVersion" cv ON(cv."propertyId",cv.id)=(g."propertyId",g."captureVersionId")
 JOIN "SourceCapture" sc ON(sc."propertyId",sc.id)=(cv."propertyId",cv."captureId")
 JOIN "KnowledgeSource" s ON(s."propertyId",s.id)=(sc."propertyId",sc."sourceId")
 JOIN "WebsiteCrawlChunk" c ON(c."propertyId",c."generationId")=(g."propertyId",g.id)
 JOIN "WebsiteCrawlPage" p ON(p."propertyId",p.id)=(c."propertyId",c."pageId")
 JOIN "WebsiteSemanticEmbedding" e ON(e."propertyId",e."generationId",e."chunkId",e."contentHash")=(c."propertyId",c."generationId",c.id,c."contentHash")
 CROSS JOIN LATERAL(SELECT sum(q.x*v.x)/nullif(sqrt(sum(q.x*q.x))*sqrt(sum(v.x*v.x)),0) cosine FROM unnest(p_query) WITH ORDINALITY q(x,n) JOIN unnest(e.embedding) WITH ORDINALITY v(x,n) USING(n)) score
 WHERE g."propertyId"=p_property AND g.id=p_generation AND g.status='ACTIVE' AND sc.status='SUCCEEDED' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
 ORDER BY score.cosine DESC,c.id LIMIT LEAST(GREATEST(p_limit,1),12);
END $$;
CREATE OR REPLACE FUNCTION aifrogi_security.shared_answer_configured_source(p_property text) RETURNS TABLE(source_url text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE matches int;
BEGIN
 IF session_user='aifrogi_worker' THEN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],NULL);
 ELSE
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
 END IF;
 SELECT count(DISTINCT s.id)::int INTO matches FROM "KnowledgeSource" s
 JOIN "WebsiteSourceConsent" c ON (c."propertyId",c."sourceId",c."canonicalIdentityHash")=(s."propertyId",s.id,s."canonicalIdentityHash")
 WHERE s."propertyId"=p_property AND s."sourceType"='WEBSITE' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL AND s."audienceCeiling"='PUBLIC'
 AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND c."audienceCeiling"='PUBLIC' AND c."authorityScope" @> '{"capture":true}'::jsonb
 AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp();
 IF matches<>1 THEN RAISE EXCEPTION 'CONFIGURED_SOURCE_UNAVAILABLE_OR_AMBIGUOUS'; END IF;
 RETURN QUERY SELECT DISTINCT s."canonicalIdentity" FROM "KnowledgeSource" s
 JOIN "WebsiteSourceConsent" c ON (c."propertyId",c."sourceId",c."canonicalIdentityHash")=(s."propertyId",s.id,s."canonicalIdentityHash")
 WHERE s."propertyId"=p_property AND s."sourceType"='WEBSITE' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL AND s."audienceCeiling"='PUBLIC'
 AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND c."audienceCeiling"='PUBLIC' AND c."authorityScope" @> '{"capture":true}'::jsonb
 AND coalesce(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND coalesce(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp();
END $$;
-- Derived indexes and delivery receipts only. Existing publication/consent is authority.
CREATE TABLE "RagClaimEmbedding" (
 "propertyId" text NOT NULL REFERENCES "Property"(id), "entryId" text NOT NULL,
 "sealHash" text NOT NULL, "contentHash" text NOT NULL, model text NOT NULL,
 embedding double precision[] NOT NULL CHECK(cardinality(embedding)=512),
 "indexedAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY("propertyId","entryId","sealHash",model),
 FOREIGN KEY("propertyId","entryId") REFERENCES "KnowledgeEntry"("propertyId",id)
);
CREATE TABLE "RagAnswerReceipt" (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,"propertyId" text NOT NULL REFERENCES "Property"(id),
 "conversationId" text NOT NULL,"deliveryKey" text NOT NULL,"snapshotHash" text NOT NULL,
 question text NOT NULL,answer text NOT NULL,"answerHash" text NOT NULL,evidence jsonb NOT NULL,
 claims jsonb NOT NULL,trace jsonb NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE("propertyId","deliveryKey")
);
REVOKE ALL ON "RagClaimEmbedding","RagAnswerReceipt" FROM PUBLIC,aifrogi_public,aifrogi_web,aifrogi_worker,aifrogi_publisher;

-- Internal authority catalog: no runtime role can call it directly.
CREATE FUNCTION aifrogi_security.rag_claim_catalog(p_property text)
RETURNS TABLE(entry_id text,content text,question text,title text,seal_hash text,field_key text,
 entity_key text,value_hash text,authority_rank integer,effective_from timestamptz,effective_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.id,e.answer,e.question,e.category,e."sealManifestHash",ci."fieldKey",ci."entityKey",e."valueHash",
 CASE e."authorityLevel" WHEN 'OWNER_CORRECTION' THEN 0 WHEN 'CLIENT_APPROVED_STRUCTURED' THEN 1 ELSE 2 END,
 COALESCE(e."effectiveFrom",e."effectiveAt",e."publishedAt"),COALESCE(e."effectiveUntil",e."expiresAt")
 FROM "KnowledgeServingPointer" sp
 JOIN "KnowledgePublication" p ON p."propertyId"=sp."propertyId" AND p.id=sp."publicationId" AND p.audience=sp.audience
 JOIN "KnowledgePublicationClaim" pc ON pc."propertyId"=p."propertyId" AND pc."publicationId"=p.id
 JOIN "KnowledgeEntry" e ON e."propertyId"=pc."propertyId" AND e.id=pc."entryId" AND e."sealManifestHash"=pc."sealManifestHash"
 JOIN "KnowledgeClaimIdentity" ci ON ci."propertyId"=e."propertyId" AND ci.id=e."claimIdentityId"
 JOIN "PropertyIntelligencePolicy" pip ON pip."propertyId"=e."propertyId"
 WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND p.state='SEALED' AND p."revokedAt" IS NULL
 AND e.status='PUBLISHED' AND e."pausedAt" IS NULL
 AND NOT EXISTS(SELECT 1 FROM "KnowledgeAnswerFlag" f WHERE f."propertyId"=p_property AND f."entryId"=e.id AND f.status IN ('OPEN','ACKNOWLEDGED'))
 AND (e."documentId" IS NULL OR EXISTS(SELECT 1 FROM "KnowledgeDocument" d WHERE d.id=e."documentId" AND d."propertyId"=p_property AND d.status='APPROVED'))
 AND (e."effectiveAt" IS NULL OR e."effectiveAt"<=clock_timestamp())
 AND (e."expiresAt" IS NULL OR e."expiresAt">clock_timestamp())
 AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),pip."eligibilityGeneration")
$$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_claim_catalog(text) FROM PUBLIC,aifrogi_public,aifrogi_web,aifrogi_worker,aifrogi_publisher;

CREATE FUNCTION aifrogi_security.rag_snapshot_internal(p_property text)
RETURNS TABLE(snapshot_hash text,crawl_generation text,claim_count bigint,knowledge_as_of timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH crawl AS (
 SELECT g.id FROM "WebsiteCrawlGeneration" g WHERE g."propertyId"=p_property AND g.status='ACTIVE'
 AND aifrogi_security.shared_answer_generation_authorized(p_property,g.id)
 ), claims AS (SELECT * FROM aifrogi_security.rag_claim_catalog(p_property))
 SELECT encode(public.digest(convert_to(jsonb_build_object(
 'property',p_property,'generation',(SELECT "eligibilityGeneration" FROM "PropertyIntelligencePolicy" WHERE "propertyId"=p_property),
 'crawl',(SELECT id FROM crawl),'claims',COALESCE((SELECT jsonb_agg(jsonb_build_array(entry_id,seal_hash) ORDER BY entry_id) FROM claims),'[]'::jsonb)
 )::text,'UTF8'),'sha256'),'hex'),(SELECT id FROM crawl),(SELECT count(*) FROM claims),
 (SELECT min(stamp) FROM (
 SELECT cv."capturedAt" stamp FROM "WebsiteCrawlGeneration" g JOIN "CaptureVersion" cv ON(cv."propertyId",cv.id)=(g."propertyId",g."captureVersionId") WHERE g.id=(SELECT id FROM crawl) AND g."propertyId"=p_property
 UNION ALL SELECT cv."capturedAt" FROM claims c JOIN "KnowledgeRevisionEvidenceBinding" b ON b."propertyId"=p_property AND b."entryId"=c.entry_id JOIN "KnowledgeClaimEvidence" ev ON(ev."propertyId",ev.id)=(b."propertyId",b."evidenceId") JOIN "CaptureVersion" cv ON(cv."propertyId",cv.id)=(ev."propertyId",ev."captureVersionId")
 ) dates)
$$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_snapshot_internal(text) FROM PUBLIC,aifrogi_public,aifrogi_web,aifrogi_worker,aifrogi_publisher;

CREATE FUNCTION aifrogi_security.rag_snapshot(p_property text)
RETURNS TABLE(snapshot_hash text,crawl_generation text,claim_count bigint,knowledge_as_of timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
 RETURN QUERY SELECT * FROM aifrogi_security.rag_snapshot_internal(p_property);
END $$;
GRANT EXECUTE ON FUNCTION aifrogi_security.rag_snapshot(text) TO aifrogi_public;
REVOKE ALL ON FUNCTION aifrogi_security.rag_snapshot(text) FROM PUBLIC;

CREATE FUNCTION aifrogi_security.rag_search_claims(p_property text,p_query text,p_vector double precision[] DEFAULT NULL,p_limit int DEFAULT 12)
RETURNS TABLE(entry_id text,content text,question text,title text,seal_hash text,field_key text,
 entity_key text,value_hash text,authority_rank integer,effective_from timestamptz,effective_until timestamptz,score double precision)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE query_ts tsquery;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
 IF p_vector IS NOT NULL AND (cardinality(p_vector)<>512 OR EXISTS(SELECT 1 FROM unnest(p_vector) x WHERE x IS NULL OR x::text IN ('NaN','Infinity','-Infinity')) OR NOT EXISTS(SELECT 1 FROM unnest(p_vector) x WHERE x<>0)) THEN RAISE EXCEPTION 'EMBEDDING_RESULT_INVALID'; END IF;
 SELECT to_tsquery('simple',string_agg(quote_literal(token),' | ')) INTO query_ts FROM
 (SELECT DISTINCT token FROM unnest(regexp_split_to_array(regexp_replace(lower(p_query),'[^a-z0-9 ]',' ','g'),E'\\s+')) token
 WHERE length(token)>2 AND token<>ALL(ARRAY['the','and','your','you','what','which','where','how','can','does','have','about','visitor','question','previous','current','follow'])) t;
 RETURN QUERY
 SELECT c.*,CASE WHEN p_vector IS NULL AND lower(p_query) ~ '\memail\M' AND c.content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' THEN 1::double precision WHEN p_vector IS NULL THEN ts_rank_cd(to_tsvector('simple',c.question||' '||c.title||' '||c.content),query_ts)::double precision ELSE sim.score END
 FROM aifrogi_security.rag_claim_catalog(p_property) c
 LEFT JOIN "RagClaimEmbedding" em ON em."propertyId"=p_property AND em."entryId"=c.entry_id AND em."sealHash"=c.seal_hash AND em.model='text-embedding-3-small'
 AND em."contentHash"=encode(public.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')
 LEFT JOIN LATERAL (
 SELECT sum(v*x)/NULLIF(sqrt(sum(v*v))*sqrt(sum(x*x)),0) score FROM unnest(em.embedding,p_vector) pair(v,x)
 ) sim ON p_vector IS NOT NULL
 WHERE CASE WHEN p_vector IS NULL THEN to_tsvector('simple',c.question||' '||c.title||' '||c.content)@@query_ts OR (lower(p_query) ~ '\memail\M' AND c.content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}') ELSE em."entryId" IS NOT NULL AND sim.score>=0.20 END
 ORDER BY 12 DESC,c.authority_rank,c.entry_id LIMIT greatest(1,least(p_limit,24));
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_search_claims(text,text,double precision[],int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.rag_search_claims(text,text,double precision[],int) TO aifrogi_public;

CREATE FUNCTION aifrogi_security.rag_index_candidates(p_property text)
RETURNS TABLE(entry_id text,content text,question text,title text,seal_hash text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_INDEX'],NULL);
 RETURN QUERY SELECT c.entry_id,c.content,c.question,c.title,c.seal_hash FROM aifrogi_security.rag_claim_catalog(p_property) c
 WHERE NOT EXISTS(SELECT 1 FROM "RagClaimEmbedding" em WHERE em."propertyId"=p_property AND em."entryId"=c.entry_id AND em."sealHash"=c.seal_hash AND em.model='text-embedding-3-small'
 AND em."contentHash"=encode(public.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')) LIMIT 500;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_index_candidates(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.rag_index_candidates(text) TO aifrogi_worker;

CREATE FUNCTION aifrogi_security.rag_store_embedding(p_property text,p_entry text,p_seal text,p_digest text,p_vector double precision[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_INDEX'],NULL);
 IF cardinality(p_vector)<>512 OR EXISTS(SELECT 1 FROM unnest(p_vector) x WHERE x IS NULL OR x::text IN ('NaN','Infinity','-Infinity')) OR NOT EXISTS(SELECT 1 FROM unnest(p_vector) x WHERE x<>0) THEN RAISE EXCEPTION 'EMBEDDING_RESULT_INVALID'; END IF;
 IF NOT EXISTS(SELECT 1 FROM aifrogi_security.rag_claim_catalog(p_property) c WHERE c.entry_id=p_entry AND c.seal_hash=p_seal AND encode(public.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')=p_digest) THEN RAISE EXCEPTION 'CLAIM_AUTHORITY_CHANGED'; END IF;
 INSERT INTO "RagClaimEmbedding"("propertyId","entryId","sealHash","contentHash",model,embedding) VALUES(p_property,p_entry,p_seal,p_digest,'text-embedding-3-small',p_vector)
 ON CONFLICT("propertyId","entryId","sealHash",model) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_store_embedding(text,text,text,text,double precision[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.rag_store_embedding(text,text,text,text,double precision[]) TO aifrogi_worker;

CREATE FUNCTION aifrogi_security.record_rag_answer(p_property text,p_conversation text,p_key text,p_snapshot text,p_question text,p_answer text,p_evidence jsonb,p_claims jsonb,p_trace jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item jsonb; receipt_id text; existing "RagAnswerReceipt"%ROWTYPE;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 -- Serialize with existing eligibility/publication mutations, then bind current sources.
 PERFORM 1 FROM "PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 PERFORM 1 FROM "KnowledgeServingPointer" WHERE "propertyId"=p_property AND audience='PUBLIC' FOR SHARE;
 PERFORM 1 FROM "WebsiteCrawlGeneration" WHERE "propertyId"=p_property AND status='ACTIVE' FOR SHARE;
 IF p_snapshot IS DISTINCT FROM (SELECT snapshot_hash FROM aifrogi_security.rag_snapshot_internal(p_property)) THEN RAISE EXCEPTION 'AUTHORITY_CHANGED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "Conversation" WHERE id=p_conversation AND "propertyId"=p_property) THEN RAISE EXCEPTION 'CONVERSATION_SCOPE_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "KnowledgeGuestSession" WHERE "propertyId"=p_property AND "conversationId"=p_conversation AND "sessionHash"=aifrogi_security.current_session_hash() AND "expiresAt">clock_timestamp() AND "revokedAt" IS NULL) THEN RAISE EXCEPTION 'GUEST_SESSION_INVALID'; END IF;
 IF p_answer IS NULL OR trim(p_answer)='' OR p_key IS NULL OR trim(p_key)='' OR jsonb_typeof(p_evidence)<>'array' OR jsonb_array_length(p_evidence)=0 OR jsonb_typeof(p_claims)<>'array' OR jsonb_array_length(p_claims)=0 THEN RAISE EXCEPTION 'RAG_RECEIPT_INVALID'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_evidence) LOOP
  IF item->>'kind'='CLAIM' THEN
   IF NOT EXISTS(SELECT 1 FROM aifrogi_security.rag_claim_catalog(p_property) c WHERE c.entry_id=item->>'sourceId' AND c.seal_hash=item->>'sourceVersion' AND encode(public.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')=item->>'digest') THEN RAISE EXCEPTION 'CLAIM_AUTHORITY_CHANGED'; END IF;
  ELSIF item->>'kind'='CRAWL' THEN
   IF NOT aifrogi_security.shared_answer_generation_authorized(p_property,item->>'sourceVersion') OR NOT EXISTS(SELECT 1 FROM "WebsiteCrawlChunk" c JOIN "WebsiteCrawlGeneration" g ON g.id=c."generationId" AND g."propertyId"=c."propertyId" WHERE c."propertyId"=p_property AND c.id=item->>'sourceId' AND g.id=item->>'sourceVersion' AND g.status='ACTIVE' AND encode(public.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')=item->>'digest') THEN RAISE EXCEPTION 'CRAWL_AUTHORITY_CHANGED'; END IF;
  ELSIF item->>'kind'='LIVE' THEN
   IF item->>'operation' IS DISTINCT FROM 'PUBLIC_CATALOG' OR item->>'checkedAt' IS NULL OR item->>'content' IS NULL OR (item->>'checkedAt')::timestamptz<clock_timestamp()-interval '30 seconds' OR (item->>'checkedAt')::timestamptz>clock_timestamp()+interval '5 seconds'
    OR encode(public.digest(convert_to(item->>'content','UTF8'),'sha256'),'hex') IS DISTINCT FROM item->>'digest'
    OR NOT EXISTS(SELECT 1 FROM "BotConnectorConfiguration" c JOIN "Property" p ON p."organizationId"=c."organizationId" LEFT JOIN "BotConnectorCredential" cred ON cred."connectorId"=c.id
      WHERE p.id=p_property AND c.id=item->>'sourceId' AND c.enabled AND c.lifecycle IN ('LIVE','MONITORED') AND c."lastHealthStatus"='HEALTHY' AND 'PUBLIC_CATALOG'=ANY(c."readOperations")
      AND encode(public.digest(convert_to(c.id||':'||(extract(epoch FROM c."updatedAt")*1000)::bigint::text||':'||coalesce(cred."keyVersion",0)::text,'UTF8'),'sha256'),'hex')=item->>'sourceVersion'
      AND (c."authType"='NONE' OR cred.id IS NOT NULL AND cred."revokedAt" IS NULL AND (cred."expiresAt" IS NULL OR cred."expiresAt">clock_timestamp()))) THEN RAISE EXCEPTION 'LIVE_AUTHORITY_CHANGED'; END IF;
  ELSE RAISE EXCEPTION 'EVIDENCE_KIND_INVALID'; END IF;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_claims) LOOP
  IF item->>'supported' IS DISTINCT FROM 'true' OR coalesce(item->>'claim','')='' OR position(item->>'claim' in p_answer)=0 OR jsonb_typeof(item->'evidenceIds')<>'array' OR jsonb_array_length(item->'evidenceIds')=0 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(item->'evidenceIds') cited WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_evidence) e WHERE e->>'id'=cited)) THEN RAISE EXCEPTION 'RAG_CLAIM_PROOF_INVALID'; END IF;
 END LOOP;
 INSERT INTO "RagAnswerReceipt"("propertyId","conversationId","deliveryKey","snapshotHash",question,answer,"answerHash",evidence,claims,trace)
 VALUES(p_property,p_conversation,p_key,p_snapshot,p_question,p_answer,encode(public.digest(convert_to(p_answer,'UTF8'),'sha256'),'hex'),p_evidence,p_claims,p_trace)
 ON CONFLICT("propertyId","deliveryKey") DO NOTHING RETURNING id INTO receipt_id;
 IF receipt_id IS NULL THEN
  SELECT * INTO STRICT existing FROM "RagAnswerReceipt" WHERE "propertyId"=p_property AND "deliveryKey"=p_key;
  IF existing.answer<>p_answer OR existing."conversationId"<>p_conversation OR existing."snapshotHash"<>p_snapshot OR existing.evidence<>p_evidence OR existing.claims<>p_claims THEN RAISE EXCEPTION 'DELIVERY_KEY_CONFLICT'; END IF;
  receipt_id:=existing.id;
 END IF;
 RETURN receipt_id;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.record_rag_answer(text,text,text,text,text,text,jsonb,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.record_rag_answer(text,text,text,text,text,text,jsonb,jsonb,jsonb) TO aifrogi_web;

CREATE FUNCTION aifrogi_security.queue_rag_index(p_property text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE publication text; job_key text; job_id text; org text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT "publicationId" INTO STRICT publication FROM "KnowledgeServingPointer" WHERE "propertyId"=p_property AND audience='PUBLIC';
 SELECT "organizationId" INTO STRICT org FROM "Property" WHERE id=p_property;
 INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose)
 VALUES(gen_random_uuid()::text,p_property,'rag-indexer:'||p_property,'aifrogi_worker','KNOWLEDGE_INDEX')
 ON CONFLICT("propertyId","principalId","databaseRole",purpose) DO UPDATE SET "revokedAt"=NULL,"expiresAt"=NULL;
 job_key:='rag-index:'||p_property||':'||publication; job_id:=job_key;
 INSERT INTO "AutomationJob"(id,"propertyId","workflowId","triggerType","actionType",status,payload,"idempotencyKey","updatedAt")
 VALUES(job_id,p_property,'knowledge','PUBLICATION','RAG_CLAIM_INDEX','QUEUED',jsonb_build_object('organizationId',org,'publicationId',publication),job_key,clock_timestamp())
 ON CONFLICT("idempotencyKey") DO NOTHING;
 RETURN job_id;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.queue_rag_index(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.queue_rag_index(text,text) TO aifrogi_publisher;

ALTER TABLE "KnowledgeDocument" ADD COLUMN "contentHash" text;
WITH hashes AS (SELECT id,encode(public.digest(content,'sha256'),'hex') hash,row_number() OVER(PARTITION BY "propertyId","mimeType",encode(public.digest(content,'sha256'),'hex') ORDER BY "createdAt",id) n FROM "KnowledgeDocument")
UPDATE "KnowledgeDocument" d SET "contentHash"=h.hash FROM hashes h WHERE h.id=d.id AND h.n=1;
CREATE UNIQUE INDEX "KnowledgeDocument_propertyId_mimeType_contentHash_key" ON "KnowledgeDocument"("propertyId","mimeType","contentHash");

-- Stable owner source identity and atomic publication/index queue.
CREATE OR REPLACE FUNCTION aifrogi_security.publish_owner_approved_entries(p_property text, p_actor text, p_entry_ids text[]) RETURNS TABLE(publication_id text, pointer_generation bigint, claim_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
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
  prior_row public."KnowledgeEntry"%ROWTYPE;
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
     AND "conflictStatus"='CLEAR' AND ("expiresAt" IS NULL OR "expiresAt">now_at)
     AND ("effectiveAt" IS NULL OR "effectiveAt"<=now_at)
     AND NOT EXISTS(SELECT 1 FROM public."KnowledgeRevisionEvent" re WHERE re."propertyId"=p_property AND re."entryId"="KnowledgeEntry".id AND re."eventType" IN ('WITHDRAWN','SUPERSEDED'));
  IF total<>cardinality(p_entry_ids) THEN RAISE EXCEPTION 'ENTRY_NOT_OWNER_APPROVED_OR_CURRENT'; END IF;

  SELECT sp."publicationId",sp."pointerGeneration" INTO publication_id,pointer_generation
    FROM public."KnowledgeServingPointer" sp
    JOIN public."KnowledgePublication" p ON (p."propertyId",p.audience,p.id)=(sp."propertyId",sp.audience,sp."publicationId")
   WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND p.state='SEALED' AND p."revokedAt" IS NULL
     AND (SELECT array_agg(pc."entryId" ORDER BY pc."entryId") FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p.id)
         = (SELECT array_agg(x ORDER BY x) FROM unnest(p_entry_ids) x);
  IF FOUND THEN claim_count:=cardinality(p_entry_ids); PERFORM aifrogi_security.queue_rag_index(p_property,p_actor); RETURN NEXT; RETURN; END IF;

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
  source_identity:='owner-approved-form:'||p_property;
  source_hash:=encode(public.digest(convert_to(source_identity,'UTF8'),'sha256'),'hex');

  SELECT id INTO source_id FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND "sourceType"='FORM' AND "canonicalIdentityHash"=source_hash FOR UPDATE;
  IF source_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."KnowledgeSource" WHERE id=source_id AND state='AUTHORIZED' AND "revokedAt" IS NULL) THEN RAISE EXCEPTION 'SOURCE_REAUTHORISATION_REQUIRED'; END IF;
  IF source_id IS NULL THEN
    source_id:=gen_random_uuid()::text;
    INSERT INTO public."KnowledgeSource"(id,"propertyId","sourceType","canonicalIdentity","canonicalIdentityHash",state,"audienceCeiling","currentRevision","createdAt","updatedAt")
    VALUES(source_id,p_property,'FORM',source_identity,source_hash,'AUTHORIZED','PUBLIC',0,now_at,now_at);
  END IF;

  SELECT id INTO consent_id FROM public."WebsiteSourceConsent" WHERE "propertyId"=p_property AND "sourceType"='FORM' AND "canonicalIdentityHash"=source_hash;
  IF consent_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."WebsiteSourceConsent" WHERE id=consent_id AND "revokedAt" IS NULL AND status='POST_TRIAL_APPROVED' AND ("effectiveUntil" IS NULL OR "effectiveUntil">now_at)) THEN RAISE EXCEPTION 'SOURCE_REAUTHORISATION_REQUIRED'; END IF;
  IF consent_id IS NULL THEN
  consent_id:=gen_random_uuid()::text;
  INSERT INTO public."WebsiteSourceConsent"(id,"propertyId","termsVersion",status,"trialAuthorizedAt","trialExpiresAt","acceptedByEmail","postTrialMethod","postTrialApprovedBy","postTrialApprovedAt","approvalEvidenceRef","createdAt","updatedAt","sourceType","canonicalIdentity","canonicalIdentityHash","sourceId","authorityScope","audienceCeiling","effectiveFrom","effectiveUntil")
  VALUES(consent_id,p_property,'OWNER_FORM_V1','POST_TRIAL_APPROVED',now_at,now_at+interval '100 years',p_actor,'EMAIL',p_actor,now_at,'legacy-preview-approval',now_at,now_at,'FORM',source_identity,source_hash,source_id,'{"capture":true,"publish":true}'::jsonb,'PUBLIC',now_at,now_at+interval '100 years');
  END IF;
  UPDATE public."KnowledgeSource" SET "currentRevision"="currentRevision"+1,state='AUTHORIZED',"revokedAt"=NULL,"updatedAt"=now_at WHERE id=source_id RETURNING "currentRevision" INTO total;
  source_revision_id:=gen_random_uuid()::text;
  INSERT INTO public."KnowledgeSourceRevision"(id,"propertyId","sourceId",revision,configuration,"configurationHash","consentId","createdBy","createdAt")
  VALUES(source_revision_id,p_property,source_id,total,jsonb_build_object('kind','OWNER_APPROVED_FORM','snapshotHash',snapshot_hash),snapshot_hash,consent_id,p_actor,now_at);
  capture_id:=gen_random_uuid()::text;
  INSERT INTO public."SourceCapture"(id,"propertyId","sourceId","sourceRevisionId","requestedGeneration","operationKey",status,"requestedAt","startedAt","completedAt")
  VALUES(capture_id,p_property,source_id,source_revision_id,total,'owner-form:'||p_property||':'||snapshot_hash,'SUCCEEDED',now_at,now_at,now_at);
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
    IF entry_row."supersedesId" IS NOT NULL THEN
      SELECT * INTO STRICT prior_row FROM public."KnowledgeEntry" WHERE "propertyId"=p_property AND id=entry_row."supersedesId" FOR UPDATE;
      IF prior_row."claimKey" IS DISTINCT FROM entry_row."claimKey" OR prior_row.version>=entry_row.version OR prior_row.id=ANY(p_entry_ids) THEN RAISE EXCEPTION 'INVALID_SUPERSESSION'; END IF;
      INSERT INTO public."KnowledgeRevisionEvent"(id,"propertyId","entryId","eventType","relatedEntryId",reason,"actorId","occurredAt")
      VALUES(gen_random_uuid()::text,p_property,prior_row.id,'SUPERSEDED',entry_row.id,'Replaced by owner-approved publication',p_actor,now_at) ON CONFLICT DO NOTHING;
    END IF;
    IF entry_row."sealedAt" IS NULL THEN
      IF entry_row."supersedesId" IS NOT NULL AND prior_row."claimIdentityId" IS NOT NULL THEN identity_id:=prior_row."claimIdentityId";
      ELSE
      INSERT INTO public."KnowledgeClaimIdentity"(id,"propertyId","stableKey","entityKey","fieldKey",qualifiers,"keyVersion","createdAt")
      VALUES(gen_random_uuid()::text,p_property,COALESCE(entry_row."claimKey",entry_row.id),'business',COALESCE(entry_row."claimKey",entry_row.id),jsonb_build_object('question',entry_row.question),1,now_at)
      ON CONFLICT ("propertyId","stableKey") DO UPDATE SET "stableKey"=EXCLUDED."stableKey" RETURNING id INTO identity_id;
      END IF;
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
  publication_id:=publication; claim_count:=cardinality(p_entry_ids); PERFORM aifrogi_security.queue_rag_index(p_property,p_actor);
  RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.shared_answer_generation_authorized(text,text) FROM PUBLIC;

REVOKE ALL ON FUNCTION aifrogi_security.shared_answer_semantic_chunks(text,text,double precision[],integer) FROM PUBLIC;

REVOKE ALL ON FUNCTION aifrogi_security.shared_answer_configured_source(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.shared_answer_semantic_chunks(text,text,double precision[],integer) TO aifrogi_public;
GRANT EXECUTE ON FUNCTION aifrogi_security.shared_answer_configured_source(text) TO aifrogi_public,aifrogi_worker;

-- Source revocation timestamps are authority, even before a lifecycle update.
CREATE OR REPLACE FUNCTION aifrogi_security.eligible_claim(p_property text, p_entry text, p_audience public."KnowledgeAudience", p_as_of timestamp with time zone, p_generation bigint) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
SELECT EXISTS (
 SELECT 1 FROM public."KnowledgeEntry" e
 JOIN public."PropertyIntelligencePolicy" pip ON pip."propertyId"=e."propertyId" AND pip."eligibilityGeneration"=p_generation
 JOIN public."KnowledgePolicyVersion" pv ON pv."propertyId"=pip."propertyId" AND pv.id=pip."currentPolicyVersionId" AND pv.mode='CLAIMS_ONLY'
 WHERE e."propertyId"=p_property AND e.id=p_entry AND e."sealedAt" IS NOT NULL AND e."revisionState"='SEALED'
 AND e."verificationStatus"='SUPPORTED' AND e.audience=p_audience
 AND (e."effectiveFrom" IS NULL OR e."effectiveFrom"<=p_as_of) AND (e."effectiveUntil" IS NULL OR e."effectiveUntil">p_as_of)
 AND NOT EXISTS (SELECT 1 FROM public."KnowledgeRevisionEvent" re WHERE re."propertyId"=e."propertyId" AND re."entryId"=e.id AND re."eventType" IN ('WITHDRAWN','SUPERSEDED'))
 AND NOT EXISTS (SELECT 1 FROM public."KnowledgeClaimConflict" cc WHERE cc."propertyId"=e."propertyId" AND cc.blocking AND cc."resolvedAt" IS NULL AND e.id IN (cc."lowerEntryId",cc."higherEntryId"))
 AND e."requiredComponents" <@ ARRAY(
   SELECT DISTINCT comp FROM public."KnowledgeRevisionEvidenceBinding" b
   JOIN public."KnowledgeClaimEvidence" ev ON ev."propertyId"=b."propertyId" AND ev.id=b."evidenceId"
   JOIN public."CaptureVersion" cv ON cv."propertyId"=ev."propertyId" AND cv.id=ev."captureVersionId"
   JOIN public."KnowledgeObject" ko ON ko."propertyId"=cv."propertyId" AND ko.id=cv."objectId" AND ko.state='USABLE'
   JOIN public."SourceCapture" sc ON sc."propertyId"=cv."propertyId" AND sc.id=cv."captureId" AND sc.status='SUCCEEDED'
   JOIN public."KnowledgeSource" ks ON ks."propertyId"=sc."propertyId" AND ks.id=sc."sourceId" AND ks.state='AUTHORIZED' AND ks."revokedAt" IS NULL
   JOIN public."KnowledgeSourceRevision" sr ON sr."propertyId"=sc."propertyId" AND sr."sourceId"=sc."sourceId" AND sr.id=sc."sourceRevisionId"
   JOIN public."WebsiteSourceConsent" c ON c."propertyId"=sr."propertyId" AND c.id=sr."consentId" AND c."sourceId"=ks.id AND c."sourceType"=ks."sourceType" AND c."canonicalIdentityHash"=ks."canonicalIdentityHash"
   CROSS JOIN LATERAL unnest(ev."supportedComponents") comp
   WHERE b."propertyId"=e."propertyId" AND b."entryId"=e.id
     AND c."revokedAt" IS NULL AND c.status<>'REVOKED' AND COALESCE(c."effectiveFrom",c."trialAuthorizedAt")<=p_as_of
     AND COALESCE(c."effectiveUntil",c."trialExpiresAt")>p_as_of
     AND (p_audience<>'PUBLIC' OR c.status='POST_TRIAL_APPROVED')
     AND CASE c."audienceCeiling" WHEN 'PUBLIC' THEN 3 WHEN 'STAFF' THEN 2 ELSE 1 END >= CASE p_audience WHEN 'PUBLIC' THEN 3 WHEN 'STAFF' THEN 2 ELSE 1 END
     AND cv."capturedAt">=p_as_of-(COALESCE((pv."freshnessRules"->>'maxAgeDays')::int,e."refreshDays")*interval '1 day')
 )
)
$$;

CREATE OR REPLACE FUNCTION aifrogi_security.retrieve_active_website_chunks(p_property text, p_query text, p_limit integer DEFAULT 6) RETURNS TABLE(generation_id text, page_id text, chunk_id text, url text, title text, content text, rank real)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE query_terms text; search_query tsquery;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  SELECT string_agg(quote_literal(term), ' | ') INTO query_terms
    FROM (SELECT DISTINCT lower(x) term FROM regexp_split_to_table(p_query,'[^[:alnum:]@.+-]+') x WHERE length(x)>=2 LIMIT 20) q;
  IF query_terms IS NULL THEN RETURN; END IF;
  search_query:=to_tsquery('simple',query_terms);
  RETURN QUERY
  SELECT g.id,p.id,c.id,p.url,p.title,c.content,ts_rank_cd(to_tsvector('simple',c.content),search_query)
  FROM "WebsiteCrawlGeneration" g
  JOIN "CaptureVersion" cv ON (cv."propertyId",cv.id)=(g."propertyId",g."captureVersionId")
  JOIN "SourceCapture" sc ON (sc."propertyId",sc.id)=(cv."propertyId",cv."captureId")
  JOIN "KnowledgeSource" s ON (s."propertyId",s.id)=(sc."propertyId",sc."sourceId")
  JOIN "WebsiteCrawlPage" p ON (p."propertyId",p."generationId")=(g."propertyId",g.id)
  JOIN "WebsiteCrawlChunk" c ON (c."propertyId",c."generationId",c."pageId")=(p."propertyId",p."generationId",p.id)
  WHERE g."propertyId"=p_property AND g.status='ACTIVE'
    AND aifrogi_security.shared_answer_generation_authorized(p_property,g.id)
    AND sc.status='SUCCEEDED' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL
    AND (to_tsvector('simple',c.content) @@ search_query OR (lower(p_query) ~ '\memail\M' AND c.content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'))
  ORDER BY 7 DESC,c.ordinal ASC LIMIT LEAST(GREATEST(p_limit,1),12);
END $$;

CREATE FUNCTION aifrogi_security.rag_continue_index(p_property text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE first_entry text; org text; key text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_INDEX'],NULL);
 SELECT entry_id INTO first_entry FROM aifrogi_security.rag_index_candidates(p_property) ORDER BY entry_id LIMIT 1;
 IF first_entry IS NULL THEN RETURN false; END IF;
 SELECT "organizationId" INTO STRICT org FROM "Property" WHERE id=p_property;
 key:='rag-index:'||p_property||':'||(SELECT snapshot_hash FROM aifrogi_security.rag_snapshot_internal(p_property))||':'||first_entry;
 INSERT INTO "AutomationJob"(id,"propertyId","workflowId","triggerType","actionType",status,payload,"idempotencyKey","updatedAt")
 VALUES(key,p_property,'knowledge','INDEX_CONTINUATION','RAG_CLAIM_INDEX','QUEUED',jsonb_build_object('organizationId',org),key,clock_timestamp()) ON CONFLICT("idempotencyKey") DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_continue_index(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.rag_continue_index(text) TO aifrogi_worker;

-- Owner management uses the existing signed-session application connection.
-- It never grants public runtime roles permission to edit knowledge.
CREATE FUNCTION aifrogi_security.rag_owner_authorized(p_property text,p_actor text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT session_user='leados_app'
 AND current_setting('app.system_purpose',true)='knowledge-owner-workflow'
 AND current_setting('app.property_id',true)=p_property
 AND current_setting('app.security_actor',true)=p_actor
 AND EXISTS(SELECT 1 FROM "Property" p JOIN "OrganizationMember" m ON m."organizationId"=p."organizationId"
 WHERE p.id=p_property AND p."organizationId"=current_setting('app.organization_id',true)
 AND lower(m.email)=lower(p_actor) AND m.status='ACTIVE' AND m.role IN ('OWNER','ADMIN'))
$$;
REVOKE ALL ON FUNCTION aifrogi_security.rag_owner_authorized(text,text) FROM PUBLIC;

CREATE FUNCTION aifrogi_security.provision_rag_owner_publisher(p_property text,p_actor text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT aifrogi_security.rag_owner_authorized(p_property,p_actor) THEN RAISE EXCEPTION 'OWNER_AUTHORITY_REQUIRED'; END IF;
 INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose,"expiresAt")
 VALUES(gen_random_uuid()::text,p_property,p_actor,'aifrogi_publisher','KNOWLEDGE_PUBLISH',clock_timestamp()+interval '1 hour')
 ON CONFLICT("propertyId","principalId","databaseRole",purpose) DO UPDATE SET "revokedAt"=NULL,"expiresAt"=clock_timestamp()+interval '1 hour';
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.provision_rag_owner_publisher(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.provision_rag_owner_publisher(text,text) TO leados_app;

CREATE FUNCTION aifrogi_security.publish_current_rag_knowledge(p_property text,p_actor text)
RETURNS TABLE(publication_id text,pointer_generation bigint,claim_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE entries text[];
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 IF NOT EXISTS(SELECT 1 FROM "Property" p JOIN "OrganizationMember" m ON m."organizationId"=p."organizationId" WHERE p.id=p_property AND lower(m.email)=lower(p_actor) AND m.status='ACTIVE' AND m.role IN ('OWNER','ADMIN')) THEN RAISE EXCEPTION 'OWNER_AUTHORITY_REQUIRED'; END IF;
 SELECT array_agg(e.id ORDER BY e.id) INTO entries FROM "KnowledgeEntry" e
 WHERE e."propertyId"=p_property AND e.status='PUBLISHED' AND e."previewApprovedAt" IS NOT NULL AND e."previewApprovedBy" IS NOT NULL AND e."conflictStatus"='CLEAR'
 AND (e."effectiveAt" IS NULL OR e."effectiveAt"<=clock_timestamp()) AND (e."expiresAt" IS NULL OR e."expiresAt">clock_timestamp())
 AND (e."documentId" IS NULL OR EXISTS(SELECT 1 FROM "KnowledgeDocument" d WHERE d.id=e."documentId" AND d."propertyId"=p_property AND d.status='APPROVED'))
 AND NOT EXISTS(SELECT 1 FROM "KnowledgeRevisionEvent" re WHERE re."propertyId"=p_property AND re."entryId"=e.id AND re."eventType" IN ('WITHDRAWN','SUPERSEDED'))
 AND NOT EXISTS(SELECT 1 FROM "KnowledgeEntry" n WHERE n."propertyId"=p_property AND n."supersedesId"=e.id AND n.status='PUBLISHED' AND n."previewApprovedAt" IS NOT NULL AND n."conflictStatus"='CLEAR' AND (n."effectiveAt" IS NULL OR n."effectiveAt"<=clock_timestamp()) AND (n."expiresAt" IS NULL OR n."expiresAt">clock_timestamp()) AND (n."documentId" IS NULL OR EXISTS(SELECT 1 FROM "KnowledgeDocument" d WHERE d.id=n."documentId" AND d."propertyId"=p_property AND d.status='APPROVED')));
 IF cardinality(entries) IS NULL THEN claim_count:=0; RETURN NEXT; RETURN; END IF;
 RETURN QUERY SELECT * FROM aifrogi_security.publish_owner_approved_entries(p_property,p_actor,entries);
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.publish_current_rag_knowledge(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.publish_current_rag_knowledge(text,text) TO aifrogi_publisher;

CREATE FUNCTION aifrogi_security.withdraw_rag_claim(p_property text,p_entry text,p_actor text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT aifrogi_security.rag_owner_authorized(p_property,p_actor) THEN RAISE EXCEPTION 'OWNER_AUTHORITY_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "KnowledgeEntry" WHERE "propertyId"=p_property AND id=p_entry AND "sealedAt" IS NOT NULL) THEN RAISE EXCEPTION 'SEALED_CLAIM_REQUIRED'; END IF;
 PERFORM 1 FROM "PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR UPDATE;
 INSERT INTO "KnowledgeRevisionEvent"(id,"propertyId","entryId","eventType",reason,"actorId")
 VALUES(gen_random_uuid()::text,p_property,p_entry,'WITHDRAWN',left(p_reason,1000),p_actor);
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.withdraw_rag_claim(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.withdraw_rag_claim(text,text,text,text) TO leados_app;
