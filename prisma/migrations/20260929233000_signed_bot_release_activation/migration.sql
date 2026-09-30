-- Immutable, signed per-property machine policy and release admission.
-- Direct runtime writes are forbidden; publisher routines are the only mutation path.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "BotMachinePolicyArtifact" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL,
  "schemaVersion" integer NOT NULL,
  "constitutionVersion" text NOT NULL,
  "canonicalPayload" text NOT NULL,
  "policy" jsonb NOT NULL,
  "policyHash" text NOT NULL,
  "algorithm" text NOT NULL,
  "signature" text NOT NULL,
  "signerKeyId" text NOT NULL,
  "state" text NOT NULL DEFAULT 'CANDIDATE',
  "createdBy" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "activatedAt" timestamptz,
  CONSTRAINT "BotMachinePolicyArtifact_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT,
  CONSTRAINT "BotMachinePolicyArtifact_hash_ck" CHECK ("policyHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "BotMachinePolicyArtifact_algorithm_ck" CHECK ("algorithm" = 'RSA-SHA256'),
  CONSTRAINT "BotMachinePolicyArtifact_state_ck" CHECK ("state" IN ('CANDIDATE','ACTIVE','SUPERSEDED','REVOKED')),
  CONSTRAINT "BotMachinePolicyArtifact_payload_ck" CHECK (("canonicalPayload"::jsonb) = "policy")
);
CREATE UNIQUE INDEX "BotMachinePolicyArtifact_property_hash_key" ON "BotMachinePolicyArtifact"("propertyId","policyHash");
CREATE UNIQUE INDEX "BotMachinePolicyArtifact_property_id_key" ON "BotMachinePolicyArtifact"("propertyId","id");
CREATE INDEX "BotMachinePolicyArtifact_property_state_idx" ON "BotMachinePolicyArtifact"("propertyId","state");

CREATE TABLE "BotReleaseArtifact" (
  "id" text PRIMARY KEY,
  "releaseId" text NOT NULL,
  "propertyId" text NOT NULL,
  "policyArtifactId" text NOT NULL,
  "canonicalPayload" text NOT NULL,
  "manifest" jsonb NOT NULL,
  "manifestHash" text NOT NULL,
  "policyHash" text NOT NULL,
  "knowledgeReleaseHash" text NOT NULL,
  "applicationBuildId" text NOT NULL,
  "databaseSchemaVersion" text NOT NULL,
  "servingContract" integer NOT NULL,
  "retrievalVersion" text NOT NULL,
  "algorithm" text NOT NULL,
  "signature" text NOT NULL,
  "signerKeyId" text NOT NULL,
  "state" text NOT NULL DEFAULT 'CANDIDATE',
  "createdBy" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "activatedAt" timestamptz,
  CONSTRAINT "BotReleaseArtifact_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT,
  CONSTRAINT "BotReleaseArtifact_policy_fkey" FOREIGN KEY ("propertyId","policyArtifactId") REFERENCES "BotMachinePolicyArtifact"("propertyId","id") ON DELETE RESTRICT,
  CONSTRAINT "BotReleaseArtifact_manifest_hash_ck" CHECK ("manifestHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "BotReleaseArtifact_policy_hash_ck" CHECK ("policyHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "BotReleaseArtifact_knowledge_hash_ck" CHECK ("knowledgeReleaseHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "BotReleaseArtifact_algorithm_ck" CHECK ("algorithm" = 'RSA-SHA256'),
  CONSTRAINT "BotReleaseArtifact_state_ck" CHECK ("state" IN ('CANDIDATE','ACTIVE','SUPERSEDED','REVOKED')),
  CONSTRAINT "BotReleaseArtifact_payload_ck" CHECK (("canonicalPayload"::jsonb) = "manifest"),
  CONSTRAINT "BotReleaseArtifact_contract_ck" CHECK ("servingContract" > 0)
);
CREATE UNIQUE INDEX "BotReleaseArtifact_property_release_key" ON "BotReleaseArtifact"("propertyId","releaseId");
CREATE UNIQUE INDEX "BotReleaseArtifact_property_manifest_key" ON "BotReleaseArtifact"("propertyId","manifestHash");
CREATE UNIQUE INDEX "BotReleaseArtifact_property_id_key" ON "BotReleaseArtifact"("propertyId","id");
CREATE INDEX "BotReleaseArtifact_property_state_idx" ON "BotReleaseArtifact"("propertyId","state");

CREATE TABLE "BotReleasePointer" (
  "propertyId" text PRIMARY KEY,
  "releaseArtifactId" text NOT NULL,
  "pointerGeneration" bigint NOT NULL DEFAULT 1,
  "updatedBy" text NOT NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "BotReleasePointer_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT,
  CONSTRAINT "BotReleasePointer_release_fkey" FOREIGN KEY ("propertyId","releaseArtifactId") REFERENCES "BotReleaseArtifact"("propertyId","id") ON DELETE RESTRICT,
  CONSTRAINT "BotReleasePointer_generation_ck" CHECK ("pointerGeneration" > 0)
);
CREATE UNIQUE INDEX "BotReleasePointer_property_release_key" ON "BotReleasePointer"("propertyId","releaseArtifactId");

ALTER TABLE "BotMachinePolicyArtifact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BotMachinePolicyArtifact" FORCE ROW LEVEL SECURITY;
ALTER TABLE "BotReleaseArtifact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BotReleaseArtifact" FORCE ROW LEVEL SECURITY;
ALTER TABLE "BotReleasePointer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BotReleasePointer" FORCE ROW LEVEL SECURITY;

CREATE POLICY aifrogi_property_isolation ON "BotMachinePolicyArtifact" FOR ALL
USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))
WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));
CREATE POLICY aifrogi_property_isolation ON "BotReleaseArtifact" FOR ALL
USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))
WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));
CREATE POLICY aifrogi_property_isolation ON "BotReleasePointer" FOR ALL
USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))
WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));

