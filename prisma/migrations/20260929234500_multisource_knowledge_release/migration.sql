-- Exact, immutable multi-source knowledge releases and atomic serving activation.
ALTER TABLE "SourceCapture" ADD CONSTRAINT "SourceCapture_release_member_key" UNIQUE ("propertyId","sourceId","sourceRevisionId","id");
ALTER TABLE "CaptureVersion" ADD CONSTRAINT "CaptureVersion_release_member_key" UNIQUE ("propertyId","captureId","id");

CREATE TABLE "KnowledgeReleaseApproval" (
  id text PRIMARY KEY, "propertyId" text NOT NULL, "manifestHash" text NOT NULL,
  decision text NOT NULL, "actorId" text NOT NULL, authority text NOT NULL,
  "decidedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "KnowledgeReleaseApproval_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseApproval_hash_ck" CHECK ("manifestHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "KnowledgeReleaseApproval_decision_ck" CHECK (decision IN ('APPROVED','REJECTED','REVOKED'))
);
CREATE UNIQUE INDEX "KnowledgeReleaseApproval_exact_key" ON "KnowledgeReleaseApproval"("propertyId","manifestHash",decision);
CREATE UNIQUE INDEX "KnowledgeReleaseApproval_property_id_key" ON "KnowledgeReleaseApproval"("propertyId",id);

