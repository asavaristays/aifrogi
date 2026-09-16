\set ON_ERROR_STOP on

BEGIN;
SELECT set_config('app.organization_id','rls-org-a',true);
SELECT set_config('app.platform_authority','false',true);
DO $test$
DECLARE affected integer;
BEGIN
  IF (SELECT count(*) FROM "Organization") <> 1 THEN RAISE EXCEPTION 'Tenant A organization scope failed'; END IF;
  IF (SELECT count(*) FROM "Property") <> 1 THEN RAISE EXCEPTION 'Tenant A property scope failed'; END IF;
  IF (SELECT count(*) FROM "KnowledgeEntry") <> 1 THEN RAISE EXCEPTION 'Tenant A knowledge scope failed'; END IF;
  IF (SELECT count(*) FROM "Message") <> 1 THEN RAISE EXCEPTION 'Tenant A message scope failed'; END IF;
  IF EXISTS (SELECT 1 FROM "KnowledgeEntry" WHERE id='rls-knowledge-b') THEN RAISE EXCEPTION 'Cross-tenant read succeeded'; END IF;
  UPDATE "KnowledgeEntry" SET answer='forbidden' WHERE id='rls-knowledge-b';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Cross-tenant update succeeded'; END IF;
  DELETE FROM "Message" WHERE id='rls-message-b';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Cross-tenant delete succeeded'; END IF;
  BEGIN
    INSERT INTO "KnowledgeEntry" (id,"propertyId",question,answer,category,status,"createdBy","updatedAt")
      VALUES ('rls-forbidden-insert','rls-property-b','Forbidden','Forbidden','Security','DRAFT','security-fixture',now());
    RAISE EXCEPTION 'Cross-tenant insert succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
ROLLBACK;

BEGIN;
SELECT set_config('app.organization_id','rls-org-b',true);
SELECT set_config('app.platform_authority','false',true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM "Organization") <> 1 THEN RAISE EXCEPTION 'Tenant B organization scope failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "KnowledgeEntry" WHERE id='rls-knowledge-b') THEN RAISE EXCEPTION 'Tenant B own data unavailable'; END IF;
  IF EXISTS (SELECT 1 FROM "Message" WHERE id='rls-message-a') THEN RAISE EXCEPTION 'Tenant B cross-tenant read succeeded'; END IF;
END
$test$;
ROLLBACK;

BEGIN;
SELECT set_config('app.organization_id','',true);
SELECT set_config('app.platform_authority','false',true);
DO $test$
BEGIN
  IF EXISTS (SELECT 1 FROM "Organization") THEN RAISE EXCEPTION 'Missing tenant context did not fail closed'; END IF;
END
$test$;
ROLLBACK;

BEGIN;
SELECT set_config('app.organization_id','',true);
SELECT set_config('app.platform_authority','true',true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM "Organization") <> 2 THEN RAISE EXCEPTION 'Platform authority path failed'; END IF;
END
$test$;
ROLLBACK;

SELECT 'tenant-rls-isolation-passed' AS result;
