# Tenant database isolation activation

This control must be rehearsed against a production-derived staging database before production activation.

1. Create two synthetic organizations with distinct users, properties, knowledge, leads, conversations, billing records and connector records.
2. Take and verify an encrypted database backup.
3. Apply `ops/tenant-rls-policies.sql` using the application database role.
4. Run `npm run verify:tenant-rls`.
5. In a tenant-scoped transaction, prove tenant A can read and update its own fixtures and cannot read, update, insert or delete tenant B fixtures even when tenant B identifiers are supplied.
6. Prove public-bot, worker and connector paths establish the owning organization before accessing protected records.
7. Prove Platform Administrator and explicitly named system jobs operate only through `withTenantDatabaseContext` with audited authority.
8. Run Core certification and every live tenant Golden bank.
9. Exercise `ops/disable-tenant-rls.sql` in staging and prove service recovery.
10. Run `npm run verify:tenant-rls:pool` against staging with a pool size of one. It must prove one backend is reused for tenant A, an empty-context request, and tenant B without identity leakage.
11. Promote only after activation, rollback/recovery, and pooled-connection evidence pass.

Production activation is blocked if any tenant-owned model lacks a policy, any application path runs without database context, or the rollback drill fails.
