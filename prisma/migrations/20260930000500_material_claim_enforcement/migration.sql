ALTER TABLE "WebsiteCrawlAnswerAudit" ADD COLUMN "materialClaimDecisions" jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS aifrogi_security.record_crawl_answer(text,text,text,text[],text,text,text,text,text);
CREATE FUNCTION aifrogi_security.record_crawl_answer(
 p_property text,p_conversation text,p_generation text,p_chunks text[],p_question text,p_answer text,p_model text,p_delivery_key text,p_state text,p_claim_decisions jsonb
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE audit_id text; matched int; active_generation text; decision jsonb;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF p_state NOT IN ('DELIVERED','FAILED') OR cardinality(p_chunks)<1 OR btrim(p_answer)='' THEN RAISE EXCEPTION 'CRAWL_ANSWER_INVALID'; END IF;
 IF jsonb_typeof(p_claim_decisions)<>'array' OR jsonb_array_length(p_claim_decisions)=0 THEN RAISE EXCEPTION 'MATERIAL_CLAIM_DECISIONS_REQUIRED'; END IF;
 FOR decision IN SELECT value FROM jsonb_array_elements(p_claim_decisions) LOOP
   IF decision->>'supported'<>'true' OR coalesce(btrim(decision->>'claim'),'')='' OR strpos(p_answer,decision->>'claim')=0 THEN RAISE EXCEPTION 'MATERIAL_CLAIM_UNSUPPORTED'; END IF;
 END LOOP;
 SELECT id INTO STRICT active_generation FROM "WebsiteCrawlGeneration" WHERE "propertyId"=p_property AND status='ACTIVE' FOR SHARE;
 IF active_generation<>p_generation THEN RAISE EXCEPTION 'CRAWL_GENERATION_STALE'; END IF;
 SELECT count(*) INTO matched FROM "WebsiteCrawlChunk" WHERE "propertyId"=p_property AND "generationId"=p_generation AND id=ANY(p_chunks);
 IF matched<>cardinality(p_chunks) OR matched<>cardinality(ARRAY(SELECT DISTINCT x FROM unnest(p_chunks) x)) THEN RAISE EXCEPTION 'CRAWL_CHUNK_SET_INVALID'; END IF;
 PERFORM 1 FROM "Conversation" WHERE "propertyId"=p_property AND id=p_conversation FOR SHARE; IF NOT FOUND THEN RAISE EXCEPTION 'CONVERSATION_NOT_FOUND'; END IF;
 INSERT INTO "WebsiteCrawlAnswerAudit"(id,"propertyId","generationId","conversationId","chunkIds",question,answer,"answerHash",model,"deliveryKey",state,"materialClaimDecisions")
 VALUES(gen_random_uuid()::text,p_property,p_generation,p_conversation,p_chunks,p_question,p_answer,encode(digest(convert_to(p_answer,'UTF8'),'sha256'),'hex'),p_model,p_delivery_key,p_state,p_claim_decisions)
 ON CONFLICT ("propertyId","deliveryKey") DO NOTHING RETURNING id INTO audit_id;
 IF audit_id IS NULL THEN SELECT id INTO STRICT audit_id FROM "WebsiteCrawlAnswerAudit" WHERE "propertyId"=p_property AND "deliveryKey"=p_delivery_key AND "answerHash"=encode(digest(convert_to(p_answer,'UTF8'),'sha256'),'hex') AND "generationId"=p_generation AND "chunkIds"=p_chunks AND "materialClaimDecisions"=p_claim_decisions; END IF;
 RETURN audit_id;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.record_crawl_answer(text,text,text,text[],text,text,text,text,text,jsonb) FROM PUBLIC,leados_app,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.record_crawl_answer(text,text,text,text[],text,text,text,text,text,jsonb) TO aifrogi_web;
