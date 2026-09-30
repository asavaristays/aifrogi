\pset tuples_only on
\pset format unaligned
\pset fieldsep '|'
SELECT p.oid::regprocedure, COALESCE(array_to_string(p.proacl, ','), '')
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='aifrogi_security'
  AND p.proname IN ('current_property_id','current_organization_id','has_platform_authority','current_principal','current_purpose')
ORDER BY 1;
SELECT rolname FROM pg_roles WHERE rolname LIKE 'aifrogi_%' ORDER BY 1;
