\set ON_ERROR_STOP on
-- Runs after signed-bot and multi-source fixtures on a disposable database.

INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose)
VALUES('rollback-publisher-grant','property-release-test','rollback-tester','aifrogi_publisher','KNOWLEDGE_ROLLBACK');
UPDATE "KnowledgeSource" SET state='AUTHORIZED',"revokedAt"=NULL,"updatedAt"=clock_timestamp() WHERE ("propertyId",id)=('property-release-test','ks-pdf');

SELECT id AS forward_knowledge_id,"manifestHash" AS forward_knowledge_hash FROM "KnowledgeReleaseArtifact" WHERE ("propertyId","releaseId")=('property-release-test','knowledge-release-2') \gset
SELECT id AS rollback_knowledge_id,"manifestHash" AS rollback_knowledge_hash FROM "KnowledgeReleaseArtifact" WHERE ("propertyId","releaseId")=('property-release-test','knowledge-release-1') \gset
SELECT id AS rollback_bot_id,manifest AS rollback_bot_manifest FROM "BotReleaseArtifact" WHERE ("propertyId","releaseId")=('property-release-test','bot-release-knowledge-bound') \gset
SELECT id AS policy_id,"policyHash" AS policy_hash FROM "BotMachinePolicyArtifact" WHERE "propertyId"='property-release-test' AND state='ACTIVE' \gset

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.activate_knowledge_release('property-release-test',:'forward_knowledge_id',2,'release-tester');
SELECT jsonb_build_object('schemaVersion',1,'releaseId','bot-release-forward','propertyId','property-release-test','policyHash',:'policy_hash','knowledgeReleaseHash',:'forward_knowledge_hash','applicationBuildId','build-forward','databaseSchemaVersion','20260929234500','servingContract',1,'retrievalVersion','active-crawl-v1','channelAdapterVersions',jsonb_build_object('WEBSITE','1'),'createdAt','2026-09-30T00:00:00.000Z')::text AS forward_bot_payload \gset
SELECT encode(digest(convert_to(:'forward_bot_payload','UTF8'),'sha256'),'hex') AS forward_bot_hash \gset
SELECT aifrogi_security.register_bot_release('property-release-test',:'policy_id',:'forward_bot_payload',:'forward_bot_hash','forward-signature','test-key','release-tester') AS forward_bot_id \gset
SELECT aifrogi_security.activate_bot_release('property-release-test',:'forward_bot_id',1,'release-tester');
RESET SESSION AUTHORIZATION;

SELECT jsonb_build_object(
 'applicationBuildId',manifest->>'applicationBuildId',
 'databaseSchemaVersion',manifest->>'databaseSchemaVersion',
 'servingContract',manifest->>'servingContract',
 'retrievalVersion',manifest->>'retrievalVersion',
 'channelAdapterVersions',manifest->'channelAdapterVersions'
)::text AS rollback_runtime FROM "BotReleaseArtifact" WHERE id=:'rollback_bot_id' \gset
SELECT jsonb_build_object('applicationBuildId','wrong-build','databaseSchemaVersion','20260929234500','servingContract','1','retrievalVersion','active-crawl-v1','channelAdapterVersions',jsonb_build_object('WEBSITE','1'))::text AS wrong_runtime \gset

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','rollback-tester',false),set_config('app.system_purpose','KNOWLEDGE_ROLLBACK',false);
SELECT set_config('test.rollback_knowledge_id',:'rollback_knowledge_id',false),set_config('test.rollback_bot_id',:'rollback_bot_id',false),set_config('test.rollback_runtime',:'rollback_runtime',false),set_config('test.wrong_runtime',:'wrong_runtime',false);
DO $$ BEGIN
 PERFORM aifrogi_security.rollback_knowledge_release('property-release-test',current_setting('test.rollback_knowledge_id'),current_setting('test.rollback_bot_id'),3,2,current_setting('test.wrong_runtime')::jsonb,'rollback-tester');
 RAISE EXCEPTION 'INCOMPATIBLE_RUNTIME_ROLLBACK_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'ROLLBACK_RUNTIME_INCOMPATIBLE' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;

