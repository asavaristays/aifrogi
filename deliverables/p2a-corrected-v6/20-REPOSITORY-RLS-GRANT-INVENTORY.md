# Repository RLS and grant inventory

Source inspected: `ops/tenant-rls-policies.sql` at repository base. It creates
only the policy name `aifrogi_tenant_isolation`, across direct organization,
property, indirect and vertical tables. It grants the broad existing runtime
role `leados_app` schema/function access. The active `lib/db.ts` sets
organization/platform/actor/purpose but not property or guest-session hash.

V6 does not assume the repository inventory equals a target catalog. Part 15
queries `pg_policies` during migration and drops every actual policy on each
affected property table before creating one replacement. It revokes routine
and protected-table rights from `leados_app` and the four new group roles, then
grants only named routine signatures. Part 16 is the proposed replacement
context contract and requires property/session context plus one runtime role.

Before any P2-B approval, the rehearsal must export `pg_policies`,
`information_schema.role_table_grants`, `information_schema.routine_privileges`,
role memberships and table owners before/after, and abort on an unexpected
remaining policy, grant, owner bypass or `BYPASSRLS` role. This catalog work is
**NOT RUN**.
