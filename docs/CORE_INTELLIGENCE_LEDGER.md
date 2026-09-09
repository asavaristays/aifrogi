# AiFrogi Core Intelligence Ledger

Purpose: the permanent, shared capability register for intelligence behavior inherited by every current and future AiFrogi bot.

This ledger prevents duplicate implementation. It records what the platform already knows how to do, where that behavior lives, how it was verified, and whether it is live. It does not contain client business facts.

## Boundary

Core Intelligence owns shared behavior: tenant isolation, privacy, safety, intent and context routing, retrieval policy, answer style, authority limits, lead rules, handover, reliability, evidence and governed improvement.

Core Intelligence must never contain a client's prices, services, address, phone number, hours, policy wording or other tenant truth. Those belong in `TENANT_INTELLIGENCE_LEDGER.md` and the tenant's approved data.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `PLANNED` | Approved direction; implementation has not started. |
| `LOCAL` | Implemented and locally verified; listed in `PENDING_VPS_CHANGES.md`. |
| `LIVE` | Deployed and verified in production. |
| `PILOT_EVIDENCE` | Live, but real-client evidence is still being collected. |
| `BLOCKED` | Cannot proceed until the recorded dependency is resolved. |
| `RETIRED` | No longer used; retained for history and migration reference. |

## Shared capability register

| ID | Capability | Status | Applies to | Primary implementation / authority | Verification or limitation |
| --- | --- | --- | --- | --- | --- |
| `CI-001` | Tenant isolation and access boundary | `LIVE` | Every bot and client workspace | `lib/client-access.ts`, workspace-scoped repositories, Sovereign Intelligence Rule Book | Cross-tenant access remains a zero-tolerance failure. |
| `CI-002` | Approved knowledge and structured-fact authority | `LIVE` | Every website bot | `lib/services/website-knowledge-service.ts`, governed knowledge repositories | Answers must use published tenant truth; no client fact is embedded in Core. |
| `CI-003` | Intent routing and within-session context | `LIVE` | Every website bot | `lib/sovereign-intelligence/decision.ts`, resolution runtime | Covers greeting, identity, contact, business, follow-up, human, sensitive and off-topic intent. Cross-session personal memory remains parked. |
| `CI-004` | Shared natural-answer constitution | `LIVE` | Every website bot | `BOT_ANSWER_CONSTITUTION`, `AIFROGI_ANSWER_INTELLIGENCE_STANDARD_V1.md` | Answer first, warm but precise, no internal language, no routine sales question. Human review remains required. |
| `CI-005` | Bounded resolution, repetition control and safe failure | `LIVE` | Every website bot | reliability and resolution modules | Prevents loops and unsupported claims; safe response is not counted automatically as a useful answer. |
| `CI-006` | Intent-triggered, consented lead qualification | `PILOT_EVIDENCE` | Bots with lead capabilities enabled | `lib/lead-qualification.ts`, `AIFROGI_AGENTIC_LEAD_QUALIFICATION_V1.md` | Ordinary questions do not trigger contact capture. Real conversion evidence is still required. |
| `CI-007` | Human handover and tenant Team Inbox | `PILOT_EVIDENCE` | Bots with handover enabled | website handover, response SLA, Team Inbox | Persistence and client visibility are live; operating response quality requires pilot evidence. |
| `CI-008` | Per-answer evidence and governed feedback | `LIVE` | Every website answer | Sovereign answer evidence, feedback and review repositories | Evidence is internal and must never expose score, confidence or governance language to visitors. |
| `CI-009` | Versioned persona/category policy packs | `LIVE` | Supported bot families | `lib/bot-persona-packs.ts`, category policy and registry | Vertical rules are shared by category; tenant facts remain separate. |
| `CI-010` | Visitor-timezone-aware first greeting | `LOCAL` | Every website bot and client Today dashboard | `lib/greeting.ts`, website bot API/embed, dashboard | 24/24 focused tests, TypeScript and production build passed. Awaiting VPS deployment under commit `749a56f`. |
| `CI-011` | Shared and vertical regression gates | `PILOT_EVIDENCE` | Core or persona changes | test suites and bot-family regression scripts | Automated passes screen defects but do not replace human answer acceptance. |
| `CI-012` | Self-contained business-request routing and visitor-safe feedback | `LOCAL` | Every website bot | `lib/sovereign-intelligence/decision.ts`, public website-bot feedback API | Direct requests such as “share training program details” reach tenant retrieval without requiring prior context; off-topic lookalikes and genuine follow-ups remain separated. Focused tests 47/47, TypeScript, ESLint and 76-route production build passed. Awaiting VPS deployment. |

## Duplicate-prevention gate

Before changing shared bot behavior:

1. Search this ledger by capability, symptom and implementation path.
2. Reuse or extend the existing `CI-*` capability when the behavior is already present.
3. Add a new `CI-*` entry before implementation only when the behavior is genuinely new and applies to multiple tenants.
4. If the defect is a client fact or client-specific response, stop and record it in the Tenant Intelligence ledger instead.
5. Never implement, test or deploy a Core item in the same batch as a Tenant Intelligence item.
6. Move status from `PLANNED` → `LOCAL` → `LIVE`; record the commit, release and verification. Do not mark `LIVE` from local tests alone.
7. If a capability is replaced, mark the old entry `RETIRED` and link its successor; never silently delete history.

## New-entry template

| ID | Capability | Status | Applies to | Primary implementation / authority | Verification or limitation |
| --- | --- | --- | --- | --- | --- |
| `CI-NEXT` | Clear shared behavior | `PLANNED` | Named bot cohort | Planned module or governing document | Acceptance test, live evidence required and known limitation |

## Update responsibility

- Update this file in the same commit as every Core Intelligence implementation.
- Add the `CI-*` ID to the daily log and pending VPS entry.
- After deployment, record the release and live verification here and clear only that package from `PENDING_VPS_CHANGES.md`.
- The authoritative work separation remains `product-memory/2026-09-08-trust-and-intelligence-boundary.md`.
