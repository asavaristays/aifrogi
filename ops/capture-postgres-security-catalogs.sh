#!/usr/bin/env bash
set -euo pipefail
: "${AIFROGI_CATALOG_DATABASE_URL:?Explicit catalog target is required}"
: "${AIFROGI_CATALOG_EXPECTED_DATABASE:?Expected database name is required}"
: "${AIFROGI_CATALOG_EXPECTED_SERVER_ADDR:?Expected inet_server_addr is required (or LOCAL_SOCKET)}"
: "${AIFROGI_CATALOG_EXPECTED_ROLE:?Expected catalog session_user is required}"
: "${1:?Pass a new output directory path}"
output_dir="$1"
[[ ! -e "$output_dir" ]] || { echo "Refusing existing catalog output path" >&2; exit 64; }
actual_identity="$(psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 -At -F $'\t' -c "SELECT current_database(),COALESCE(inet_server_addr()::text,'LOCAL_SOCKET'),session_user")"
IFS=$'\t' read -r actual_database actual_server_addr actual_role <<<"$actual_identity"
[[ "$actual_database" == "$AIFROGI_CATALOG_EXPECTED_DATABASE" ]] || { echo "Refusing catalog capture: database mismatch" >&2; exit 65; }
[[ "$actual_server_addr" == "$AIFROGI_CATALOG_EXPECTED_SERVER_ADDR" ]] || { echo "Refusing catalog capture: server mismatch" >&2; exit 66; }
[[ "$actual_role" == "$AIFROGI_CATALOG_EXPECTED_ROLE" ]] || { echo "Refusing catalog capture: role mismatch" >&2; exit 67; }
umask 077
mkdir "$output_dir"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls FROM pg_roles ORDER BY rolname" > "$output_dir/roles.csv"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT parent.rolname AS granted_role,member.rolname AS member_role,grantor.rolname AS grantor,am.admin_option FROM pg_auth_members am JOIN pg_roles parent ON parent.oid=am.roleid JOIN pg_roles member ON member.oid=am.member JOIN pg_roles grantor ON grantor.oid=am.grantor ORDER BY 1,2,3" > "$output_dir/role-memberships.csv"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT table_schema,table_name,grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3,4" > "$output_dir/table-grants.csv"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT routine_schema,routine_name,specific_name,grantee,privilege_type,is_grantable FROM information_schema.role_routine_grants WHERE routine_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3,4,5" > "$output_dir/routine-grants.csv"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT n.nspname AS schema_name,c.relname AS object_name,c.relkind,r.rolname AS owner,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname IN ('public','aifrogi_security') ORDER BY 1,2" > "$output_dir/object-owners-rls.csv"
# PostgreSQL catalogs are authoritative for ACL evidence. Effective ACLs expand
# explicit ACL arrays or the server defaults, and name grantee OID 0 as PUBLIC.
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "WITH objects AS (
 SELECT 'DATABASE'::text object_type,NULL::text schema_name,d.datname object_name,d.datdba owner_oid,COALESCE(d.datacl,acldefault('d',d.datdba)) acl FROM pg_database d WHERE d.datname=current_database()
 UNION ALL SELECT 'SCHEMA',n.nspname,n.nspname,n.nspowner,COALESCE(n.nspacl,acldefault('n',n.nspowner)) FROM pg_namespace n WHERE n.nspname IN ('public','aifrogi_security')
 UNION ALL SELECT CASE WHEN c.relkind='S' THEN 'SEQUENCE' ELSE 'RELATION' END,n.nspname,c.relname,c.relowner,COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::\"char\" ELSE 'r'::\"char\" END,c.relowner)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','aifrogi_security') AND c.relkind IN ('r','p','v','m','f','S')
 UNION ALL SELECT 'ROUTINE',n.nspname,p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',p.proowner,COALESCE(p.proacl,acldefault('f',p.proowner)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','aifrogi_security')
 UNION ALL SELECT 'TYPE',n.nspname,t.typname,t.typowner,COALESCE(t.typacl,acldefault('T',t.typowner)) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('public','aifrogi_security')
), expanded AS (SELECT o.*,x.grantor,x.grantee,x.privilege_type,x.is_grantable FROM objects o CROSS JOIN LATERAL aclexplode(o.acl) x)
SELECT e.object_type,e.schema_name,e.object_name,owner_role.rolname owner_role,grantor_role.rolname grantor_role,CASE WHEN e.grantee=0 THEN 'PUBLIC' ELSE grantee_role.rolname END grantee,e.privilege_type,e.is_grantable FROM expanded e JOIN pg_roles owner_role ON owner_role.oid=e.owner_oid JOIN pg_roles grantor_role ON grantor_role.oid=e.grantor LEFT JOIN pg_roles grantee_role ON grantee_role.oid=e.grantee ORDER BY 1,2,3,6,7" > "$output_dir/effective-catalog-acls.csv"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT n.nspname schema_name,c.relname relation_name,a.attname column_name,owner_role.rolname owner_role,grantor_role.rolname grantor_role,CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE grantee_role.rolname END grantee,x.privilege_type,x.is_grantable FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles owner_role ON owner_role.oid=c.relowner CROSS JOIN LATERAL aclexplode(a.attacl) x JOIN pg_roles grantor_role ON grantor_role.oid=x.grantor LEFT JOIN pg_roles grantee_role ON grantee_role.oid=x.grantee WHERE n.nspname IN ('public','aifrogi_security') AND a.attnum>0 AND NOT a.attisdropped ORDER BY 1,2,3,6,7" > "$output_dir/column-acls.csv"
psql "$AIFROGI_CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 --csv -c "SELECT owner_role.rolname owner_role,COALESCE(n.nspname,'<all schemas>') schema_name,d.defaclobjtype object_type,grantor_role.rolname grantor_role,CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE grantee_role.rolname END grantee,x.privilege_type,x.is_grantable FROM pg_default_acl d JOIN pg_roles owner_role ON owner_role.oid=d.defaclrole LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace CROSS JOIN LATERAL aclexplode(d.defaclacl) x JOIN pg_roles grantor_role ON grantor_role.oid=x.grantor LEFT JOIN pg_roles grantee_role ON grantee_role.oid=x.grantee ORDER BY 1,2,3,5,6" > "$output_dir/default-acls.csv"
(cd "$output_dir" && shasum -a 256 roles.csv role-memberships.csv table-grants.csv routine-grants.csv object-owners-rls.csv effective-catalog-acls.csv column-acls.csv default-acls.csv > SHA256SUMS)
printf '%s\n' "$output_dir"
