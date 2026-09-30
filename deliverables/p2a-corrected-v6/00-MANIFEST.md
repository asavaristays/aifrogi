# Reconciled P2-A review package v6

Prepared: 29 September 2026  
Status: **COMPLETE AS A P2-A DESIGN PACKAGE; READY FOR INDEPENDENT REVIEW**

Normative order: Part 3 then Part 15 in one transaction; Part 5 runs afterward
only through Part 21 on an approved disposable database. Part 15 supersedes
same-signature base routines.

| Artifact | Authority |
| --- | --- |
| `02-PROPOSED-PRISMA.prisma` | complete proposed logical schema |
| `03-PROPOSED-DDL.sql` | generated base structures and base enforcement |
| `15-V6-BLOCKING-HARDENING.sql` | final effective database enforcement |
| `05-BACKFILL-AND-ABORT.sql` | deterministic rehearsal with no false filesystem MAP |
| `16-PROPOSED-DB-CONTEXT.ts` | exact isolated-role transaction boundary |
| `17-PROPOSED-DEPLOYMENT-ADMISSION.sh` | signature/hash-bound release admission |
| `18-PROPOSED-NGINX-CANONICAL-GATE.conf` | active edge block |
| `22-PROPOSED-ANSWER-DELIVERY-SERVICE.ts` | serialized final-check/network-send boundary |
| `23-V5-FINDING-TO-ENFORCEMENT.md` | V5-1–V5-9 reconciliation |

Supporting Parts 9, 11, 13, 14, 20 and 21 define static results, structural
comparison, rollback, defense-in-depth application gating, repository policy
inventory and exact rehearsal order.

P2-B is **NOT APPROVED**. PostgreSQL application, Prisma merge, behavioral
tests, deployment, tenant mutation, publication, purge and automatic
`TRIAL_VERIFIED` publication are **NOT RUN / NOT AUTHORIZED**.
