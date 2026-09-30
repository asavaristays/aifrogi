\set ON_ERROR_STOP on
INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose)
VALUES('grant-claim-web','property-release-test','claim-web','aifrogi_web','PUBLIC_GUEST');
INSERT INTO "Conversation"(id,"propertyId","externalConversationId","updatedAt") VALUES('conversation-claim-test','property-release-test','claim-test',now());
INSERT INTO "WebsiteCrawlGeneration"(id,"propertyId","captureVersionId",status,"pageCount","chunkCount","contentHash","activatedAt")
VALUES('generation-claim-test','property-release-test','cv-web','ACTIVE',1,1,repeat('a',64),now());
INSERT INTO "WebsiteCrawlPage"(id,"propertyId","generationId",url,title,bucket,content,"contentHash","crawledAt")
VALUES('page-claim-test','property-release-test','generation-claim-test','https://example.invalid/contact','Contact','contact','Webtechnosys provides website development services. Call +91-7410582898 for enquiries.',repeat('b',64),now());
INSERT INTO "WebsiteCrawlChunk"(id,"propertyId","generationId","pageId",ordinal,content,"contentHash")
VALUES('chunk-claim-test','property-release-test','generation-claim-test','page-claim-test',1,'Webtechnosys provides website development services. Call +91-7410582898 for enquiries.',repeat('c',64));

SET SESSION AUTHORIZATION aifrogi_web;
SELECT set_config('app.organization_id','org-release-test',false),set_config('app.property_id','property-release-test',false),set_config('app.security_actor','claim-web',false),set_config('app.system_purpose','PUBLIC_GUEST',false);
SELECT aifrogi_security.record_crawl_answer('property-release-test','conversation-claim-test','generation-claim-test',ARRAY['chunk-claim-test'],'What services?','Webtechnosys provides website development services.','test','claim-delivery-pass','DELIVERED','[{"claim":"Webtechnosys provides website development services.","supported":true,"matchedTerms":["webtechnosys","provides","website","development","services"],"missingNumbers":[]}]'::jsonb);
DO $$ BEGIN
  PERFORM aifrogi_security.record_crawl_answer('property-release-test','conversation-claim-test','generation-claim-test',ARRAY['chunk-claim-test'],'When founded?','Webtechnosys was founded in 2012.','test','claim-delivery-fail','DELIVERED','[{"claim":"Webtechnosys was founded in 2012.","supported":false,"matchedTerms":["webtechnosys"],"missingNumbers":["2012"]}]'::jsonb);
  RAISE EXCEPTION 'UNSUPPORTED_MATERIAL_CLAIM_RECORDED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'MATERIAL_CLAIM_UNSUPPORTED' THEN RAISE; END IF; END $$;
DO $$ BEGIN
  PERFORM aifrogi_security.record_crawl_answer('property-release-test','conversation-claim-test','generation-claim-test',ARRAY['chunk-claim-test'],'What services?','Webtechnosys provides website development services.','test','claim-delivery-empty','DELIVERED','[]'::jsonb);
  RAISE EXCEPTION 'EMPTY_MATERIAL_DECISIONS_RECORDED';
EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'MATERIAL_CLAIM_DECISIONS_REQUIRED' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;
DO $$ BEGIN IF (SELECT count(*) FROM "WebsiteCrawlAnswerAudit" WHERE "propertyId"='property-release-test')<>1 THEN RAISE EXCEPTION 'CLAIM_AUDIT_CARDINALITY_WRONG'; END IF; END $$;
SELECT 'MATERIAL_CLAIM_ENFORCEMENT_PASS' AS result;
