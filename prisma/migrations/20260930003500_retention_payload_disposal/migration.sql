-- Two-person payload disposal: publisher approval followed by worker
-- confirmation after external bytes have been deleted. Audit metadata remains.
ALTER TABLE "KnowledgeObject"
  ADD COLUMN "payloadDisposedAt" timestamptz,
  ADD COLUMN "payloadDisposedBy" text,
  ADD COLUMN "disposalOperationKey" text,
  ADD COLUMN "originalObjectKeyHash" text;

CREATE UNIQUE INDEX "KnowledgeObject_property_disposal_operation_key"
  ON "KnowledgeObject"("propertyId","disposalOperationKey")
  WHERE "disposalOperationKey" IS NOT NULL;

CREATE TABLE "KnowledgePayloadDisposalAudit" (
  id text PRIMARY KEY,
  "propertyId" text NOT NULL,
  "objectId" text NOT NULL,
  "operationKey" text NOT NULL,
  "objectKeyHash" text NOT NULL,
  checksum text NOT NULL,
  "policyVersion" text NOT NULL,
  "disposedBy" text NOT NULL,
  "disposedAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "KnowledgePayloadDisposalAudit_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgePayloadDisposalAudit_object_fkey" FOREIGN KEY ("propertyId","objectId") REFERENCES "KnowledgeObject"("propertyId",id) ON DELETE RESTRICT,
  CONSTRAINT "KnowledgePayloadDisposalAudit_key_hash_ck" CHECK ("objectKeyHash" ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX "KnowledgePayloadDisposalAudit_property_operation_key" ON "KnowledgePayloadDisposalAudit"("propertyId","operationKey");
CREATE UNIQUE INDEX "KnowledgePayloadDisposalAudit_property_id_key" ON "KnowledgePayloadDisposalAudit"("propertyId",id);
ALTER TABLE "KnowledgePayloadDisposalAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgePayloadDisposalAudit" FORCE ROW LEVEL SECURITY;
CREATE POLICY aifrogi_property_isolation ON "KnowledgePayloadDisposalAudit" FOR ALL
 USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))
 WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));
CREATE TRIGGER "KnowledgePayloadDisposalAudit_append_only" BEFORE UPDATE OR DELETE ON "KnowledgePayloadDisposalAudit" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();

