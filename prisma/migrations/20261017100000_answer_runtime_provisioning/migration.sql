-- Internal preview is owner-scoped and cannot activate the public bot.
CREATE FUNCTION aifrogi_security.provision_owner_answer_preview(p_property text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE principal text;
BEGIN
 IF NOT aifrogi_security.rag_owner_authorized(p_property,p_actor) THEN RAISE EXCEPTION 'OWNER_AUTHORITY_REQUIRED'; END IF;
 principal:='owner-preview:'||p_property||':'||lower(p_actor);
 INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose,"expiresAt")
 VALUES(gen_random_uuid()::text,p_property,principal,'aifrogi_public','PUBLIC_ANSWER',clock_timestamp()+interval '15 minutes')
 ON CONFLICT("propertyId","principalId","databaseRole",purpose) DO UPDATE SET "revokedAt"=NULL,"expiresAt"=clock_timestamp()+interval '15 minutes';
 RETURN principal;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.provision_owner_answer_preview(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.provision_owner_answer_preview(text,text) TO leados_app;

-- Called in the existing Super Admin lifecycle transaction, after its gates.
-- Never changes a lifecycle, serving pointer, knowledge record or approval.
CREATE FUNCTION aifrogi_security.sync_website_bot_runtime(p_organization text,p_actor text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE workspace record; bot_status text; principal text;
BEGIN
 IF session_user<>'leados_app' OR NOT aifrogi_security.has_platform_authority()
 OR p_actor IS NULL OR btrim(p_actor)='' OR NOT (current_setting('app.security_actor',true)=p_actor OR right(current_setting('app.security_actor',true),length(p_actor)+1)=':'||p_actor) THEN RAISE EXCEPTION 'PLATFORM_AUTHORITY_REQUIRED'; END IF;
 SELECT status INTO STRICT bot_status FROM "BotProfile" WHERE "organizationId"=p_organization;
 FOR workspace IN SELECT id,slug FROM "Property" WHERE "organizationId"=p_organization LOOP
  principal:='public-bot:'||workspace.slug;
  IF bot_status='LIVE' THEN
   IF NOT EXISTS(SELECT 1 FROM "KnowledgeServingPointer" WHERE "propertyId"=workspace.id AND audience='PUBLIC') THEN RAISE EXCEPTION 'PUBLICATION_REQUIRED'; END IF;
   INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose)
   VALUES(gen_random_uuid()::text,workspace.id,principal,'aifrogi_public','PUBLIC_ANSWER'),(gen_random_uuid()::text,workspace.id,principal,'aifrogi_web','PUBLIC_GUEST')
   ON CONFLICT("propertyId","principalId","databaseRole",purpose) DO UPDATE SET "revokedAt"=NULL,"expiresAt"=NULL;
  ELSE
   UPDATE "KnowledgeRuntimePrincipalGrant" SET "revokedAt"=clock_timestamp()
   WHERE "propertyId"=workspace.id AND "principalId"=principal
   AND (("databaseRole"='aifrogi_public' AND purpose='PUBLIC_ANSWER') OR ("databaseRole"='aifrogi_web' AND purpose='PUBLIC_GUEST')) AND "revokedAt" IS NULL;
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.sync_website_bot_runtime(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.sync_website_bot_runtime(text,text) TO leados_app;