BEGIN;
UPDATE "WebsiteSourceConsent" SET status='REVOKED',"revokedAt"=clock_timestamp(),"revokedBy"='rollback-consent-test',"revocationReason"='transactional rollback compatibility test',"updatedAt"=clock_timestamp() WHERE id='kc-web';
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','rollback-tester',false),set_config('app.system_purpose','KNOWLEDGE_ROLLBACK',false);
SELECT set_config('test.rollback_knowledge_id',:'rollback_knowledge_id',false),set_config('test.rollback_bot_id',:'rollback_bot_id',false),set_config('test.rollback_runtime',:'rollback_runtime',false);
DO $$ BEGIN
 PERFORM aifrogi_security.rollback_knowledge_release('property-release-test',current_setting('test.rollback_knowledge_id'),current_setting('test.rollback_bot_id'),3,2,current_setting('test.rollback_runtime')::jsonb,'rollback-tester');
 RAISE EXCEPTION 'EXPIRED_CONSENT_ROLLBACK_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'ROLLBACK_MIXED_SOURCE_INCOMPATIBLE' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK;

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','rollback-tester',false),set_config('app.system_purpose','KNOWLEDGE_ROLLBACK',false);
SELECT aifrogi_security.rollback_knowledge_release('property-release-test',:'rollback_knowledge_id',:'rollback_bot_id',3,2,:'rollback_runtime'::jsonb,'rollback-tester') AS rollback_result \gset
RESET SESSION AUTHORIZATION;

DO $$ BEGIN
 IF (SELECT r."releaseId" FROM "KnowledgeReleaseActivePointer" p JOIN "KnowledgeReleaseArtifact" r ON r.id=p."releaseArtifactId" WHERE p."propertyId"='property-release-test')<>'knowledge-release-1' THEN RAISE EXCEPTION 'KNOWLEDGE_ROLLBACK_POINTER_WRONG'; END IF;
 IF (SELECT r."releaseId" FROM "BotReleasePointer" p JOIN "BotReleaseArtifact" r ON r.id=p."releaseArtifactId" WHERE p."propertyId"='property-release-test')<>'bot-release-knowledge-bound' THEN RAISE EXCEPTION 'BOT_ROLLBACK_POINTER_WRONG'; END IF;
 IF (SELECT "pointerGeneration" FROM "KnowledgeReleaseActivePointer" WHERE "propertyId"='property-release-test')<>4 THEN RAISE EXCEPTION 'KNOWLEDGE_ROLLBACK_GENERATION_WRONG'; END IF;
 IF (SELECT "pointerGeneration" FROM "BotReleasePointer" WHERE "propertyId"='property-release-test')<>3 THEN RAISE EXCEPTION 'BOT_ROLLBACK_GENERATION_WRONG'; END IF;
END $$;

SELECT jsonb_build_object('applicationBuildId','build-forward','databaseSchemaVersion','20260929234500','servingContract','1','retrievalVersion','active-crawl-v1','channelAdapterVersions',jsonb_build_object('WEBSITE','1'))::text AS forward_runtime \gset
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','rollback-tester',false),set_config('app.system_purpose','KNOWLEDGE_ROLLBACK',false);
SELECT set_config('test.forward_knowledge_id',:'forward_knowledge_id',false),set_config('test.forward_bot_id',:'forward_bot_id',false),set_config('test.forward_runtime',:'forward_runtime',false);
DO $$ BEGIN
 PERFORM aifrogi_security.rollback_knowledge_release('property-release-test',current_setting('test.forward_knowledge_id'),current_setting('test.forward_bot_id'),4,2,current_setting('test.forward_runtime')::jsonb,'rollback-tester');
 RAISE EXCEPTION 'STALE_BOT_POINTER_ROLLBACK_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'BOT_RELEASE_POINTER_STALE' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;

DO $$ BEGIN
 IF (SELECT r."releaseId" FROM "KnowledgeReleaseActivePointer" p JOIN "KnowledgeReleaseArtifact" r ON r.id=p."releaseArtifactId" WHERE p."propertyId"='property-release-test')<>'knowledge-release-1' THEN RAISE EXCEPTION 'PARTIAL_ROLLBACK_COMMITTED'; END IF;
 IF has_function_privilege('aifrogi_web','aifrogi_security.rollback_knowledge_release(text,text,text,bigint,bigint,jsonb,text)','EXECUTE') THEN RAISE EXCEPTION 'WEB_ROLE_CAN_ROLLBACK'; END IF;
END $$;

SELECT 'COMPATIBLE_KNOWLEDGE_ROLLBACK_PASS' AS result;
