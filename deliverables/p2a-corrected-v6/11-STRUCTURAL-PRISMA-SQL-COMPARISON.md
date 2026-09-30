# Structural Prisma-versus-SQL comparison

Parts 3 and 15 together implement the proposed Prisma schema. Static generation
reports 107 models and 107 tables.

| Prisma structure | Effective SQL |
| --- | --- |
| bigint capture/job generations | Part 15 type changes |
| exact evidence triple relation | composite unique key and FK |
| exact publication identity/entry/seal relation | composite unique key and FK |
| migration artifact decisions | table, property FK, checks and unique indexes |
| runtime principal grants | table, property FK, role check and unique indexes |
| all remaining fields and relations | Part 3 generated base DDL |

SQL-only enforcement includes trigger serialization, complete claim and
publication sealing, consent validation, SECURITY DEFINER routines, forced RLS,
privilege revocation and role-shape aborts. Prisma cannot express those objects.

Database catalog comparison is **NOT RUN** pending P2-B authorization.