CREATE TABLE "KnowledgeReleaseArtifact" (
  id text PRIMARY KEY, "releaseId" text NOT NULL, "propertyId" text NOT NULL, "approvalId" text NOT NULL,
  "canonicalPayload" text NOT NULL, manifest jsonb NOT NULL, "manifestHash" text NOT NULL, "policyHash" text NOT NULL,
  state text NOT NULL DEFAULT 'CANDIDATE', "createdBy" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
  "membershipClosedAt" timestamptz, "sealedAt" timestamptz, "revokedAt" timestamptz,
  CONSTRAINT "KnowledgeReleaseArtifact_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseArtifact_approval_fkey" FOREIGN KEY ("propertyId","approvalId") REFERENCES "KnowledgeReleaseApproval"("propertyId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseArtifact_payload_ck" CHECK (("canonicalPayload"::jsonb)=manifest),
  CONSTRAINT "KnowledgeReleaseArtifact_manifest_hash_ck" CHECK ("manifestHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "KnowledgeReleaseArtifact_policy_hash_ck" CHECK ("policyHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "KnowledgeReleaseArtifact_state_ck" CHECK (state IN ('CANDIDATE','SEALED','ACTIVE','SUPERSEDED','REVOKED'))
);
CREATE UNIQUE INDEX "KnowledgeReleaseArtifact_property_release_key" ON "KnowledgeReleaseArtifact"("propertyId","releaseId");
CREATE UNIQUE INDEX "KnowledgeReleaseArtifact_property_manifest_key" ON "KnowledgeReleaseArtifact"("propertyId","manifestHash");
CREATE UNIQUE INDEX "KnowledgeReleaseArtifact_property_id_key" ON "KnowledgeReleaseArtifact"("propertyId",id);
CREATE INDEX "KnowledgeReleaseArtifact_property_state_idx" ON "KnowledgeReleaseArtifact"("propertyId",state);

CREATE TABLE "KnowledgeReleaseMember" (
  id text PRIMARY KEY, "propertyId" text NOT NULL, "releaseArtifactId" text NOT NULL,
  "sourceId" text NOT NULL, "sourceRevisionId" text NOT NULL, "captureId" text, "captureVersionId" text,
  "sourceType" "KnowledgeSourceType" NOT NULL, "contentDigest" text NOT NULL, "authorityRank" integer NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "KnowledgeReleaseMember_release_fkey" FOREIGN KEY ("propertyId","releaseArtifactId") REFERENCES "KnowledgeReleaseArtifact"("propertyId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseMember_source_revision_fkey" FOREIGN KEY ("propertyId","sourceId","sourceRevisionId") REFERENCES "KnowledgeSourceRevision"("propertyId","sourceId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseMember_capture_fkey" FOREIGN KEY ("propertyId","sourceId","sourceRevisionId","captureId") REFERENCES "SourceCapture"("propertyId","sourceId","sourceRevisionId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseMember_capture_version_fkey" FOREIGN KEY ("propertyId","captureId","captureVersionId") REFERENCES "CaptureVersion"("propertyId","captureId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseMember_digest_ck" CHECK ("contentDigest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "KnowledgeReleaseMember_rank_ck" CHECK ("authorityRank">0),
  CONSTRAINT "KnowledgeReleaseMember_capture_pair_ck" CHECK (("captureId" IS NULL)=("captureVersionId" IS NULL))
);
CREATE UNIQUE INDEX "KnowledgeReleaseMember_exact_source_key" ON "KnowledgeReleaseMember"("propertyId","releaseArtifactId","sourceId","sourceRevisionId");
CREATE UNIQUE INDEX "KnowledgeReleaseMember_rank_key" ON "KnowledgeReleaseMember"("propertyId","releaseArtifactId","authorityRank");
CREATE UNIQUE INDEX "KnowledgeReleaseMember_property_id_key" ON "KnowledgeReleaseMember"("propertyId",id);

CREATE TABLE "KnowledgeReleaseActivePointer" (
  "propertyId" text PRIMARY KEY, "releaseArtifactId" text NOT NULL, "pointerGeneration" bigint NOT NULL DEFAULT 1,
  "updatedBy" text NOT NULL, "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "KnowledgeReleaseActivePointer_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseActivePointer_release_fkey" FOREIGN KEY ("propertyId","releaseArtifactId") REFERENCES "KnowledgeReleaseArtifact"("propertyId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgeReleaseActivePointer_generation_ck" CHECK ("pointerGeneration">0)
);
CREATE UNIQUE INDEX "KnowledgeReleaseActivePointer_release_key" ON "KnowledgeReleaseActivePointer"("propertyId","releaseArtifactId");

DO $rls$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['KnowledgeReleaseApproval','KnowledgeReleaseArtifact','KnowledgeReleaseMember','KnowledgeReleaseActivePointer'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY aifrogi_property_isolation ON public.%I FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t);
  END LOOP;
END $rls$;

CREATE FUNCTION aifrogi_security.approve_knowledge_release(p_property text,p_manifest_hash text,p_actor text,p_authority text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE v_id text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  IF p_manifest_hash !~ '^[0-9a-f]{64}$' OR coalesce(p_authority,'')='' THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_APPROVAL_INVALID'; END IF;
  INSERT INTO "KnowledgeReleaseApproval"(id,"propertyId","manifestHash",decision,"actorId",authority)
  VALUES(gen_random_uuid()::text,p_property,p_manifest_hash,'APPROVED',p_actor,p_authority)
  ON CONFLICT ("propertyId","manifestHash",decision) DO UPDATE SET "manifestHash"=EXCLUDED."manifestHash" RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION aifrogi_security.register_knowledge_release(p_property text,p_payload text,p_hash text,p_approval text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE v jsonb; v_id text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  IF encode(digest(convert_to(p_payload,'UTF8'),'sha256'),'hex')<>p_hash THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_HASH_MISMATCH'; END IF;
  v:=p_payload::jsonb;
  IF (v->>'schemaVersion')::int<>1 OR v->>'propertyId'<>p_property OR jsonb_typeof(v->'members')<>'array' OR jsonb_array_length(v->'members')=0 THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_MANIFEST_INVALID'; END IF;
  IF NOT EXISTS(SELECT 1 FROM "KnowledgeReleaseApproval" WHERE ("propertyId",id,"manifestHash",decision)=(p_property,p_approval,p_hash,'APPROVED')) THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_EXACT_APPROVAL_REQUIRED'; END IF;
  INSERT INTO "KnowledgeReleaseArtifact"(id,"releaseId","propertyId","approvalId","canonicalPayload",manifest,"manifestHash","policyHash","createdBy")
  VALUES(gen_random_uuid()::text,v->>'releaseId',p_property,p_approval,p_payload,v,p_hash,v->>'policyHash',p_actor)
  ON CONFLICT ("propertyId","manifestHash") DO UPDATE SET "manifestHash"=EXCLUDED."manifestHash" RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION aifrogi_security.add_knowledge_release_member(p_property text,p_release text,p_source text,p_revision text,p_capture text,p_capture_version text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r "KnowledgeReleaseArtifact"%ROWTYPE; s "KnowledgeSource"%ROWTYPE; sr "KnowledgeSourceRevision"%ROWTYPE; m jsonb; v_digest text; v_type "KnowledgeSourceType"; v_rank int; v_id text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  SELECT * INTO STRICT r FROM "KnowledgeReleaseArtifact" WHERE ("propertyId",id)=(p_property,p_release) AND state='CANDIDATE' AND "membershipClosedAt" IS NULL FOR UPDATE;
  SELECT * INTO STRICT s FROM "KnowledgeSource" WHERE ("propertyId",id)=(p_property,p_source) AND state='AUTHORIZED' FOR SHARE;
  SELECT * INTO STRICT sr FROM "KnowledgeSourceRevision" WHERE ("propertyId","sourceId",id)=(p_property,p_source,p_revision) FOR SHARE;
  SELECT x INTO STRICT m FROM jsonb_array_elements(r.manifest->'members') x WHERE x->>'sourceId'=p_source AND x->>'sourceRevisionId'=p_revision;
  v_type:=(m->>'sourceType')::"KnowledgeSourceType"; v_digest:=m->>'contentDigest'; v_rank:=(m->>'authorityRank')::int;
  IF v_type<>s."sourceType" OR v_digest !~ '^[0-9a-f]{64}$' OR (m->>'captureId') IS DISTINCT FROM p_capture OR (m->>'captureVersionId') IS DISTINCT FROM p_capture_version THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_MEMBER_MANIFEST_MISMATCH'; END IF;
  IF v_type IN ('FORM','OWNER_CORRECTION') THEN
    IF p_capture IS NOT NULL OR sr."configurationHash"<>v_digest THEN RAISE EXCEPTION 'STRUCTURED_SOURCE_VERSION_MISMATCH'; END IF;
  ELSE
    IF p_capture IS NULL OR NOT EXISTS(SELECT 1 FROM "CaptureVersion" cv JOIN "SourceCapture" c ON (c."propertyId",c.id)=(cv."propertyId",cv."captureId") WHERE (c."propertyId",c."sourceId",c."sourceRevisionId",c.id,cv.id,cv.checksum)=(p_property,p_source,p_revision,p_capture,p_capture_version,v_digest) AND c.status='SUCCEEDED') THEN RAISE EXCEPTION 'CAPTURE_SOURCE_VERSION_MISMATCH'; END IF;
  END IF;
  INSERT INTO "KnowledgeReleaseMember"(id,"propertyId","releaseArtifactId","sourceId","sourceRevisionId","captureId","captureVersionId","sourceType","contentDigest","authorityRank")
  VALUES(gen_random_uuid()::text,p_property,p_release,p_source,p_revision,p_capture,p_capture_version,v_type,v_digest,v_rank) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION aifrogi_security.seal_knowledge_release(p_property text,p_release text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE r "KnowledgeReleaseArtifact"%ROWTYPE; expected_count int; actual_count int;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  SELECT * INTO STRICT r FROM "KnowledgeReleaseArtifact" WHERE ("propertyId",id)=(p_property,p_release) AND state='CANDIDATE' FOR UPDATE;
  expected_count:=jsonb_array_length(r.manifest->'members'); SELECT count(*) INTO actual_count FROM "KnowledgeReleaseMember" WHERE ("propertyId","releaseArtifactId")=(p_property,p_release);
  IF actual_count<>expected_count OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(r.manifest->'members') x WHERE NOT EXISTS (
      SELECT 1 FROM "KnowledgeReleaseMember" m WHERE (m."propertyId",m."releaseArtifactId")=(p_property,p_release)
      AND m."sourceId"=x->>'sourceId' AND m."sourceRevisionId"=x->>'sourceRevisionId'
      AND m."sourceType"::text=x->>'sourceType' AND m."contentDigest"=x->>'contentDigest' AND m."authorityRank"=(x->>'authorityRank')::int
      AND m."captureId" IS NOT DISTINCT FROM nullif(x->>'captureId','') AND m."captureVersionId" IS NOT DISTINCT FROM nullif(x->>'captureVersionId','')
    )) THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_MEMBERSHIP_INCOMPLETE'; END IF;
  UPDATE "KnowledgeReleaseArtifact" SET state='SEALED',"membershipClosedAt"=now(),"sealedAt"=now() WHERE ("propertyId",id)=(p_property,p_release);
  RETURN r."manifestHash";
END $$;

CREATE FUNCTION aifrogi_security.activate_knowledge_release(p_property text,p_release text,p_expected_generation bigint,p_actor text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE v_generation bigint;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_property,8841));
  PERFORM 1 FROM "KnowledgeReleaseArtifact" r WHERE (r."propertyId",r.id)=(p_property,p_release) AND r.state='SEALED' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_NOT_SEALED'; END IF;
  IF EXISTS(SELECT 1 FROM "KnowledgeReleaseMember" m JOIN "KnowledgeSource" s ON (s."propertyId",s.id)=(m."propertyId",m."sourceId") JOIN "KnowledgeSourceRevision" sr ON (sr."propertyId",sr."sourceId",sr.id)=(m."propertyId",m."sourceId",m."sourceRevisionId") LEFT JOIN "WebsiteSourceConsent" c ON (c."propertyId",c.id)=(sr."propertyId",sr."consentId") WHERE (m."propertyId",m."releaseArtifactId")=(p_property,p_release) AND (s.state<>'AUTHORIZED' OR s."revokedAt" IS NOT NULL OR c.id IS NULL OR c.status='REVOKED' OR coalesce(c."effectiveFrom",c."trialAuthorizedAt")>clock_timestamp() OR coalesce(c."effectiveUntil",c."trialExpiresAt")<=clock_timestamp())) THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_SOURCE_NOT_ELIGIBLE'; END IF;
  IF EXISTS(SELECT 1 FROM "KnowledgeReleaseActivePointer" WHERE "propertyId"=p_property) THEN
    UPDATE "KnowledgeReleaseActivePointer" SET "releaseArtifactId"=p_release,"pointerGeneration"="pointerGeneration"+1,"updatedBy"=p_actor,"updatedAt"=now() WHERE "propertyId"=p_property AND "pointerGeneration"=p_expected_generation RETURNING "pointerGeneration" INTO v_generation;
    IF NOT FOUND THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_POINTER_STALE'; END IF;
  ELSE
    IF p_expected_generation<>0 THEN RAISE EXCEPTION 'KNOWLEDGE_RELEASE_POINTER_STALE'; END IF;
    INSERT INTO "KnowledgeReleaseActivePointer"("propertyId","releaseArtifactId","pointerGeneration","updatedBy") VALUES(p_property,p_release,1,p_actor) RETURNING "pointerGeneration" INTO v_generation;
  END IF;
  UPDATE "KnowledgeReleaseArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE' AND id<>p_release;
  UPDATE "KnowledgeReleaseArtifact" SET state='ACTIVE' WHERE ("propertyId",id)=(p_property,p_release);
  RETURN v_generation;
END $$;

CREATE FUNCTION aifrogi_security.active_knowledge_release(p_property text)
RETURNS TABLE("releaseId" text,"manifestHash" text,"policyHash" text,"pointerGeneration" bigint,manifest jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
  RETURN QUERY SELECT r."releaseId",r."manifestHash",r."policyHash",p."pointerGeneration",r.manifest FROM "KnowledgeReleaseActivePointer" p JOIN "KnowledgeReleaseArtifact" r ON (r."propertyId",r.id)=(p."propertyId",p."releaseArtifactId") WHERE p."propertyId"=p_property AND r.state='ACTIVE';
END $$;

-- A bot release cannot become active unless its signed knowledge hash is the
-- exact currently active multi-source release. This closes the signature chain.
CREATE OR REPLACE FUNCTION aifrogi_security.activate_bot_release(
  p_property text,p_release text,p_expected_generation bigint,p_actor text
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_release "BotReleaseArtifact"%ROWTYPE; v_generation bigint; v_knowledge_hash text;
BEGIN
  PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_property,7319));
  SELECT * INTO STRICT v_release FROM "BotReleaseArtifact" WHERE "propertyId"=p_property AND id=p_release AND state='CANDIDATE' FOR UPDATE;
  SELECT r."manifestHash" INTO v_knowledge_hash FROM "KnowledgeReleaseActivePointer" p JOIN "KnowledgeReleaseArtifact" r ON (r."propertyId",r.id)=(p."propertyId",p."releaseArtifactId") WHERE p."propertyId"=p_property AND r.state='ACTIVE' FOR SHARE OF r;
  IF v_knowledge_hash IS NULL OR v_release."knowledgeReleaseHash"<>v_knowledge_hash THEN RAISE EXCEPTION 'BOT_RELEASE_KNOWLEDGE_NOT_ACTIVE'; END IF;
  IF EXISTS (SELECT 1 FROM "BotReleasePointer" WHERE "propertyId"=p_property) THEN
    UPDATE "BotReleasePointer" SET "releaseArtifactId"=p_release,"pointerGeneration"="pointerGeneration"+1,"updatedBy"=p_actor,"updatedAt"=now() WHERE "propertyId"=p_property AND "pointerGeneration"=p_expected_generation RETURNING "pointerGeneration" INTO v_generation;
    IF NOT FOUND THEN RAISE EXCEPTION 'BOT_RELEASE_POINTER_STALE'; END IF;
  ELSE
    IF p_expected_generation<>0 THEN RAISE EXCEPTION 'BOT_RELEASE_POINTER_STALE'; END IF;
    INSERT INTO "BotReleasePointer"("propertyId","releaseArtifactId","pointerGeneration","updatedBy") VALUES (p_property,p_release,1,p_actor) RETURNING "pointerGeneration" INTO v_generation;
  END IF;
  UPDATE "BotReleaseArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE' AND id<>p_release;
  UPDATE "BotMachinePolicyArtifact" SET state='SUPERSEDED' WHERE "propertyId"=p_property AND state='ACTIVE' AND id<>v_release."policyArtifactId";
  UPDATE "BotMachinePolicyArtifact" SET state='ACTIVE',"activatedAt"=coalesce("activatedAt",now()) WHERE ("propertyId",id)=(p_property,v_release."policyArtifactId") AND state IN ('CANDIDATE','ACTIVE');
  IF NOT FOUND THEN RAISE EXCEPTION 'BOT_POLICY_NOT_ACTIVATABLE'; END IF;
  UPDATE "BotReleaseArtifact" SET state='ACTIVE',"activatedAt"=coalesce("activatedAt",now()) WHERE ("propertyId",id)=(p_property,p_release);
  RETURN v_generation;
END $$;

REVOKE ALL ON "KnowledgeReleaseApproval","KnowledgeReleaseArtifact","KnowledgeReleaseMember","KnowledgeReleaseActivePointer" FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON FUNCTION aifrogi_security.approve_knowledge_release(text,text,text,text),aifrogi_security.register_knowledge_release(text,text,text,text,text),aifrogi_security.add_knowledge_release_member(text,text,text,text,text,text,text),aifrogi_security.seal_knowledge_release(text,text,text),aifrogi_security.activate_knowledge_release(text,text,bigint,text),aifrogi_security.active_knowledge_release(text) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.approve_knowledge_release(text,text,text,text),aifrogi_security.register_knowledge_release(text,text,text,text,text),aifrogi_security.add_knowledge_release_member(text,text,text,text,text,text,text),aifrogi_security.seal_knowledge_release(text,text,text),aifrogi_security.activate_knowledge_release(text,text,bigint,text) TO aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.active_knowledge_release(text) TO aifrogi_public;
