\set ON_ERROR_STOP on
DO $$ BEGIN
 IF current_database() NOT LIKE 'aifrogi_answer_review_%' THEN RAISE EXCEPTION 'SYNTHETIC_TEST_DATABASE_REQUIRED'; END IF;
END $$;
BEGIN;
SET SESSION AUTHORIZATION aifrogi_public;
SELECT set_config('app.organization_id','delivery-org',false),set_config('app.property_id','delivery-property',false),set_config('app.security_actor','public-bot:delivery-property',false),set_config('app.system_purpose','PUBLIC_ANSWER',false);
DO $$ BEGIN
 IF (SELECT count(*) FROM aifrogi_security.public_active_release_evidence('delivery-property'))<>1 THEN RAISE EXCEPTION 'ELIGIBLE_EVIDENCE_NOT_RETURNED'; END IF;
 IF (SELECT canonical_answer FROM aifrogi_security.public_active_release_evidence('delivery-property'))<>'Check-in is at 2 PM.' THEN RAISE EXCEPTION 'WRONG_EVIDENCE'; END IF;
 BEGIN PERFORM 1 FROM public."KnowledgeReleaseActivePointer"; RAISE EXCEPTION 'RAW_TABLE_ACCESS_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.organization_id','other-org',false);
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'INVALID_CONTEXT_ALLOWED:organization_id'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.organization_id','delivery-org',false);
SELECT set_config('app.property_id','other-property',false);
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'INVALID_CONTEXT_ALLOWED:property_id'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.property_id','delivery-property',false);
SELECT set_config('app.security_actor','ungranted-actor',false);
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'INVALID_CONTEXT_ALLOWED:security_actor'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.security_actor','public-bot:delivery-property',false);
SELECT set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'INVALID_CONTEXT_ALLOWED:system_purpose'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.system_purpose','PUBLIC_ANSWER',false);
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('other-property'); RAISE EXCEPTION 'OTHER_BUSINESS_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.organization_id','other-org',false),set_config('app.property_id','other-property',false),set_config('app.security_actor','public-bot:other-property',false);
DO $$ BEGIN
 IF (SELECT count(*) FROM aifrogi_security.public_active_release_evidence('other-property'))<>1 THEN RAISE EXCEPTION 'SECOND_BUSINESS_NOT_RETRIEVABLE'; END IF;
 IF (SELECT canonical_answer FROM aifrogi_security.public_active_release_evidence('other-property'))<>'Check-in is at 3 PM.' THEN RAISE EXCEPTION 'CROSS_BUSINESS_EVIDENCE'; END IF;
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'CROSS_BUSINESS_CALL_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.organization_id','delivery-org',false),set_config('app.property_id','delivery-property',false),set_config('app.security_actor','public-bot:delivery-property',false);
RESET SESSION AUTHORIZATION;
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'WRONG_SESSION_ROLE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SAVEPOINT eligible_fixture;
UPDATE "KnowledgeRuntimePrincipalGrant" SET "revokedAt"=clock_timestamp() WHERE id='delivery-public-grant';
SET SESSION AUTHORIZATION aifrogi_public;
DO $$ BEGIN
 BEGIN PERFORM * FROM aifrogi_security.public_active_release_evidence('delivery-property'); RAISE EXCEPTION 'REVOKED_PRINCIPAL_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK TO eligible_fixture;
-- Simulate time passing after approval; write-time consent validation otherwise
-- prevents constructing an expired approved consent. Test database only, rolled back.
ALTER TABLE "WebsiteSourceConsent" DISABLE TRIGGER "WebsiteSourceConsent_source_match";
UPDATE "WebsiteSourceConsent" SET "effectiveUntil"=clock_timestamp()-interval '1 second' WHERE id='delivery-consent';
SET SESSION AUTHORIZATION aifrogi_public;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM aifrogi_security.public_active_release_evidence('delivery-property')) THEN RAISE EXCEPTION 'EXPIRED_CONSENT_DELIVERED'; END IF;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK TO eligible_fixture;
UPDATE "KnowledgeReleaseArtifact" SET state='REVOKED',"revokedAt"=clock_timestamp() WHERE id='delivery-release';
SET SESSION AUTHORIZATION aifrogi_public;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM aifrogi_security.public_active_release_evidence('delivery-property')) THEN RAISE EXCEPTION 'REVOKED_RELEASE_DELIVERED'; END IF;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK TO eligible_fixture;
UPDATE "KnowledgeSource" SET state='REVOKED',"revokedAt"=clock_timestamp() WHERE id='delivery-source';
SET SESSION AUTHORIZATION aifrogi_public;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM aifrogi_security.public_active_release_evidence('delivery-property')) THEN RAISE EXCEPTION 'REVOKED_SOURCE_DELIVERED'; END IF;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK TO eligible_fixture;
INSERT INTO "KnowledgeRevisionEvent"(id,"propertyId","entryId","eventType","actorId",reason) VALUES('withdraw-test','delivery-property','delivery-entry','WITHDRAWN','owner','test');
SET SESSION AUTHORIZATION aifrogi_public;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM aifrogi_security.public_active_release_evidence('delivery-property')) THEN RAISE EXCEPTION 'WITHDRAWN_CLAIM_DELIVERED'; END IF;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK TO eligible_fixture;
UPDATE "KnowledgePolicyVersion" SET "freshnessRules"='{"maxAgeDays":-1}' WHERE id='delivery-policy';
SET SESSION AUTHORIZATION aifrogi_public;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM aifrogi_security.public_active_release_evidence('delivery-property')) THEN RAISE EXCEPTION 'STALE_EVIDENCE_DELIVERED'; END IF;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK TO eligible_fixture;
ROLLBACK;
SELECT 'Scoped evidence database assertions passed';
