\set ON_ERROR_STOP on
BEGIN;
SET LOCAL ROLE leados_app;
SELECT set_config('app.organization_id','cmumdx1sx000801kx9bsxq6f4',true);
SELECT set_config('app.platform_authority','false',true);
SELECT set_config('app.security_actor','info@webtechnosys.com',true);
SELECT set_config('app.system_purpose','',true);
SELECT id,name FROM "Organization" WHERE id='cmumdx1sx000801kx9bsxq6f4';
UPDATE "Organization" SET "publicPhone"='+91-7410582898',"publicEmail"='info@webtechnosys.com',"updatedAt"=clock_timestamp()
WHERE id='cmumdx1sx000801kx9bsxq6f4'
RETURNING id,"publicPhone","publicEmail";
ROLLBACK;
