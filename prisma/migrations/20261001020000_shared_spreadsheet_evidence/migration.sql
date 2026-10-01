CREATE OR REPLACE FUNCTION aifrogi_security.shared_answer_spreadsheet_evidence(
  p_property text, p_query text, p_limit integer DEFAULT 24
) RETURNS TABLE(evidence_id text, content text, source_url text, title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  RETURN QUERY
  SELECT e.id,
         e.answer,
         e."quoteText",
         ('Approved Excel · ' || e.category)::text
    FROM "KnowledgeEntry" e
    JOIN "KnowledgeDocument" d ON d.id=e."documentId" AND d."propertyId"=e."propertyId"
    JOIN "Property" p ON p.id=e."propertyId"
   WHERE e."propertyId"=p_property
     AND p."organizationId"=aifrogi_security.current_organization_id()
     AND e.status='PUBLISHED' AND e."conflictStatus"='CLEAR'
     AND e."fieldApprovedAt" IS NOT NULL AND e."previewApprovedAt" IS NOT NULL
     AND d.status='APPROVED' AND lower(d."fileName") LIKE '%.xlsx'
     AND e."quoteText" ~ '^https?://'
     AND (e."expiresAt" IS NULL OR e."expiresAt">clock_timestamp())
     AND to_tsvector('simple',coalesce(e.question,'')||' '||coalesce(e.answer,''))
         @@ plainto_tsquery('simple',p_query)
   ORDER BY ts_rank_cd(
       to_tsvector('simple',coalesce(e.question,'')||' '||coalesce(e.answer,'')),
       plainto_tsquery('simple',p_query)
     ) DESC, e.id
   LIMIT greatest(1,least(coalesce(p_limit,24),50));
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.shared_answer_spreadsheet_evidence(text,text,integer)
  FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.shared_answer_spreadsheet_evidence(text,text,integer)
  TO aifrogi_public;