CREATE FUNCTION aifrogi_security.approve_payload_disposal(
 p_property text,p_reference text,p_policy text,p_actor text,p_reason text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r "KnowledgeObjectReference"%ROWTYPE; v_id text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PURGE_APPROVE'],p_actor);
 IF btrim(coalesce(p_policy,''))='' OR btrim(coalesce(p_reason,''))='' THEN RAISE EXCEPTION 'DISPOSAL_APPROVAL_INCOMPLETE'; END IF;
 SELECT * INTO STRICT r FROM "KnowledgeObjectReference" WHERE ("propertyId",id)=(p_property,p_reference) FOR SHARE;
 IF r."legalHold" OR r."releasedAt" IS NULL OR r."retainUntil" IS NULL OR r."retainUntil">clock_timestamp() THEN RAISE EXCEPTION 'OBJECT_REFERENCE_RETENTION_BLOCK'; END IF;
 INSERT INTO "KnowledgeRetentionDecision"(id,"propertyId","objectReferenceId",state,"policyVersion","legalHold","decidedBy",reason)
 VALUES(gen_random_uuid()::text,p_property,p_reference,'DISPOSAL_APPROVED',p_policy,false,p_actor,p_reason)
 ON CONFLICT ("propertyId","objectReferenceId","policyVersion",state) DO NOTHING;
 SELECT id INTO STRICT v_id FROM "KnowledgeRetentionDecision" WHERE ("propertyId","objectReferenceId","policyVersion",state)=(p_property,p_reference,p_policy,'DISPOSAL_APPROVED');
 RETURN v_id;
END $$;

CREATE FUNCTION aifrogi_security.confirm_payload_disposal(
 p_property text,p_object text,p_operation_key text,p_expected_key_hash text,p_actor text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE o "KnowledgeObject"%ROWTYPE; v_audit text; v_existing_object text; v_policy text; v_key_hash text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_PURGE'],p_actor);
 IF btrim(coalesce(p_operation_key,''))='' OR p_expected_key_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'PAYLOAD_DISPOSAL_CONFIRMATION_INVALID'; END IF;
 SELECT id,"objectId" INTO v_audit,v_existing_object FROM "KnowledgePayloadDisposalAudit" WHERE ("propertyId","operationKey")=(p_property,p_operation_key);
 IF FOUND THEN
   IF v_existing_object<>p_object THEN RAISE EXCEPTION 'PAYLOAD_DISPOSAL_OPERATION_KEY_REUSED'; END IF;
   RETURN v_audit;
 END IF;
 SELECT * INTO STRICT o FROM "KnowledgeObject" WHERE ("propertyId",id)=(p_property,p_object) FOR UPDATE;
 IF o."legalHold" OR o."retainUntil" IS NULL OR o."retainUntil">clock_timestamp() THEN RAISE EXCEPTION 'OBJECT_RETENTION_BLOCK'; END IF;
 v_key_hash:=encode(digest(convert_to(o."objectKey",'UTF8'),'sha256'),'hex');
 IF v_key_hash<>p_expected_key_hash THEN RAISE EXCEPTION 'PAYLOAD_OBJECT_KEY_MISMATCH'; END IF;
 IF EXISTS (
   SELECT 1 FROM "KnowledgeObjectReference" r
   WHERE (r."propertyId",r."objectId")=(p_property,p_object)
     AND (r."legalHold" OR r."releasedAt" IS NULL OR r."retainUntil" IS NULL OR r."retainUntil">clock_timestamp()
       OR NOT EXISTS (SELECT 1 FROM "KnowledgeRetentionDecision" d WHERE (d."propertyId",d."objectReferenceId")=(r."propertyId",r.id) AND d.state='DISPOSAL_APPROVED' AND NOT d."legalHold"))
 ) THEN RAISE EXCEPTION 'OBJECT_REFERENCE_RETENTION_BLOCK'; END IF;
 SELECT max(d."policyVersion") INTO v_policy FROM "KnowledgeObjectReference" r JOIN "KnowledgeRetentionDecision" d ON (d."propertyId",d."objectReferenceId")=(r."propertyId",r.id) AND d.state='DISPOSAL_APPROVED' AND NOT d."legalHold" WHERE (r."propertyId",r."objectId")=(p_property,p_object);
 IF v_policy IS NULL THEN RAISE EXCEPTION 'PAYLOAD_DISPOSAL_APPROVAL_REQUIRED'; END IF;
 v_audit:=gen_random_uuid()::text;
 UPDATE "KnowledgeObject" SET state='RETAINED_ORPHAN',"objectKey"='disposed/'||id||'/'||left(v_key_hash,16),"stagingTokenHash"='disposed:'||v_key_hash,"payloadDisposedAt"=clock_timestamp(),"payloadDisposedBy"=p_actor,"disposalOperationKey"=p_operation_key,"originalObjectKeyHash"=v_key_hash WHERE ("propertyId",id)=(p_property,p_object);
 INSERT INTO "KnowledgePayloadDisposalAudit"(id,"propertyId","objectId","operationKey","objectKeyHash",checksum,"policyVersion","disposedBy") VALUES(v_audit,p_property,p_object,p_operation_key,v_key_hash,o.checksum,v_policy,p_actor);
 RETURN v_audit;
END $$;

REVOKE ALL ON "KnowledgePayloadDisposalAudit" FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON FUNCTION aifrogi_security.approve_payload_disposal(text,text,text,text,text),aifrogi_security.confirm_payload_disposal(text,text,text,text,text) FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.approve_payload_disposal(text,text,text,text,text) TO aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.confirm_payload_disposal(text,text,text,text,text) TO aifrogi_worker;
