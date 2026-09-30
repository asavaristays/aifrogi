CREATE TABLE "BotFactualServingControl" (
  "propertyId" text PRIMARY KEY,
  "isClosed" boolean NOT NULL DEFAULT false,
  version bigint NOT NULL DEFAULT 0 CHECK (version>=0),
  "incidentId" text,
  reason text,
  "updatedBy" text NOT NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT
);
CREATE TABLE "BotFactualServingControlEvent" (
  id text PRIMARY KEY,"propertyId" text NOT NULL,version bigint NOT NULL,"isClosed" boolean NOT NULL,
  "incidentId" text NOT NULL,reason text NOT NULL,"actorId" text NOT NULL,"occurredAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT,
  UNIQUE("propertyId",version)
);
DO $x$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['BotFactualServingControl','BotFactualServingControlEvent'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY aifrogi_property_isolation ON %I FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS(SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS(SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t);
 END LOOP; END $x$;
CREATE TRIGGER "BotFactualServingControlEvent_append_only" BEFORE UPDATE OR DELETE ON "BotFactualServingControlEvent" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();

CREATE FUNCTION aifrogi_security.set_bot_factual_closure(p_property text,p_closed boolean,p_expected_version bigint,p_incident text,p_reason text,p_actor text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE v bigint;
BEGIN
 IF NOT aifrogi_security.has_platform_authority() OR aifrogi_security.current_principal() IS DISTINCT FROM p_actor THEN RAISE EXCEPTION 'PLATFORM_AUTHORITY_REQUIRED'; END IF;
 IF btrim(coalesce(p_incident,''))='' OR btrim(coalesce(p_reason,''))='' THEN RAISE EXCEPTION 'CLOSURE_JUSTIFICATION_REQUIRED'; END IF;
 PERFORM 1 FROM "Property" WHERE id=p_property FOR SHARE; IF NOT FOUND THEN RAISE EXCEPTION 'PROPERTY_NOT_FOUND'; END IF;
 INSERT INTO "BotFactualServingControl"("propertyId","isClosed",version,"incidentId",reason,"updatedBy")
 VALUES(p_property,p_closed,1,p_incident,p_reason,p_actor) ON CONFLICT ("propertyId") DO NOTHING RETURNING version INTO v;
 IF v IS NULL THEN
  UPDATE "BotFactualServingControl" SET "isClosed"=p_closed,version=version+1,"incidentId"=p_incident,reason=p_reason,"updatedBy"=p_actor,"updatedAt"=clock_timestamp()
  WHERE "propertyId"=p_property AND version=p_expected_version RETURNING version INTO v;
  IF v IS NULL THEN RAISE EXCEPTION 'BOT_CLOSURE_VERSION_CONFLICT'; END IF;
 ELSIF p_expected_version<>0 THEN RAISE EXCEPTION 'BOT_CLOSURE_VERSION_CONFLICT'; END IF;
 INSERT INTO "BotFactualServingControlEvent"(id,"propertyId",version,"isClosed","incidentId",reason,"actorId") VALUES(gen_random_uuid()::text,p_property,v,p_closed,p_incident,p_reason,p_actor);
 RETURN v;
END $$;
CREATE FUNCTION aifrogi_security.is_bot_factual_open(p_property text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT (aifrogi_security.has_platform_authority() OR EXISTS(SELECT 1 FROM "Property" p WHERE p.id=p_property AND p."organizationId"=aifrogi_security.current_organization_id())) THEN RAISE EXCEPTION 'BOT_CLOSURE_CONTEXT_DENIED'; END IF;
 RETURN NOT coalesce((SELECT "isClosed" FROM "BotFactualServingControl" WHERE "propertyId"=p_property),false);
END $$;
REVOKE ALL ON "BotFactualServingControl","BotFactualServingControlEvent" FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON FUNCTION aifrogi_security.set_bot_factual_closure(text,boolean,bigint,text,text,text),aifrogi_security.is_bot_factual_open(text) FROM PUBLIC,leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA aifrogi_security TO leados_app;
GRANT EXECUTE ON FUNCTION aifrogi_security.set_bot_factual_closure(text,boolean,bigint,text,text,text) TO leados_app;
GRANT EXECUTE ON FUNCTION aifrogi_security.is_bot_factual_open(text) TO leados_app,aifrogi_public;
