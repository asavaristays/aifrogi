\set ON_ERROR_STOP on
-- Standalone seed: bot-release verification may run after this fixture because
-- bot activation now correctly requires an active knowledge release.
INSERT INTO "Organization"(id,name,slug,"ownerName","ownerEmail","updatedAt") VALUES ('org-release-test','Release Test','release-test','Test Owner','owner@example.invalid',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "Property"(id,"organizationId",name,slug,"updatedAt") VALUES ('property-release-test','org-release-test','Release Property','release-property',now()),('property-other-test','org-release-test','Other Property','other-property',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES
('grant-release-publisher','property-release-test','release-tester','aifrogi_publisher','KNOWLEDGE_PUBLISH'),
('grant-release-public','property-release-test','public-release-test','aifrogi_public','PUBLIC_ANSWER') ON CONFLICT DO NOTHING;
INSERT INTO "KnowledgeSource"(id,"propertyId","sourceType","canonicalIdentity","canonicalIdentityHash",state,"audienceCeiling","currentRevision","updatedAt") VALUES
('ks-web','property-release-test','WEBSITE','https://example.invalid','1111111111111111111111111111111111111111111111111111111111111111','AUTHORIZED','PUBLIC',1,now()),
('ks-pdf','property-release-test','PDF','file:guide.pdf','2222222222222222222222222222222222222222222222222222222222222222','AUTHORIZED','PUBLIC',1,now()),
('ks-sheet','property-release-test','SPREADSHEET','file:facts.xlsx','3333333333333333333333333333333333333333333333333333333333333333','AUTHORIZED','PUBLIC',1,now()),
('ks-form','property-release-test','FORM','profile:form','4444444444444444444444444444444444444444444444444444444444444444','AUTHORIZED','PUBLIC',1,now());

INSERT INTO "WebsiteSourceConsent"(id,"propertyId","sourceUrl","sourceUrlHash","termsVersion",status,"trialAuthorizedAt","trialExpiresAt","acceptedByEmail","sourceType","canonicalIdentity","canonicalIdentityHash","sourceId","authorityScope","audienceCeiling","effectiveFrom","effectiveUntil","updatedAt") VALUES
('kc-web','property-release-test','https://example.invalid','1111111111111111111111111111111111111111111111111111111111111111','v1','TRIAL_AUTHORIZED',now()-interval '1 day',now()+interval '30 days','owner@example.invalid','WEBSITE','https://example.invalid','1111111111111111111111111111111111111111111111111111111111111111','ks-web','{"capture":true}','PUBLIC',now()-interval '1 day',now()+interval '30 days',now()),
('kc-pdf','property-release-test',NULL,'2222222222222222222222222222222222222222222222222222222222222222','v1','TRIAL_AUTHORIZED',now()-interval '1 day',now()+interval '30 days','owner@example.invalid','PDF','file:guide.pdf','2222222222222222222222222222222222222222222222222222222222222222','ks-pdf','{"capture":true}','PUBLIC',now()-interval '1 day',now()+interval '30 days',now()),
('kc-sheet','property-release-test',NULL,'3333333333333333333333333333333333333333333333333333333333333333','v1','TRIAL_AUTHORIZED',now()-interval '1 day',now()+interval '30 days','owner@example.invalid','SPREADSHEET','file:facts.xlsx','3333333333333333333333333333333333333333333333333333333333333333','ks-sheet','{"capture":true}','PUBLIC',now()-interval '1 day',now()+interval '30 days',now()),
('kc-form','property-release-test',NULL,'4444444444444444444444444444444444444444444444444444444444444444','v1','TRIAL_AUTHORIZED',now()-interval '1 day',now()+interval '30 days','owner@example.invalid','FORM','profile:form','4444444444444444444444444444444444444444444444444444444444444444','ks-form','{"capture":true}','PUBLIC',now()-interval '1 day',now()+interval '30 days',now());

INSERT INTO "KnowledgeSourceRevision"(id,"propertyId","sourceId",revision,configuration,"configurationHash","consentId","createdBy") VALUES
('kr-web','property-release-test','ks-web',1,'{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','kc-web','fixture'),
('kr-pdf','property-release-test','ks-pdf',1,'{}','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','kc-pdf','fixture'),
('kr-sheet','property-release-test','ks-sheet',1,'{}','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','kc-sheet','fixture'),
('kr-form','property-release-test','ks-form',1,'{"company":"Example"}','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd','kc-form','fixture');

INSERT INTO "AutomationJob"(id,"propertyId","workflowId","triggerType","actionType",status,payload,"idempotencyKey","completedAt","updatedAt","operationKey","operationType","canonicalInputHash","fencingToken")
VALUES('job-release-fixture','property-release-test','release-fixture','MANUAL','CAPTURE','COMPLETED','{}','job-release-fixture',now(),now(),'job-release-fixture-operation','KNOWLEDGE_CAPTURE','fixture-hash',1);
INSERT INTO "KnowledgeObject"(id,"propertyId","storageNamespace","objectKey",checksum,"byteSize","mediaType",state,"stagingTokenHash","finalizedByJobId","finalizedFence","usableAt") VALUES
('ko-web','property-release-test','fixture','web','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',10,'text/html','USABLE','stage-web','job-release-fixture',1,now()),
('ko-pdf','property-release-test','fixture','pdf','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',10,'application/pdf','USABLE','stage-pdf','job-release-fixture',1,now()),
('ko-sheet','property-release-test','fixture','sheet','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',10,'application/vnd.ms-excel','USABLE','stage-sheet','job-release-fixture',1,now());
INSERT INTO "SourceCapture"(id,"propertyId","sourceId","sourceRevisionId","requestedGeneration","operationKey",status,"completedAt") VALUES
('cap-web','property-release-test','ks-web','kr-web',1,'op-web','SUCCEEDED',now()),
('cap-pdf','property-release-test','ks-pdf','kr-pdf',1,'op-pdf','SUCCEEDED',now()),
('cap-sheet','property-release-test','ks-sheet','kr-sheet',1,'op-sheet','SUCCEEDED',now());
INSERT INTO "CaptureVersion"(id,"propertyId","captureId","objectId",checksum,manifest,"capturedAt") VALUES
('cv-web','property-release-test','cap-web','ko-web','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','{}',now()),
('cv-pdf','property-release-test','cap-pdf','ko-pdf','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','{}',now()),
('cv-sheet','property-release-test','cap-sheet','ko-sheet','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','{}',now());

SELECT jsonb_build_object(
  'schemaVersion',1,'releaseId','knowledge-release-1','propertyId','property-release-test','policyHash','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  'members',jsonb_build_array(
    jsonb_build_object('sourceId','ks-web','sourceRevisionId','kr-web','captureId','cap-web','captureVersionId','cv-web','sourceType','WEBSITE','contentDigest','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','authorityRank',1),
    jsonb_build_object('sourceId','ks-pdf','sourceRevisionId','kr-pdf','captureId','cap-pdf','captureVersionId','cv-pdf','sourceType','PDF','contentDigest','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','authorityRank',2),
    jsonb_build_object('sourceId','ks-sheet','sourceRevisionId','kr-sheet','captureId','cap-sheet','captureVersionId','cv-sheet','sourceType','SPREADSHEET','contentDigest','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','authorityRank',3),
    jsonb_build_object('sourceId','ks-form','sourceRevisionId','kr-form','captureId',NULL,'captureVersionId',NULL,'sourceType','FORM','contentDigest','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd','authorityRank',4)
  ))::text AS payload \gset
SELECT encode(digest(convert_to(:'payload','UTF8'),'sha256'),'hex') AS release_hash \gset

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.approve_knowledge_release('property-release-test',:'release_hash','release-tester','PROPERTY_OWNER') AS approval_id \gset
SELECT aifrogi_security.register_knowledge_release('property-release-test',:'payload',:'release_hash',:'approval_id','release-tester') AS knowledge_release_id \gset
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id','ks-web','kr-web','cap-web','cv-web','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id','ks-pdf','kr-pdf','cap-pdf','cv-pdf','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id','ks-sheet','kr-sheet','cap-sheet','cv-sheet','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id','ks-form','kr-form',NULL,NULL,'release-tester');
SELECT aifrogi_security.seal_knowledge_release('property-release-test',:'knowledge_release_id','release-tester');
SELECT aifrogi_security.activate_knowledge_release('property-release-test',:'knowledge_release_id',0,'release-tester');
RESET SESSION AUTHORIZATION;

SET SESSION AUTHORIZATION aifrogi_public;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','public-release-test',false),set_config('app.system_purpose','PUBLIC_ANSWER',false);
DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM aifrogi_security.active_knowledge_release('property-release-test'); IF n<>1 THEN RAISE EXCEPTION 'ACTIVE_KNOWLEDGE_RELEASE_LOOKUP_FAILED'; END IF; END $$;
RESET SESSION AUTHORIZATION;

-- Bind the signed bot release to the exact active knowledge-release hash.
SELECT '{"capabilities":["ANSWER_QUESTIONS"],"channels":["WEBSITE"],"compatibility":{"channelAdapterVersions":{"WEBSITE":"1"},"minimumServingContract":1,"retrievalVersion":"active-crawl-v1","schemaVersion":"20260929234500"},"constitutionVersion":"1.1","delivery":{"adapter":"WEBSITE_HTTP","idempotencyRequired":true,"uncertainOutcomeRequired":true},"evidence":{"conflictBehavior":"FAIL_CLOSED","maximumUnits":5,"minimumScore":0.5},"handover":{"consentFields":[],"enabled":false,"responseSlaMinutes":null,"route":null},"languages":["English"],"propertyId":"property-release-test","retention":{"auditMetadataDays":365,"payloadDays":30,"policyId":"standard"},"schemaVersion":1,"sources":[{"authorityRank":1,"authorizationId":"auth-1","digest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","effectiveUntil":null,"sourceId":"ks-web","type":"WEBSITE","versionId":"cv-web"}],"timezone":"UTC"}' AS fixture_policy_payload \gset
SELECT encode(digest(convert_to(:'fixture_policy_payload','UTF8'),'sha256'),'hex') AS fixture_policy_hash \gset
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.register_bot_machine_policy('property-release-test',:'fixture_policy_payload',:'fixture_policy_hash','fixture-signature','test-key','release-tester');
RESET SESSION AUTHORIZATION;
SELECT id AS policy_artifact_id,"policyHash" AS machine_policy_hash FROM "BotMachinePolicyArtifact" WHERE "propertyId"='property-release-test' AND state IN ('CANDIDATE','ACTIVE') ORDER BY "createdAt" DESC LIMIT 1 \gset
SELECT jsonb_build_object('schemaVersion',1,'releaseId','bot-release-knowledge-bound','propertyId','property-release-test','policyHash',:'machine_policy_hash','knowledgeReleaseHash',:'release_hash','applicationBuildId','build-1','databaseSchemaVersion','20260929234500','servingContract',1,'retrievalVersion','active-crawl-v1','channelAdapterVersions',jsonb_build_object('WEBSITE','1'),'createdAt','2026-09-29T00:00:00.000Z')::text AS bot_payload \gset
SELECT encode(digest(convert_to(:'bot_payload','UTF8'),'sha256'),'hex') AS bot_hash \gset
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.register_bot_release('property-release-test',:'policy_artifact_id',:'bot_payload',:'bot_hash','knowledge-bound-signature','test-key','release-tester') AS bound_bot_release_id \gset
SELECT aifrogi_security.activate_bot_release('property-release-test',:'bound_bot_release_id',0,'release-tester');
SELECT replace(replace(:'bot_payload',:'release_hash',repeat('f',64)),'bot-release-knowledge-bound','bot-release-wrong-knowledge') AS wrong_bot_payload \gset
SELECT encode(digest(convert_to(:'wrong_bot_payload','UTF8'),'sha256'),'hex') AS wrong_bot_hash \gset
SELECT aifrogi_security.register_bot_release('property-release-test',:'policy_artifact_id',:'wrong_bot_payload',:'wrong_bot_hash','wrong-knowledge-signature','test-key','release-tester') AS wrong_bot_release_id \gset
SELECT set_config('test.wrong_bot_release_id',:'wrong_bot_release_id',false);
DO $$ BEGIN
  PERFORM aifrogi_security.activate_bot_release('property-release-test',current_setting('test.wrong_bot_release_id'),1,'release-tester');
  RAISE EXCEPTION 'BOT_RELEASE_WRONG_KNOWLEDGE_ACTIVATED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'BOT_RELEASE_KNOWLEDGE_NOT_ACTIVE' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;

-- Optional website isolation: a failed website capture is recorded, but it is
-- not a member of the next exact release. Approved PDF, spreadsheet and form
-- members must still seal and activate atomically without any legacy fallback.
INSERT INTO "SourceCapture"(id,"propertyId","sourceId","sourceRevisionId","requestedGeneration","operationKey",status,"completedAt")
VALUES('cap-web-failed','property-release-test','ks-web','kr-web',2,'op-web-failed','FAILED',now());
SELECT jsonb_build_object(
  'schemaVersion',1,'releaseId','knowledge-release-without-website','propertyId','property-release-test','policyHash','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  'members',jsonb_build_array(
    jsonb_build_object('sourceId','ks-pdf','sourceRevisionId','kr-pdf','captureId','cap-pdf','captureVersionId','cv-pdf','sourceType','PDF','contentDigest','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','authorityRank',1),
    jsonb_build_object('sourceId','ks-sheet','sourceRevisionId','kr-sheet','captureId','cap-sheet','captureVersionId','cv-sheet','sourceType','SPREADSHEET','contentDigest','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','authorityRank',2),
    jsonb_build_object('sourceId','ks-form','sourceRevisionId','kr-form','captureId',NULL,'captureVersionId',NULL,'sourceType','FORM','contentDigest','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd','authorityRank',3)
  ))::text AS optional_payload \gset
