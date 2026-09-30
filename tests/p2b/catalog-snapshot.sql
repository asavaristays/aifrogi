\pset format csv
\pset tuples_only off
SELECT 'SCHEMA' AS section,n.nspname AS object_schema,NULL::text AS object_name,r.rolname AS owner,NULL::text AS detail
FROM pg_namespace n JOIN pg_roles r ON r.oid=n.nspowner WHERE n.nspname IN ('public','aifrogi_security')
UNION ALL
SELECT 'TABLE',n.nspname,c.relname,r.rolname,CASE WHEN c.relrowsecurity THEN 'RLS' ELSE 'NO_RLS' END||CASE WHEN c.relforcerowsecurity THEN '+FORCED' ELSE '' END
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname='public' AND c.relkind='r'
ORDER BY 1,2,3;

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname;
SELECT grantee,table_schema,table_name,privilege_type FROM information_schema.role_table_grants WHERE grantee IN ('leados_app','aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher') ORDER BY grantee,table_name,privilege_type;
SELECT grantee,routine_schema,routine_name,privilege_type FROM information_schema.role_routine_grants WHERE grantee IN ('leados_app','aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher') ORDER BY grantee,routine_name;
SELECT r.rolname,r.rolcanlogin,r.rolsuper,r.rolinherit,r.rolbypassrls,COALESCE(string_agg(parent.rolname,',' ORDER BY parent.rolname),'') AS member_of FROM pg_roles r LEFT JOIN pg_auth_members m ON m.member=r.oid LEFT JOIN pg_roles parent ON parent.oid=m.roleid WHERE r.rolname IN ('leados_app','aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher') GROUP BY r.rolname,r.rolcanlogin,r.rolsuper,r.rolinherit,r.rolbypassrls ORDER BY r.rolname;
