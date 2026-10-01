\set ON_ERROR_STOP on
INSERT INTO "KnowledgeRuntimePrincipalGrant"(
  id,"propertyId","principalId","databaseRole",purpose,"createdAt"
) VALUES (
  'webtechnosys-excel-publisher-grant','cmumdx1t0000b01kxql82a3f3',
  'manish-purohit','aifrogi_publisher','KNOWLEDGE_PUBLISH',clock_timestamp()
) ON CONFLICT ("propertyId","principalId","databaseRole",purpose)
DO UPDATE SET "revokedAt"=NULL,"expiresAt"=NULL;

SET SESSION AUTHORIZATION aifrogi_publisher;
SELECT set_config('app.organization_id','cmumdx1sx000801kx9bsxq6f4',false);
SELECT set_config('app.property_id','cmumdx1t0000b01kxql82a3f3',false);
SELECT set_config('app.security_actor','manish-purohit',false);
SELECT set_config('app.system_purpose','KNOWLEDGE_PUBLISH',false);
SELECT * FROM aifrogi_security.publish_owner_approved_entries(
  'cmumdx1t0000b01kxql82a3f3',
  'manish-purohit',
  ARRAY['webtechnosys-excel-row-2','webtechnosys-excel-row-3','webtechnosys-excel-row-4','webtechnosys-excel-row-5','webtechnosys-excel-row-6','webtechnosys-excel-row-7','webtechnosys-excel-row-8','webtechnosys-excel-row-9','webtechnosys-excel-row-10','webtechnosys-excel-row-11','webtechnosys-excel-row-12','webtechnosys-excel-row-13','webtechnosys-excel-row-14','webtechnosys-excel-row-15','webtechnosys-excel-row-16','webtechnosys-excel-row-17','webtechnosys-excel-row-18','webtechnosys-excel-row-19','webtechnosys-excel-row-20','webtechnosys-excel-row-21','webtechnosys-excel-row-22','webtechnosys-excel-row-23','webtechnosys-excel-row-24','webtechnosys-excel-row-25','webtechnosys-excel-row-26','webtechnosys-excel-row-27','webtechnosys-excel-row-28','webtechnosys-excel-row-29','webtechnosys-excel-row-30','webtechnosys-excel-row-31','webtechnosys-excel-row-32','webtechnosys-excel-row-33','webtechnosys-excel-row-34','webtechnosys-excel-row-35','webtechnosys-excel-row-36','webtechnosys-excel-row-37','webtechnosys-excel-row-38','webtechnosys-excel-row-39','webtechnosys-excel-row-40','webtechnosys-excel-row-41','webtechnosys-excel-row-42','webtechnosys-excel-row-43','webtechnosys-excel-row-44','webtechnosys-excel-row-45','webtechnosys-excel-row-46','webtechnosys-excel-row-47','webtechnosys-excel-row-48','webtechnosys-excel-row-49','webtechnosys-excel-row-50','webtechnosys-excel-row-51','webtechnosys-excel-row-52','webtechnosys-excel-row-53','webtechnosys-excel-row-54','webtechnosys-excel-row-55','webtechnosys-excel-row-56','webtechnosys-excel-row-57','webtechnosys-excel-row-58','webtechnosys-excel-row-59','webtechnosys-excel-row-60','webtechnosys-excel-row-61','webtechnosys-excel-row-62','webtechnosys-excel-row-63']::text[]);
RESET SESSION AUTHORIZATION;