SELECT encode(digest(convert_to(:'optional_payload','UTF8'),'sha256'),'hex') AS optional_release_hash \gset
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.approve_knowledge_release('property-release-test',:'optional_release_hash','release-tester','PROPERTY_OWNER') AS optional_approval_id \gset
SELECT aifrogi_security.register_knowledge_release('property-release-test',:'optional_payload',:'optional_release_hash',:'optional_approval_id','release-tester') AS optional_release_id \gset
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'optional_release_id','ks-pdf','kr-pdf','cap-pdf','cv-pdf','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'optional_release_id','ks-sheet','kr-sheet','cap-sheet','cv-sheet','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'optional_release_id','ks-form','kr-form',NULL,NULL,'release-tester');
SELECT aifrogi_security.seal_knowledge_release('property-release-test',:'optional_release_id','release-tester');
SELECT aifrogi_security.activate_knowledge_release('property-release-test',:'optional_release_id',1,'release-tester');
RESET SESSION AUTHORIZATION;
DO $$ BEGIN
 IF (SELECT status FROM "SourceCapture" WHERE id='cap-web-failed')<>'FAILED' THEN RAISE EXCEPTION 'FAILED_WEBSITE_CAPTURE_NOT_RECORDED'; END IF;
 IF EXISTS(SELECT 1 FROM "KnowledgeReleaseMember" m JOIN "KnowledgeReleaseArtifact" r ON r.id=m."releaseArtifactId" WHERE r."releaseId"='knowledge-release-without-website' AND m."sourceType"='WEBSITE') THEN RAISE EXCEPTION 'FAILED_WEBSITE_INCLUDED_IN_RELEASE'; END IF;
 IF (SELECT count(*) FROM "KnowledgeReleaseMember" m JOIN "KnowledgeReleaseArtifact" r ON r.id=m."releaseArtifactId" WHERE r."releaseId"='knowledge-release-without-website')<>3 THEN RAISE EXCEPTION 'OPTIONAL_WEBSITE_RELEASE_MEMBERSHIP_WRONG'; END IF;
 IF (SELECT "pointerGeneration" FROM "KnowledgeReleaseActivePointer" WHERE "propertyId"='property-release-test')<>2 THEN RAISE EXCEPTION 'OPTIONAL_WEBSITE_RELEASE_NOT_ACTIVATED'; END IF;
