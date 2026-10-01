\set ON_ERROR_STOP on
BEGIN;

DELETE FROM "KnowledgeEntry"
 WHERE "documentId"='webtechnosys-approved-excel-20261001'
   AND "propertyId"='cmumdx1t0000b01kxql82a3f3';

INSERT INTO "KnowledgeDocument"(
  id,"propertyId","fileName","mimeType","sizeBytes",content,"extractedText",
  status,"uploadedBy","approvedBy","approvedAt","updatedAt"
) VALUES (
  'webtechnosys-approved-excel-20261001','cmumdx1t0000b01kxql82a3f3',
  'Webtechnosys-Authorized-Crawl-Categorized.xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  octet_length(pg_read_binary_file('/tmp/Webtechnosys-Authorized-Crawl-Categorized.xlsx')),
  pg_read_binary_file('/tmp/Webtechnosys-Authorized-Crawl-Categorized.xlsx'),
  'Approved categorized Webtechnosys knowledge workbook; 62 rows approved by Manish Purohit on 2026-10-01.',
  'APPROVED','manish-purohit','manish-purohit',clock_timestamp(),clock_timestamp()
) ON CONFLICT (id) DO UPDATE SET
  content=EXCLUDED.content,"sizeBytes"=EXCLUDED."sizeBytes",status='APPROVED',
  "approvedBy"='manish-purohit',"approvedAt"=clock_timestamp(),"updatedAt"=clock_timestamp();

WITH payload AS (
  SELECT pg_read_file('/tmp/webtechnosys-approved-rows.json')::jsonb AS value
), rows AS (
  SELECT item FROM payload, jsonb_array_elements(value->'rows') item
)
INSERT INTO "KnowledgeEntry"(
  id,"propertyId","documentId",question,answer,category,status,"conflictStatus",
  "validationStatus","validationErrors","fieldApprovedBy","fieldApprovedAt",
  "previewApprovedBy","previewApprovedAt","publishedAt","lastConfirmedAt",
  "effectiveAt","expiresAt","refreshDays",reliability,"authorityLevel",version,
  "quoteText","createdBy","approvedBy","approvedAt","updatedAt"
)
SELECT
  'webtechnosys-excel-row-'||(item->>'row'),'cmumdx1t0000b01kxql82a3f3',
  'webtechnosys-approved-excel-20261001',item->>'question',item->>'answer',item->>'category',
  'PUBLISHED','CLEAR','VALID',ARRAY[]::text[],'manish-purohit',clock_timestamp(),
  'manish-purohit',clock_timestamp(),clock_timestamp(),clock_timestamp(),clock_timestamp(),
  clock_timestamp()+interval '90 days',90,'CLIENT_CONFIRMED','CLIENT_APPROVED_STRUCTURED',1,
  item->>'sourceUrl','manish-purohit','manish-purohit',clock_timestamp(),clock_timestamp()
FROM rows;

INSERT INTO "OnboardingActivity"(id,"organizationId","actorEmail",action,detail,"createdAt")
SELECT
  'webtechnosys-excel-approval-20261001',"organizationId",'manish-purohit',
  'CATEGORIZED_WORKBOOK_APPROVED_AND_PUBLISHED',
  jsonb_build_object('propertyId','cmumdx1t0000b01kxql82a3f3','rowCount',62,'sourcePriority',1,'approvedStages','8-15'),
  clock_timestamp()
FROM "Property" WHERE id='cmumdx1t0000b01kxql82a3f3'
ON CONFLICT (id) DO NOTHING;

COMMIT;
