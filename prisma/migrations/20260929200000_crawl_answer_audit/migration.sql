CREATE TABLE "WebsiteCrawlAnswerAudit" (
  id text PRIMARY KEY,
  "propertyId" text NOT NULL,
  "generationId" text NOT NULL,
  "conversationId" text NOT NULL,
  "chunkIds" text[] NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  "answerHash" text NOT NULL,
  model text NOT NULL,
  "deliveryKey" text NOT NULL,
  state text NOT NULL CHECK (state IN ('DELIVERED','FAILED')),
  "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE ("propertyId","deliveryKey"),
  FOREIGN KEY ("propertyId","generationId") REFERENCES "WebsiteCrawlGeneration"("propertyId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("propertyId","conversationId") REFERENCES "Conversation"("propertyId",id) ON DELETE RESTRICT
);
ALTER TABLE "WebsiteCrawlAnswerAudit" ENABLE ROW LEVEL SECURITY; ALTER TABLE "WebsiteCrawlAnswerAudit" FORCE ROW LEVEL SECURITY;
CREATE POLICY aifrogi_property_isolation ON "WebsiteCrawlAnswerAudit" FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));

CREATE OR REPLACE FUNCTION aifrogi_security.record_crawl_answer(
 p_property text,p_conversation text,p_generation text,p_chunks text[],p_question text,p_answer text,p_model text,p_delivery_key text,p_state text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE audit_id text; matched int; active_generation text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF p_state NOT IN ('DELIVERED','FAILED') OR cardinality(p_chunks)<1 OR btrim(p_answer)='' THEN RAISE EXCEPTION 'CRAWL_ANSWER_INVALID'; END IF;
 SELECT id INTO STRICT active_generation FROM "WebsiteCrawlGeneration" WHERE "propertyId"=p_property AND status='ACTIVE' FOR SHARE;
 IF active_generation<>p_generation THEN RAISE EXCEPTION 'CRAWL_GENERATION_STALE'; END IF;
 SELECT count(*) INTO matched FROM "WebsiteCrawlChunk" WHERE "propertyId"=p_property AND "generationId"=p_generation AND id=ANY(p_chunks);
 IF matched<>cardinality(p_chunks) OR matched<>cardinality(ARRAY(SELECT DISTINCT x FROM unnest(p_chunks) x)) THEN RAISE EXCEPTION 'CRAWL_CHUNK_SET_INVALID'; END IF;
 PERFORM 1 FROM "Conversation" WHERE "propertyId"=p_property AND id=p_conversation FOR SHARE; IF NOT FOUND THEN RAISE EXCEPTION 'CONVERSATION_NOT_FOUND'; END IF;
 INSERT INTO "WebsiteCrawlAnswerAudit"(id,"propertyId","generationId","conversationId","chunkIds",question,answer,"answerHash",model,"deliveryKey",state)
 VALUES(gen_random_uuid()::text,p_property,p_generation,p_conversation,p_chunks,p_question,p_answer,encode(digest(convert_to(p_answer,'UTF8'),'sha256'),'hex'),p_model,p_delivery_key,p_state)
 ON CONFLICT ("propertyId","deliveryKey") DO NOTHING RETURNING id INTO audit_id;
 IF audit_id IS NULL THEN SELECT id INTO STRICT audit_id FROM "WebsiteCrawlAnswerAudit" WHERE "propertyId"=p_property AND "deliveryKey"=p_delivery_key AND "answerHash"=encode(digest(convert_to(p_answer,'UTF8'),'sha256'),'hex') AND "generationId"=p_generation AND "chunkIds"=p_chunks; END IF;
 RETURN audit_id;
END $$;
REVOKE ALL ON "WebsiteCrawlAnswerAudit" FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON FUNCTION aifrogi_security.record_crawl_answer(text,text,text,text[],text,text,text,text,text) FROM PUBLIC,leados_app,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.record_crawl_answer(text,text,text,text[],text,text,text,text,text) TO aifrogi_web;
