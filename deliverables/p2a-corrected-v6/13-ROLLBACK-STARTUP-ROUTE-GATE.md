# Canonical-serving startup, edge and restore barrier

The Platform Release Owner owns the required contract value, release manifest,
admission marker directory and nginx include. They are root-owned deployment
configuration, outside PostgreSQL, tenant settings and the application account.

Part 17 rejects a release before upstream switch unless its root-owned manifest
declares a numeric contract at least as new as the externally required value.
It creates a root-owned marker for only that release. Part 18 returns 503 for
factual route families unless deployment rendered that exact release admitted.
An old build cannot ignore this edge decision. Part 14 is additional protection
for compatible builds, not the rollback barrier by itself.

## Restore compatibility matrix

| Restored database | Candidate build | Root admission | Edge | Result |
| --- | --- | --- | --- | --- |
| legacy/pre-v6 | old raw-file build | reject: contract absent/old | closed | cannot serve |
| legacy/pre-v6 | contract-v1+ | admit build only | closed until DB checks | cannot serve facts |
| v6, verification incomplete | contract-v1+ | admit | closed | cannot serve facts |
| v6, policy/pointer/hash/role checks pass | contract-v1+ | admit | explicitly opened | may serve only after release approval |
| any | old raw-file build | reject | closed | cannot serve |

Restore sequence: close edge; restore in isolation; verify schema marker,
policies, grants, publications, membership, pointers, generations and hashes;
run the actual old-build negative test and compatible-build positive test;
admit the compatible release; switch upstream; explicitly open the edge.

The old-build/restore compatibility test, application integration, deployment
and production verification are **NOT RUN** and require separate authorization.
