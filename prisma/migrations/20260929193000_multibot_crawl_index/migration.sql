CREATE TABLE "WebsiteCrawlGeneration" (
  id text PRIMARY KEY,
  "propertyId" text NOT NULL,
  "captureVersionId" text NOT NULL,
  status text NOT NULL CHECK (status IN ('BUILDING','ACTIVE','FAILED','SUPERSEDED')),
  "pageCount" integer NOT NULL DEFAULT 0,
  "chunkCount" integer NOT NULL DEFAULT 0,
  "contentHash" text NOT NULL,
  "activatedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE ("propertyId","captureVersionId"),
  UNIQUE ("propertyId",id),
  FOREIGN KEY ("propertyId","captureVersionId") REFERENCES "CaptureVersion"("propertyId",id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "WebsiteCrawlGeneration_one_active" ON "WebsiteCrawlGeneration"("propertyId") WHERE status='ACTIVE';

CREATE TABLE "WebsiteCrawlPage" (
  id text PRIMARY KEY,
  "propertyId" text NOT NULL,
  "generationId" text NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  bucket text NOT NULL,
  content text NOT NULL,
  "contentHash" text NOT NULL,
  "httpStatus" integer,
  "crawledAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE ("propertyId","generationId",url),
  UNIQUE ("propertyId",id),
  FOREIGN KEY ("propertyId","generationId") REFERENCES "WebsiteCrawlGeneration"("propertyId",id) ON DELETE CASCADE
);

CREATE TABLE "WebsiteCrawlChunk" (
  id text PRIMARY KEY,
  "propertyId" text NOT NULL,
  "generationId" text NOT NULL,
  "pageId" text NOT NULL,
  ordinal integer NOT NULL,
  content text NOT NULL,
  "contentHash" text NOT NULL,
  "searchVector" tsvector GENERATED ALWAYS AS (to_tsvector('english',content)) STORED,
  "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE ("propertyId","generationId","pageId",ordinal),
  FOREIGN KEY ("propertyId","generationId") REFERENCES "WebsiteCrawlGeneration"("propertyId",id) ON DELETE CASCADE,
  FOREIGN KEY ("propertyId","pageId") REFERENCES "WebsiteCrawlPage"("propertyId",id) ON DELETE CASCADE
);
CREATE INDEX "WebsiteCrawlChunk_search" ON "WebsiteCrawlChunk" USING gin("searchVector");
CREATE INDEX "WebsiteCrawlChunk_active_lookup" ON "WebsiteCrawlChunk"("propertyId","generationId");

ALTER TABLE "WebsiteCrawlGeneration" ENABLE ROW LEVEL SECURITY; ALTER TABLE "WebsiteCrawlGeneration" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WebsiteCrawlPage" ENABLE ROW LEVEL SECURITY; ALTER TABLE "WebsiteCrawlPage" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WebsiteCrawlChunk" ENABLE ROW LEVEL SECURITY; ALTER TABLE "WebsiteCrawlChunk" FORCE ROW LEVEL SECURITY;
CREATE POLICY aifrogi_property_isolation ON "WebsiteCrawlGeneration" FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));
CREATE POLICY aifrogi_property_isolation ON "WebsiteCrawlPage" FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));
CREATE POLICY aifrogi_property_isolation ON "WebsiteCrawlChunk" FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));

