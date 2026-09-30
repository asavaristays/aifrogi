\set ON_ERROR_STOP on
DO $$
DECLARE r record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
    WHERE n.nspname='aifrogi_security' AND p.prosecdef AND acl.grantee=0 AND acl.privilege_type='EXECUTE'
  ) THEN RAISE EXCEPTION 'PUBLIC_SECURITY_DEFINER_EXECUTE_FOUND'; END IF;
  FOR r IN SELECT p.oid,p.proname,pg_get_functiondef(p.oid) definition,p.proconfig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='aifrogi_security' AND p.prosecdef
  LOOP
    IF NOT coalesce(r.proconfig,'{}'::text[]) @> ARRAY['search_path=pg_catalog, public'] AND NOT coalesce(r.proconfig,'{}'::text[]) @> ARRAY['search_path=pg_catalog,public'] THEN
      RAISE EXCEPTION 'SECURITY_DEFINER_SEARCH_PATH_MISSING:%',r.proname;
    END IF;
  END LOOP;
END $$;
SELECT 'PRIVILEGED_ROUTINE_AUTHORITY_PASS' result;
