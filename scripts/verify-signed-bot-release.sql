\set ON_ERROR_STOP on
INSERT INTO "Organization"(id,name,slug,"ownerName","ownerEmail","updatedAt") VALUES ('org-release-test','Release Test','release-test','Test Owner','owner@example.invalid',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "Property"(id,"organizationId",name,slug,"updatedAt") VALUES ('property-release-test','org-release-test','Release Property','release-property',now()),('property-other-test','org-release-test','Other Property','other-property',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES
  ('grant-release-publisher','property-release-test','release-tester','aifrogi_publisher','KNOWLEDGE_PUBLISH'),
  ('grant-release-public','property-release-test','public-release-test','aifrogi_public','PUBLIC_ANSWER') ON CONFLICT DO NOTHING;

DO $$ BEGIN
  IF has_table_privilege('aifrogi_publisher','"BotMachinePolicyArtifact"','INSERT') THEN RAISE EXCEPTION 'PUBLISHER_DIRECT_INSERT_ALLOWED'; END IF;
  IF has_table_privilege('aifrogi_public','"BotReleasePointer"','UPDATE') THEN RAISE EXCEPTION 'PUBLIC_DIRECT_POINTER_UPDATE_ALLOWED'; END IF;
  IF NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid='"BotReleaseArtifact"'::regclass) THEN RAISE EXCEPTION 'RELEASE_RLS_NOT_FORCED'; END IF;
END $$;

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.register_bot_machine_policy(
  'property-release-test',
  '{"capabilities":["ANSWER_QUESTIONS"],"channels":["WEBSITE"],"compatibility":{"channelAdapterVersions":{"WEBSITE":"1"},"minimumServingContract":1,"retrievalVersion":"active-crawl-v1","schemaVersion":"20260929233000"},"constitutionVersion":"1.1","delivery":{"adapter":"WEBSITE_HTTP","idempotencyRequired":true,"uncertainOutcomeRequired":true},"evidence":{"conflictBehavior":"FAIL_CLOSED","maximumUnits":5,"minimumScore":0.5},"handover":{"consentFields":[],"enabled":false,"responseSlaMinutes":null,"route":null},"languages":["English"],"propertyId":"property-release-test","retention":{"auditMetadataDays":365,"payloadDays":30,"policyId":"standard"},"schemaVersion":1,"sources":[{"authorityRank":1,"authorizationId":"auth-1","digest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","effectiveUntil":null,"sourceId":"source-1","type":"WEBSITE","versionId":"version-1"}],"timezone":"UTC"}',
  encode(digest(convert_to('{"capabilities":["ANSWER_QUESTIONS"],"channels":["WEBSITE"],"compatibility":{"channelAdapterVersions":{"WEBSITE":"1"},"minimumServingContract":1,"retrievalVersion":"active-crawl-v1","schemaVersion":"20260929233000"},"constitutionVersion":"1.1","delivery":{"adapter":"WEBSITE_HTTP","idempotencyRequired":true,"uncertainOutcomeRequired":true},"evidence":{"conflictBehavior":"FAIL_CLOSED","maximumUnits":5,"minimumScore":0.5},"handover":{"consentFields":[],"enabled":false,"responseSlaMinutes":null,"route":null},"languages":["English"],"propertyId":"property-release-test","retention":{"auditMetadataDays":365,"payloadDays":30,"policyId":"standard"},"schemaVersion":1,"sources":[{"authorityRank":1,"authorizationId":"auth-1","digest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","effectiveUntil":null,"sourceId":"source-1","type":"WEBSITE","versionId":"version-1"}],"timezone":"UTC"}','UTF8'),'sha256'),'hex'),
  'test-signature','test-key','release-tester') AS policy_id \gset

RESET SESSION AUTHORIZATION;
SELECT "policyHash" AS policy_hash FROM "BotMachinePolicyArtifact" WHERE id=:'policy_id' \gset
SELECT r."manifestHash" AS active_knowledge_hash
  FROM "KnowledgeReleaseActivePointer" p
  JOIN "KnowledgeReleaseArtifact" r
    ON r.id=p."releaseArtifactId" AND r."propertyId"=p."propertyId"
 WHERE p."propertyId"='property-release-test' \gset
SELECT COALESCE((SELECT "pointerGeneration" FROM "BotReleasePointer" WHERE "propertyId"='property-release-test'),0) AS initial_generation \gset
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT '{"applicationBuildId":"build-1","channelAdapterVersions":{"WEBSITE":"1"},"createdAt":"2026-09-29T00:00:00.000Z","databaseSchemaVersion":"20260929233000","knowledgeReleaseHash":"'||:'active_knowledge_hash'||'","policyHash":"'||:'policy_hash'||'","propertyId":"property-release-test","releaseId":"release-1","retrievalVersion":"active-crawl-v1","schemaVersion":1,"servingContract":1}' AS release_payload \gset
SELECT aifrogi_security.register_bot_release('property-release-test',:'policy_id',:'release_payload',encode(digest(convert_to(:'release_payload','UTF8'),'sha256'),'hex'),'release-signature','test-key','release-tester') AS release_id \gset
SELECT aifrogi_security.activate_bot_release('property-release-test',:'release_id',:'initial_generation','release-tester') AS generation \gset

SELECT replace(:'release_payload','release-1','release-2') AS release_payload_2 \gset
SELECT aifrogi_security.register_bot_release('property-release-test',:'policy_id',:'release_payload_2',encode(digest(convert_to(:'release_payload_2','UTF8'),'sha256'),'hex'),'release-signature-2','test-key','release-tester') AS release_id_2 \gset
SELECT set_config('test.release_id_2',:'release_id_2',false);
DO $$ BEGIN
  PERFORM aifrogi_security.activate_bot_release('property-release-test',current_setting('test.release_id_2'),:'initial_generation','release-tester');
  RAISE EXCEPTION 'STALE_POINTER_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'BOT_RELEASE_POINTER_STALE' THEN RAISE; END IF; END $$;
DO $$ BEGIN
  PERFORM aifrogi_security.register_bot_machine_policy('property-other-test','{}','bad','bad','bad','release-tester');
  RAISE EXCEPTION 'CROSS_PROPERTY_CONTEXT_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'AUTHORITY_CONTEXT_DENIED' THEN RAISE; END IF; END $$;

RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION aifrogi_public;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','public-release-test',false),set_config('app.system_purpose','PUBLIC_ANSWER',false);
DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM aifrogi_security.active_bot_release('property-release-test'); IF n<>1 THEN RAISE EXCEPTION 'ACTIVE_RELEASE_LOOKUP_FAILED'; END IF; END $$;
RESET SESSION AUTHORIZATION;

DO $$ BEGIN
  IF (SELECT "pointerGeneration" FROM "BotReleasePointer" WHERE "propertyId"='property-release-test')<>:'initial_generation'::bigint+1 THEN RAISE EXCEPTION 'ACTIVATION_GENERATION_WRONG'; END IF;
  IF (SELECT count(*) FROM "BotReleaseArtifact" WHERE "propertyId"='property-release-test' AND state='ACTIVE')<>1 THEN RAISE EXCEPTION 'ACTIVE_RELEASE_CARDINALITY_WRONG'; END IF;
END $$;
SELECT 'SIGNED_BOT_RELEASE_BEHAVIOR_PASS' AS result;
