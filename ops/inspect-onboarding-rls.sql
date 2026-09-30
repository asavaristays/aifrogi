\pset tuples_only on
\pset format unaligned
\pset fieldsep '|'
SELECT tablename,policyname,cmd,roles,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('Organization','Property','OnboardingProfile','OrganizationMember')
ORDER BY tablename,policyname;
SELECT table_name,privilege_type
FROM information_schema.role_table_grants
WHERE grantee='leados_app' AND table_name IN ('Organization','Property','OnboardingProfile','OrganizationMember')
ORDER BY table_name,privilege_type;