END $$;

-- Adversarial closure: exact approval, incomplete membership, stale CAS, and revocation.
SELECT replace(:'payload','knowledge-release-1','knowledge-release-2') AS payload_2 \gset
SELECT encode(digest(convert_to(:'payload_2','UTF8'),'sha256'),'hex') AS release_hash_2 \gset
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT set_config('test.payload_2',:'payload_2',false),set_config('test.release_hash_2',:'release_hash_2',false);
DO $$ BEGIN
  PERFORM aifrogi_security.register_knowledge_release('property-release-test',current_setting('test.payload_2'),current_setting('test.release_hash_2'),'nonexistent-approval','release-tester');
  RAISE EXCEPTION 'UNAPPROVED_RELEASE_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'KNOWLEDGE_RELEASE_EXACT_APPROVAL_REQUIRED' THEN RAISE; END IF; END $$;
SELECT aifrogi_security.approve_knowledge_release('property-release-test',:'release_hash_2','release-tester','PROPERTY_OWNER') AS approval_id_2 \gset
SELECT aifrogi_security.register_knowledge_release('property-release-test',:'payload_2',:'release_hash_2',:'approval_id_2','release-tester') AS knowledge_release_id_2 \gset
SELECT set_config('test.knowledge_release_id_2',:'knowledge_release_id_2',false);
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id_2','ks-web','kr-web','cap-web','cv-web','release-tester');
DO $$ BEGIN
  PERFORM aifrogi_security.seal_knowledge_release('property-release-test',current_setting('test.knowledge_release_id_2'),'release-tester');
  RAISE EXCEPTION 'INCOMPLETE_RELEASE_SEALED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'KNOWLEDGE_RELEASE_MEMBERSHIP_INCOMPLETE' THEN RAISE; END IF; END $$;
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id_2','ks-pdf','kr-pdf','cap-pdf','cv-pdf','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id_2','ks-sheet','kr-sheet','cap-sheet','cv-sheet','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'knowledge_release_id_2','ks-form','kr-form',NULL,NULL,'release-tester');
SELECT aifrogi_security.seal_knowledge_release('property-release-test',:'knowledge_release_id_2','release-tester');
DO $$ BEGIN
  PERFORM aifrogi_security.activate_knowledge_release('property-release-test',current_setting('test.knowledge_release_id_2'),0,'release-tester');
  RAISE EXCEPTION 'STALE_KNOWLEDGE_POINTER_ACCEPTED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'KNOWLEDGE_RELEASE_POINTER_STALE' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;
