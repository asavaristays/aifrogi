BEGIN;

DO $rollback$
DECLARE row record;
BEGIN
  FOR row IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' AND p.polname = 'aifrogi_tenant_isolation'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', row.table_name);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', row.table_name);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', row.table_name);
  END LOOP;
END
$rollback$;

DROP SCHEMA IF EXISTS aifrogi_security CASCADE;
COMMIT;

