# P2-A v6 static validation

| Check | Result |
| --- | --- |
| complete Prisma validation | PASS |
| empty-to-proposed Prisma diff generation | PASS |
| Prisma models / generated tables | PASS: 107 / 107 |
| Parts 14, 16 and 22 isolated TypeScript compile | PASS |
| Part 17 POSIX shell syntax | PASS |
| scoped diff whitespace check | PASS |
| PostgreSQL parse/application/catalog comparison | **NOT RUN** |
| role/RLS/race/backfill/delivery/restore tests | **NOT RUN** |
| deployment and production behavior | **NOT RUN** |

Hashes: Prisma `4387b0d578c75e845cd46232d6fa1281d9d3cc261f7b05467da8fcaff41db8b8`; base DDL `52d077124a30fceb83e91995285135c34486ae380743b9c36f23cacb95538980`; backfill `dcc9825ae49bc153051d39974641c2847adcc544d312fc23bf4f87b215b5167b`; hardening `8e48cc1b930320047fae44d4dffc9a09cbc4d90ea87b80e650ccdb0b9d01178b`; admission `d1310ad2d88d0d81fd3853c4574dc62a74554d49112c0683a2c4b63d14b12b29`; delivery service `0421fece8662d76eb8e46a50c881e7f889fde6d033ede31d444ff7b5025c768d`.

These are static results only. P2-B remains not approved.
