\set ON_ERROR_STOP on
-- Run against a disposable clone after the signed and multi-source fixtures.
-- A failed optional website capture must not block a release made exclusively
-- from other explicitly approved, version-pinned sources.

UPDATE "KnowledgeSource"
   SET state='AUTHORIZED',"revokedAt"=NULL,"updatedAt"=now()
 WHERE ("propertyId",id)=('property-release-test','ks-pdf');

INSERT INTO "SourceCapture"(id,"propertyId","sourceId","sourceRevisionId","requestedGeneration","operationKey",status,"completedAt")
VALUES('cap-web-failed-optional','property-release-test','ks-web','kr-web',99,'op-web-failed-optional','FAILED',now());

SELECT jsonb_build_object(
  'schemaVersion',1,'releaseId','knowledge-release-optional-website-failed','propertyId','property-release-test','policyHash','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  'members',jsonb_build_array(
    jsonb_build_object('sourceId','ks-pdf','sourceRevisionId','kr-pdf','captureId','cap-pdf','captureVersionId','cv-pdf','sourceType','PDF','contentDigest','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','authorityRank',1),
    jsonb_build_object('sourceId','ks-sheet','sourceRevisionId','kr-sheet','captureId','cap-sheet','captureVersionId','cv-sheet','sourceType','SPREADSHEET','contentDigest','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','authorityRank',2),
    jsonb_build_object('sourceId','ks-form','sourceRevisionId','kr-form','captureId',NULL,'captureVersionId',NULL,'sourceType','FORM','contentDigest','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd','authorityRank',3)
  ))::text AS optional_payload \gset
SELECT encode(digest(convert_to(:'optional_payload','UTF8'),'sha256'),'hex') AS optional_release_hash \gset
SELECT "pointerGeneration" AS current_generation FROM "KnowledgeReleaseActivePointer" WHERE "propertyId"='property-release-test' \gset

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','release-tester',false),set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT aifrogi_security.approve_knowledge_release('property-release-test',:'optional_release_hash','release-tester','PROPERTY_OWNER') AS optional_approval_id \gset
SELECT aifrogi_security.register_knowledge_release('property-release-test',:'optional_payload',:'optional_release_hash',:'optional_approval_id','release-tester') AS optional_release_id \gset
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'optional_release_id','ks-pdf','kr-pdf','cap-pdf','cv-pdf','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'optional_release_id','ks-sheet','kr-sheet','cap-sheet','cv-sheet','release-tester');
SELECT aifrogi_security.add_knowledge_release_member('property-release-test',:'optional_release_id','ks-form','kr-form',NULL,NULL,'release-tester');
SELECT aifrogi_security.seal_knowledge_release('property-release-test',:'optional_release_id','release-tester');
SELECT aifrogi_security.activate_knowledge_release('property-release-test',:'optional_release_id',:'current_generation','release-tester');
RESET SESSION AUTHORIZATION;

DO $$ BEGIN
 IF (SELECT status FROM "SourceCapture" WHERE id='cap-web-failed-optional')<>'FAILED' THEN RAISE EXCEPTION 'FAILED_WEBSITE_CAPTURE_NOT_RECORDED'; END IF;
 IF EXISTS(SELECT 1 FROM "KnowledgeReleaseMember" m JOIN "KnowledgeReleaseArtifact" r ON r.id=m."releaseArtifactId" WHERE r."releaseId"='knowledge-release-optional-website-failed' AND m."sourceType"='WEBSITE') THEN RAISE EXCEPTION 'FAILED_WEBSITE_INCLUDED_IN_RELEASE'; END IF;
 IF (SELECT count(*) FROM "KnowledgeReleaseMember" m JOIN "KnowledgeReleaseArtifact" r ON r.id=m."releaseArtifactId" WHERE r."releaseId"='knowledge-release-optional-website-failed')<>3 THEN RAISE EXCEPTION 'OPTIONAL_WEBSITE_RELEASE_MEMBERSHIP_WRONG'; END IF;
 IF (SELECT r."releaseId" FROM "KnowledgeReleaseActivePointer" p JOIN "KnowledgeReleaseArtifact" r ON r.id=p."releaseArtifactId" WHERE p."propertyId"='property-release-test')<>'knowledge-release-optional-website-failed' THEN RAISE EXCEPTION 'OPTIONAL_WEBSITE_RELEASE_NOT_ACTIVE'; END IF;
END $$;

SELECT 'OPTIONAL_WEBSITE_FAILURE_ISOLATION_PASS' AS result;
