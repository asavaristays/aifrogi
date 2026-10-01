CREATE OR REPLACE FUNCTION aifrogi_security.search_canonical_public_crawl_evidence(
  p_property text,p_query text,p_limit integer DEFAULT 3
) RETURNS TABLE(entry_id text,generation_id text,chunk_id text,url text,title text,content text,category text,score real)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_g bigint;
DECLARE query_ts tsquery;
DECLARE query_text text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  SELECT string_agg(token,' | ') INTO query_text
  FROM unnest(regexp_split_to_array(trim(regexp_replace(lower(p_query),'[^a-z0-9 ]',' ','g')), E'\\s+')) token
  WHERE length(token)>2 AND token <> ALL(ARRAY[
    'the','and','for','from','with','that','this','those','your','you','our','are','can','could','would',
    'what','which','who','where','when','how','tell','about','does','after','into','their','they','have','has'
  ]);
  IF query_text IS NULL OR query_text='' THEN RETURN; END IF;
  query_ts:=to_tsquery('simple',query_text);
  SELECT "eligibilityGeneration" INTO STRICT current_g
    FROM "PropertyIntelligencePolicy" WHERE "propertyId"=p_property;
  RETURN QUERY
  SELECT e.id,g.id,c.id,wp.url,wp.title,c.content,e.category,
    ts_rank_cd(
      setweight(to_tsvector('simple',coalesce(e.question,'')||' '||coalesce(e.category,'')),'A') ||
      setweight(to_tsvector('simple',coalesce(e.answer,'')),'B'),query_ts)::real
  FROM "KnowledgeServingPointer" sp
  JOIN "KnowledgePublication" kp
    ON (kp."propertyId",kp.audience,kp.id)=(sp."propertyId",sp.audience,sp."publicationId")
  JOIN "KnowledgePublicationClaim" pc
    ON pc."propertyId"=kp."propertyId" AND pc."publicationId"=kp.id
  JOIN "KnowledgeEntry" e
    ON (e."propertyId",e."claimIdentityId",e.id,e."sealManifestHash")=
       (pc."propertyId",pc."claimIdentityId",pc."entryId",pc."sealManifestHash")
  JOIN "WebsiteCrawlGeneration" g
    ON g."propertyId"=e."propertyId" AND g.status='ACTIVE'
  JOIN "WebsiteCrawlChunk" c
    ON c."propertyId"=g."propertyId" AND c."generationId"=g.id
   AND c.id=substring(e.question from '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$')
  JOIN "WebsiteCrawlPage" wp
    ON (wp."propertyId",wp."generationId",wp.id)=(c."propertyId",c."generationId",c."pageId")
  WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC'
    AND kp.state='SEALED' AND kp."revokedAt" IS NULL
    AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),current_g)
    AND (
      setweight(to_tsvector('simple',coalesce(e.question,'')||' '||coalesce(e.category,'')),'A') ||
      setweight(to_tsvector('simple',coalesce(e.answer,'')),'B')
    ) @@ query_ts
  ORDER BY score DESC,e.id
  LIMIT greatest(1,least(coalesce(p_limit,3),5));
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.search_canonical_public_crawl_evidence(text,text,integer)
  FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.search_canonical_public_crawl_evidence(text,text,integer)
  TO aifrogi_public;
