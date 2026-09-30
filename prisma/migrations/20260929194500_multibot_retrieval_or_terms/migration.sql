CREATE OR REPLACE FUNCTION aifrogi_security.retrieve_active_website_chunks(p_property text,p_query text,p_limit int DEFAULT 6)
RETURNS TABLE(generation_id text,page_id text,chunk_id text,url text,title text,content text,rank real)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE query_terms text; search_query tsquery;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  SELECT string_agg(quote_literal(term), ' | ') INTO query_terms
    FROM (SELECT DISTINCT lower(x) term FROM regexp_split_to_table(p_query,'[^[:alnum:]@.+-]+') x WHERE length(x)>=2 LIMIT 20) q;
  IF query_terms IS NULL THEN RETURN; END IF;
  search_query:=to_tsquery('simple',query_terms);
  RETURN QUERY SELECT g.id,p.id,c.id,p.url,p.title,c.content,ts_rank_cd(to_tsvector('simple',c.content),search_query)
  FROM "WebsiteCrawlGeneration" g JOIN "WebsiteCrawlPage" p ON (p."propertyId",p."generationId")=(g."propertyId",g.id) JOIN "WebsiteCrawlChunk" c ON (c."propertyId",c."generationId",c."pageId")=(p."propertyId",p."generationId",p.id)
  WHERE g."propertyId"=p_property AND g.status='ACTIVE' AND to_tsvector('simple',c.content) @@ search_query
  ORDER BY 7 DESC,c.ordinal ASC LIMIT LEAST(GREATEST(p_limit,1),12);
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.retrieve_active_website_chunks(text,text,int) FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.retrieve_active_website_chunks(text,text,int) TO aifrogi_public;