UPDATE "KnowledgeSource" SET state='REVOKED',"revokedAt"=now(),"updatedAt"=now() WHERE id='ks-pdf';
SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false),set_config('test.knowledge_release_id_2',:'knowledge_release_id_2',false);
DO $$ BEGIN
  PERFORM aifrogi_security.activate_knowledge_release('property-release-test',current_setting('test.knowledge_release_id_2'),2,'release-tester');
  RAISE EXCEPTION 'REVOKED_SOURCE_RELEASE_ACTIVATED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'KNOWLEDGE_RELEASE_SOURCE_NOT_ELIGIBLE' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;

DO $$ BEGIN
 IF (SELECT count(*) FROM "KnowledgeReleaseMember" WHERE "releaseArtifactId"=(SELECT "releaseArtifactId" FROM "KnowledgeReleaseActivePointer" WHERE "propertyId"='property-release-test'))<>3 THEN RAISE EXCEPTION 'MULTISOURCE_MEMBERSHIP_WRONG'; END IF;
 IF has_table_privilege('aifrogi_publisher','"KnowledgeReleaseMember"','INSERT') THEN RAISE EXCEPTION 'DIRECT_MEMBER_INSERT_ALLOWED'; END IF;
 IF NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid='"KnowledgeReleaseActivePointer"'::regclass) THEN RAISE EXCEPTION 'KNOWLEDGE_POINTER_RLS_NOT_FORCED'; END IF;
END $$;
SELECT 'MULTISOURCE_KNOWLEDGE_RELEASE_PASS' AS result;