CREATE OR REPLACE FUNCTION aifrogi_security.materialize_website_crawl(p_property text,p_capture_version text,p_actor text)
RETURNS TABLE(generation_id text,page_count int,chunk_count int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE snap jsonb; page jsonb; pid text; body text; pos int; ord int; source_ok boolean; hash text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_actor);
  SELECT cv.manifest->'snapshot', EXISTS(SELECT 1 FROM "SourceCapture" sc JOIN "KnowledgeSource" s ON (s."propertyId",s.id)=(sc."propertyId",sc."sourceId") WHERE (sc."propertyId",sc.id)=(cv."propertyId",cv."captureId") AND sc.status='SUCCEEDED' AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL)
    INTO STRICT snap,source_ok FROM "CaptureVersion" cv WHERE cv."propertyId"=p_property AND cv.id=p_capture_version;
  IF NOT source_ok OR jsonb_typeof(snap->'pages')<>'array' THEN RAISE EXCEPTION 'ACTIVE_AUTHORIZED_CAPTURE_REQUIRED'; END IF;
  hash:=aifrogi_security.hash_json(snap);
  SELECT id INTO generation_id FROM "WebsiteCrawlGeneration" WHERE "propertyId"=p_property AND "captureVersionId"=p_capture_version;
  IF generation_id IS NOT NULL THEN SELECT "pageCount","chunkCount" INTO page_count,chunk_count FROM "WebsiteCrawlGeneration" WHERE id=generation_id; RETURN NEXT; RETURN; END IF;
  generation_id:=gen_random_uuid()::text;
  INSERT INTO "WebsiteCrawlGeneration"(id,"propertyId","captureVersionId",status,"contentHash") VALUES(generation_id,p_property,p_capture_version,'BUILDING',hash);
  FOR page IN SELECT value FROM jsonb_array_elements(snap->'pages') LOOP
    body:=btrim(COALESCE(page->>'text','')); IF body='' THEN CONTINUE; END IF;
    pid:=gen_random_uuid()::text;
    INSERT INTO "WebsiteCrawlPage"(id,"propertyId","generationId",url,title,bucket,content,"contentHash","httpStatus","crawledAt") VALUES(pid,p_property,generation_id,page->>'url',COALESCE(page->>'title',''),COALESCE(page->>'bucket','General'),body,encode(digest(convert_to(body,'UTF8'),'sha256'),'hex'),NULL,COALESCE((page->>'crawledAt')::timestamptz,clock_timestamp()));
    ord:=0; pos:=1; WHILE pos<=length(body) LOOP ord:=ord+1; INSERT INTO "WebsiteCrawlChunk"(id,"propertyId","generationId","pageId",ordinal,content,"contentHash") VALUES(gen_random_uuid()::text,p_property,generation_id,pid,ord,substring(body FROM pos FOR 1400),encode(digest(convert_to(substring(body FROM pos FOR 1400),'UTF8'),'sha256'),'hex')); pos:=pos+1200; END LOOP;
  END LOOP;
  SELECT count(*)::int INTO page_count FROM "WebsiteCrawlPage" WHERE "propertyId"=p_property AND "generationId"=generation_id;
  SELECT count(*)::int INTO chunk_count FROM "WebsiteCrawlChunk" WHERE "propertyId"=p_property AND "generationId"=generation_id;
  UPDATE "WebsiteCrawlGeneration" SET status='SUPERSEDED' WHERE "propertyId"=p_property AND status='ACTIVE';
  UPDATE "WebsiteCrawlGeneration" SET status='ACTIVE',"pageCount"=page_count,"chunkCount"=chunk_count,"activatedAt"=clock_timestamp() WHERE id=generation_id;
  RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.retrieve_active_website_chunks(p_property text,p_query text,p_limit int DEFAULT 6)
RETURNS TABLE(generation_id text,page_id text,chunk_id text,url text,title text,content text,rank real)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  RETURN QUERY SELECT g.id,p.id,c.id,p.url,p.title,c.content,ts_rank_cd(c."searchVector",websearch_to_tsquery('english',p_query))
  FROM "WebsiteCrawlGeneration" g JOIN "WebsiteCrawlPage" p ON (p."propertyId",p."generationId")=(g."propertyId",g.id) JOIN "WebsiteCrawlChunk" c ON (c."propertyId",c."generationId",c."pageId")=(p."propertyId",p."generationId",p.id)
  WHERE g."propertyId"=p_property AND g.status='ACTIVE' AND c."searchVector" @@ websearch_to_tsquery('english',p_query)
  ORDER BY 7 DESC,c.ordinal ASC LIMIT LEAST(GREATEST(p_limit,1),12);
END $$;

REVOKE ALL ON "WebsiteCrawlGeneration","WebsiteCrawlPage","WebsiteCrawlChunk" FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON FUNCTION aifrogi_security.materialize_website_crawl(text,text,text),aifrogi_security.retrieve_active_website_chunks(text,text,int) FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.materialize_website_crawl(text,text,text) TO aifrogi_worker;
GRANT EXECUTE ON FUNCTION aifrogi_security.retrieve_active_website_chunks(text,text,int) TO aifrogi_public;
