# Fixed TypeSafe execution plan — 2026-09-20

Scope: Castle Mandawa shadow-only. No TypeSafe payment/booking authority, no other tenant enablement, no Readiness dependency. No automatic routing promotion.

| Step | Process | Evidence / current state |
|---|---|---|
| 1 | Finish pilot | Scheduled expiry 2026-09-21 08:46:35 UTC. Initial inspection: zero live observations. Await expiry/traffic, do not label complete. |
| 2 | Review decisions | New observations carry an internal hashed session reference that is never sent to TypeSafe. `/admin/typesafe` resolves that reference against existing Sovereign evidence, shows the customer question and served answer only to Super Admins, and records append-only CORRECT / INCORRECT / UNRESOLVED reviews with reviewer identity and rationale. Legacy observations without linkage remain explicitly unreviewable. |
| 3 | Operational impact | Dashboard measures observed failures, input/output tokens and p95 added latency. Published direct-provider price verified: USD 0.042/million input; output free. Estimate excludes missing usage/taxes; no live performance claim with zero samples. |
| 4 | Privacy | Skip identifiers/sensitive markers/non-ASCII/oversized messages entirely; fixed English vocabulary for remaining messages. Tested exclusions. This is not guaranteed anonymization or multilingual support. |
| 5 | Durable bounds | Tenant-scoped PostgreSQL audit reservations with advisory transaction lock, maximum 20/day, 10-second spacing, DB-backed expiry/disable and fail-closed outages. No schema migration. Conservative legacy counts included. |
| 6 | Evaluation bank | 40 fictional labelled classifier questions including Hindi/Hinglish, typos, negation, unsafe requests; separate 40-case outbound-policy suite. Unsupported language is not thereby enabled in production. |
| 7 | Acceptance | Executable gate in `lib/typesafe-promotion-gates.ts`, verified with `npm run verify:typesafe:promotion -- <reviewed-evidence.json>`. Every quality, privacy, availability, latency, isolation and operational-control gate must pass; incomplete evidence fails closed. |
| 8 | Admin visibility | /admin/typesafe: authenticated Super Admin status, expiry, limits, token/cost/latency report, immediate DB-backed disable, and the complete promotion-gate result. Activation remains operator-only; no UI routing activation. |
| 9 | Staging routing | Implemented but OFF: requires `TYPESAFE_MODE=staging`, a separate routing switch, exact staging tenant allowlist, API key and active DB-backed pilot policy. It can only add an existing human-handover route at confidence >= 0.82; all other intents retain the governed primary path. Activation still depends on reviewed evidence and acceptance. |
| 10 | Production routing canary | BLOCKED until steps 1–9 pass. Shadow deployment is not a routing release. |

## Acceptance before routing (not current achievements)
- At least 30 real observations and 40 labelled synthetic cases; independently review expected labels before accepting results.
- At least 95% synthetic intent accuracy overall; zero unauthorized-action or private-data regressions. Break down by language and intent; do not enable unsupported groups.
- Provider unavailable rate <= 5%; p95 added latency <= 1500 ms for representative traffic. Short trials are not statistical proof.
- Zero cross-tenant requests in tests; quota/expiry survives process restarts; disable works. Provider/database failures preserve original response.
- Confidence cutoff 0.82 is provisional. No threshold tuning on test failures to manufacture a pass; keep a holdout bank before routing approval.
- Cost shown as estimate, not customer credits or provider invoice. Model aliases and prices can change; reverify before broad activation.

## Important operating limits
The DB cap is durable; the in-memory cap is an additional guard. Reservations count even if the provider or audit write fails. Ten-second spacing prevents typical overlap under the 2.5-second provider timeout; a stalled process is not a strict distributed mutex. Only an already-reserved/dispatched request may finish after disable. Do not renew expiry or widen scope without review.
