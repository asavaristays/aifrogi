\set ON_ERROR_STOP on
-- Runs after the signed and multi-source fixtures on a disposable database.

INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES
 ('purge-approver-grant','property-release-test','purge-approver','aifrogi_publisher','KNOWLEDGE_PURGE_APPROVE'),
 ('purge-worker-grant','property-release-test','purge-worker','aifrogi_worker','KNOWLEDGE_PURGE');

INSERT INTO "KnowledgeObjectReference"(id,"propertyId","objectId","sourceId",purpose,"retainUntil","releasedAt") VALUES
 ('purge-ref','property-release-test','ko-pdf','ks-pdf','RETENTION_TEST',clock_timestamp()-interval '1 day',clock_timestamp()-interval '2 days'),
 ('purge-hold-ref','property-release-test','ko-sheet','ks-sheet','RETENTION_HOLD_TEST',clock_timestamp()-interval '1 day',clock_timestamp()-interval '2 days');
UPDATE "KnowledgeObject" SET "retainUntil"=clock_timestamp()-interval '1 day' WHERE id IN ('ko-pdf','ko-sheet');
UPDATE "KnowledgeObjectReference" SET "legalHold"=true WHERE id='purge-hold-ref';
UPDATE "KnowledgeObject" SET "legalHold"=true WHERE id='ko-sheet';

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','purge-approver',false),set_config('app.system_purpose','KNOWLEDGE_PURGE_APPROVE',false);
SELECT aifrogi_security.approve_payload_disposal('property-release-test','purge-ref','retention-v1','purge-approver','payload retention expired') AS decision_id \gset
DO $$ BEGIN
 PERFORM aifrogi_security.approve_payload_disposal('property-release-test','purge-hold-ref','retention-v1','purge-approver','must remain held');
 RAISE EXCEPTION 'LEGAL_HOLD_APPROVED_FOR_DISPOSAL';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'OBJECT_REFERENCE_RETENTION_BLOCK' THEN RAISE; END IF; END $$;
DO $$ BEGIN
 PERFORM aifrogi_security.approve_payload_disposal('property-other-test','purge-ref','retention-v1','purge-approver','cross property');
 RAISE EXCEPTION 'CROSS_PROPERTY_DISPOSAL_APPROVED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUTHORITY_CONTEXT_DENIED' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;

SELECT encode(digest(convert_to("objectKey",'UTF8'),'sha256'),'hex') AS expected_key_hash FROM "KnowledgeObject" WHERE id='ko-pdf' \gset
SET SESSION AUTHORIZATION aifrogi_worker;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','purge-worker',false),set_config('app.system_purpose','KNOWLEDGE_PURGE',false);
DO $$ BEGIN
 PERFORM aifrogi_security.confirm_payload_disposal('property-release-test','ko-pdf','purge-operation-wrong',repeat('0',64),'purge-worker');
 RAISE EXCEPTION 'WRONG_OBJECT_KEY_CONFIRMED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'PAYLOAD_OBJECT_KEY_MISMATCH' THEN RAISE; END IF; END $$;
SELECT aifrogi_security.confirm_payload_disposal('property-release-test','ko-pdf','purge-operation-1',:'expected_key_hash','purge-worker') AS disposal_audit_id \gset
SELECT aifrogi_security.confirm_payload_disposal('property-release-test','ko-pdf','purge-operation-1',:'expected_key_hash','purge-worker') AS repeated_audit_id \gset
DO $$ BEGIN
 PERFORM aifrogi_security.confirm_payload_disposal('property-release-test','ko-sheet','purge-operation-1',repeat('0',64),'purge-worker');
 RAISE EXCEPTION 'DISPOSAL_OPERATION_KEY_REUSED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'PAYLOAD_DISPOSAL_OPERATION_KEY_REUSED' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;

SELECT set_config('test.disposal_audit_id',:'disposal_audit_id',false),set_config('test.repeated_audit_id',:'repeated_audit_id',false),set_config('test.decision_id',:'decision_id',false);
DO $$ BEGIN
 IF current_setting('test.disposal_audit_id')<>current_setting('test.repeated_audit_id') THEN RAISE EXCEPTION 'PAYLOAD_DISPOSAL_NOT_IDEMPOTENT'; END IF;
END $$;

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "KnowledgeObject" WHERE id='ko-pdf' AND state='RETAINED_ORPHAN' AND "payloadDisposedAt" IS NOT NULL AND "objectKey" LIKE 'disposed/%' AND "originalObjectKeyHash" ~ '^[0-9a-f]{64}$') THEN RAISE EXCEPTION 'PAYLOAD_LOCATOR_NOT_SCRUBBED'; END IF;
 IF (SELECT count(*) FROM "KnowledgePayloadDisposalAudit" WHERE "operationKey"='purge-operation-1')<>1 THEN RAISE EXCEPTION 'DISPOSAL_AUDIT_CARDINALITY_WRONG'; END IF;
 IF (SELECT count(*) FROM "CaptureVersion" WHERE id='cv-pdf')<>1 THEN RAISE EXCEPTION 'CAPTURE_AUDIT_METADATA_REMOVED'; END IF;
 IF (SELECT count(*) FROM "KnowledgeRetentionDecision" WHERE id=current_setting('test.decision_id'))<>1 THEN RAISE EXCEPTION 'RETENTION_DECISION_REMOVED'; END IF;
 IF has_table_privilege('aifrogi_worker','"KnowledgeObject"','UPDATE') THEN RAISE EXCEPTION 'WORKER_DIRECT_OBJECT_UPDATE_ALLOWED'; END IF;
 IF has_table_privilege('aifrogi_worker','"KnowledgePayloadDisposalAudit"','INSERT') THEN RAISE EXCEPTION 'WORKER_DIRECT_DISPOSAL_AUDIT_INSERT_ALLOWED'; END IF;
END $$;

DO $$ BEGIN
 UPDATE "KnowledgePayloadDisposalAudit" SET checksum='tampered' WHERE "operationKey"='purge-operation-1';
 RAISE EXCEPTION 'DISPOSAL_AUDIT_MUTABLE';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'KnowledgePayloadDisposalAudit_APPEND_ONLY' THEN RAISE; END IF; END $$;

SELECT 'RETENTION_PAYLOAD_DISPOSAL_PASS' AS result;
