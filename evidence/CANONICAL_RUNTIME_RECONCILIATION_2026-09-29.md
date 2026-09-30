# Canonical factual-runtime reconciliation — 2026-09-29

## Outcome

The Webtechnosys factual runtime source is reconciled between the canonical repository and production for the eight files listed below. The duplicate `lib/services/website-knowledge-service.production-current.ts` was removed. Tenant-specific crawl seed paths were removed from shared crawler code; sitemap and linked inventory are now the tenant-neutral discovery authority. Generic multipart evidence retention was restored.

## Matching SHA-256

| File | SHA-256 |
|---|---|
| `lib/services/website-knowledge-service.ts` | `ae8ee5de0e0ed20b136d030f48a215656fde9358fdff1f0b929045a5d40432e4` |
| `app/api/public/website-bot/[slug]/route.ts` | `f370f06dcca94b1f1c20b5811d6c44cbf7c9b4a4c3dbb83644b05c4a56578e85` |
| `lib/repositories/knowledge-verification-repository.ts` | `5fe3d0e2ae452e995873e9ed9234a37ecf1f0c17b64ee7e2ee8004bcbd1909fc` |
| `lib/sovereign-intelligence/answer-context.ts` | `ae4f94dd9a87e73b72058fa82c588291983225983498a9f8bd11291b5393822c` |
| `lib/sovereign-intelligence/knowledge-language.ts` | `bde432c8f35b4c15578795620d2b345aa8422c88236d4300747f60e78a22298b` |
| `lib/sovereign-intelligence/claim-validator.ts` | `424d22558de0e55729885a9a55821086ffc2e7636749c3a2650077ab7b35abc8` |
| `lib/bot-constitution-boundary.ts` | `59f5552461d720508e64959e0cadce0b9373038339740746cea1f0b616b7fc70` |
| `lib/website-source-reauthorization.ts` | `b9d669f75e58bcc3eb9ac40153bb821a983ad1a9eed9fb03711ad4fcda0f04ab` |

## Gates

- Canonical TypeScript: **PASS**.
- P2-B application tests: **3/3 PASS**.
- Channel tests: **283/283 PASS**.
- Focused constitution/retrieval tests: **32/32 PASS**.
- Isolated VPS candidate production build: **PASS**.
- Production build after reviewed file promotion: **PASS**.
- PM2 `lead-os-ai`: **ONLINE** after restart.
- Webtechnosys production questions: **20/20 PASS** across bounded runs (questions 1–11 and 12–20).
- Every question used active generation `4015cb59-2095-4cc6-bbb7-0042bbfbea0d`, nonempty chunks and zero legacy claim IDs.
- Public bot route: **HTTP 200**.

## Honest boundary

This closes source divergence for the active factual runtime path listed above. It does not convert the repository's entire existing dirty working tree into a signed release commit, and it does not complete the multi-source knowledge-release architecture. Those remain separate controls in `docs/architecture-status-table.md`.