CREATE FUNCTION aifrogi_security.register_bot_machine_policy(
  p_property text,p_payload text,p_hash text,p_signature text,p_signer_key_id text,p_actor text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v jsonb; v_id text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  IF encode(digest(convert_to(p_payload,'UTF8'),'sha256'),'hex') <> p_hash THEN RAISE EXCEPTION 'BOT_POLICY_HASH_MISMATCH'; END IF;
  v := p_payload::jsonb;
  IF (v->>'schemaVersion')::int <> 1 OR v->>'constitutionVersion' <> '1.1' OR v->>'propertyId' <> p_property THEN RAISE EXCEPTION 'BOT_POLICY_IDENTITY_MISMATCH'; END IF;
  IF coalesce(p_signature,'')='' OR coalesce(p_signer_key_id,'')='' THEN RAISE EXCEPTION 'BOT_POLICY_SIGNATURE_REQUIRED'; END IF;
  INSERT INTO "BotMachinePolicyArtifact"("id","propertyId","schemaVersion","constitutionVersion","canonicalPayload","policy","policyHash","algorithm","signature","signerKeyId","createdBy")
  VALUES (gen_random_uuid()::text,p_property,1,'1.1',p_payload,v,p_hash,'RSA-SHA256',p_signature,p_signer_key_id,p_actor)
  ON CONFLICT ("propertyId","policyHash") DO UPDATE SET "policyHash"=EXCLUDED."policyHash"
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION aifrogi_security.register_bot_release(
  p_property text,p_policy_artifact text,p_payload text,p_hash text,p_signature text,p_signer_key_id text,p_actor text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v jsonb; v_id text; v_policy_hash text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  IF encode(digest(convert_to(p_payload,'UTF8'),'sha256'),'hex') <> p_hash THEN RAISE EXCEPTION 'BOT_RELEASE_HASH_MISMATCH'; END IF;
  v := p_payload::jsonb;
  SELECT "policyHash" INTO STRICT v_policy_hash FROM "BotMachinePolicyArtifact" WHERE "propertyId"=p_property AND id=p_policy_artifact AND state IN ('CANDIDATE','ACTIVE');
  IF (v->>'schemaVersion')::int <> 1 OR v->>'propertyId' <> p_property OR v->>'policyHash' <> v_policy_hash THEN RAISE EXCEPTION 'BOT_RELEASE_IDENTITY_MISMATCH'; END IF;
  IF coalesce(v->>'knowledgeReleaseHash','') !~ '^[0-9a-f]{64}$' OR coalesce(p_signature,'')='' OR coalesce(p_signer_key_id,'')='' THEN RAISE EXCEPTION 'BOT_RELEASE_INVALID'; END IF;
  INSERT INTO "BotReleaseArtifact"("id","releaseId","propertyId","policyArtifactId","canonicalPayload","manifest","manifestHash","policyHash","knowledgeReleaseHash","applicationBuildId","databaseSchemaVersion","servingContract","retrievalVersion","algorithm","signature","signerKeyId","createdBy")
  VALUES (gen_random_uuid()::text,v->>'releaseId',p_property,p_policy_artifact,p_payload,v,p_hash,v_policy_hash,v->>'knowledgeReleaseHash',v->>'applicationBuildId',v->>'databaseSchemaVersion',(v->>'servingContract')::int,v->>'retrievalVersion','RSA-SHA256',p_signature,p_signer_key_id,p_actor)
  ON CONFLICT ("propertyId","manifestHash") DO UPDATE SET "manifestHash"=EXCLUDED."manifestHash"
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION aifrogi_security.activate_bot_release(
  p_property text,p_release text,p_expected_generation bigint,p_actor text
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_release "BotReleaseArtifact"%ROWTYPE; v_generation bigint;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_property,7319));
  SELECT * INTO STRICT v_release FROM "BotReleaseArtifact" WHERE "propertyId"=p_property AND id=p_release AND state='CANDIDATE' FOR UPDATE;
  IF EXISTS (SELECT 1 FROM "BotReleasePointer" WHERE "propertyId"=p_property) THEN
    UPDATE "BotReleasePointer" SET "releaseArtifactId"=p_release,"pointerGeneration"="pointerGeneration"+1,"updatedBy"=p_actor,"updatedAt"=now()
      WHERE "propertyId"=p_property AND "pointerGeneration"=p_expected_generation RETURNING "pointerGeneration" INTO v_generation;
    IF NOT FOUND THEN RAISE EXCEPTION 'BOT_RELEASE_POINTER_STALE'; END IF;
  ELSE
    IF p_expected_generation <> 0 THEN RAISE EXCEPTION 'BOT_RELEASE_POINTER_STALE'; END IF;
    INSERT INTO "BotReleasePointer"("propertyId","releaseArtifactId","pointerGeneration","updatedBy") VALUES (p_property,p_release,1,p_actor) RETURNING "pointerGeneration" INTO v_generation;
  END IF;
  UPDATE "BotReleaseArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE' AND id<>p_release;
  UPDATE "BotMachinePolicyArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE' AND id<>v_release."policyArtifactId";
  UPDATE "BotMachinePolicyArtifact" SET state='ACTIVE',"activatedAt"=coalesce("activatedAt",now()) WHERE ("propertyId",id)=(p_property,v_release."policyArtifactId") AND state IN ('CANDIDATE','ACTIVE');
  IF NOT FOUND THEN RAISE EXCEPTION 'BOT_POLICY_NOT_ACTIVATABLE'; END IF;
  UPDATE "BotReleaseArtifact" SET state='ACTIVE',"activatedAt"=coalesce("activatedAt",now()) WHERE ("propertyId",id)=(p_property,p_release);
  RETURN v_generation;
END $$;

CREATE FUNCTION aifrogi_security.active_bot_release(p_property text)
RETURNS TABLE("releaseId" text,"manifestHash" text,"policyHash" text,"knowledgeReleaseHash" text,"applicationBuildId" text,"databaseSchemaVersion" text,"servingContract" integer,"retrievalVersion" text,"canonicalPayload" text,"signature" text,"signerKeyId" text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  RETURN QUERY SELECT r."releaseId",r."manifestHash",r."policyHash",r."knowledgeReleaseHash",r."applicationBuildId",r."databaseSchemaVersion",r."servingContract",r."retrievalVersion",r."canonicalPayload",r.signature,r."signerKeyId"
  FROM "BotReleasePointer" p JOIN "BotReleaseArtifact" r ON (r."propertyId",r.id)=(p."propertyId",p."releaseArtifactId")
  JOIN "BotMachinePolicyArtifact" m ON (m."propertyId",m.id)=(r."propertyId",r."policyArtifactId")
  WHERE p."propertyId"=p_property AND r.state='ACTIVE' AND m.state='ACTIVE';
END $$;

REVOKE ALL ON "BotMachinePolicyArtifact","BotReleaseArtifact","BotReleasePointer" FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT SELECT ON "BotMachinePolicyArtifact","BotReleaseArtifact","BotReleasePointer" TO aifrogi_publisher;
REVOKE ALL ON FUNCTION aifrogi_security.register_bot_machine_policy(text,text,text,text,text,text),aifrogi_security.register_bot_release(text,text,text,text,text,text,text),aifrogi_security.activate_bot_release(text,text,bigint,text),aifrogi_security.active_bot_release(text) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.register_bot_machine_policy(text,text,text,text,text,text),aifrogi_security.register_bot_release(text,text,text,text,text,text,text),aifrogi_security.activate_bot_release(text,text,bigint,text) TO aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.active_bot_release(text) TO aifrogi_public;
