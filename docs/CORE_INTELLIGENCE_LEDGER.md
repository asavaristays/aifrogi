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
| `CI-004` | Shared natural-answer constitution | `LIVE` | Every website bot | `BOT_ANSWER_CONSTITUTION`, `lib/sovereign-intelligence/answer-quality-gate.ts`, `AIFROGI_ANSWER_INTELLIGENCE_STANDARD_V1.md` | Release `core-robustness-20260912` adds a pre-delivery deterministic gate for internal language, robotic deflection, duplication, excessive length and premature qualification; rejected output cannot reach the visitor. |
| `CI-005` | Bounded resolution, repetition control and safe failure | `LIVE` | Every website bot | reliability and resolution modules | Prevents loops and unsupported claims; safe response is not counted automatically as a useful answer. |
| `CI-006` | Intent-triggered, consented lead qualification | `PILOT_EVIDENCE` | Bots with lead capabilities enabled | `lib/lead-qualification.ts`, `AIFROGI_AGENTIC_LEAD_QUALIFICATION_V1.md` | Ordinary questions do not trigger contact capture. Real conversion evidence is still required. |
| `CI-007` | Human handover and tenant Team Inbox | `PILOT_EVIDENCE` | Bots with handover enabled | website handover, response SLA, Team Inbox | Persistence and client visibility are live; operating response quality requires pilot evidence. |
| `CI-008` | Per-answer evidence and governed feedback | `LIVE` | Every website answer | Sovereign answer evidence, feedback and review repositories | Evidence is internal and must never expose score, confidence or governance language to visitors. |
| `CI-009` | Versioned persona/category policy packs | `LIVE` | Supported bot families | `lib/bot-persona-packs.ts`, category policy and registry | Vertical rules are shared by category; tenant facts remain separate. |
| `CI-010` | Visitor-timezone-aware first greeting | `LIVE` | Every website bot and client Today dashboard | `lib/greeting.ts`, website bot API/embed, dashboard | Deployed as `ci010-timezone-20260912`; production-stage tests passed 24/24, the 85-route build passed, readiness is healthy and PM2 is stable. Rollback: `/var/backups/aifrogi/ci010-timezone-20260912.ELuwsB`. |
| `CI-011` | Shared and vertical regression gates | `PILOT_EVIDENCE` | Core or persona changes and every new go-live | `lib/sovereign-intelligence/launch-certification.ts`, evaluation suites and bot-family regression scripts | Release `core-robustness-20260912` makes the complete 30-case Core suite a mandatory server-side Super Admin go-live gate, displays its result, records the pass, and retains separate tenant-fact/readiness checks. Automated certification does not replace human answer acceptance. |
| `CI-012` | Self-contained business-request routing and visitor-safe feedback | `LIVE` | Every website bot | `lib/sovereign-intelligence/decision.ts`, public website-bot feedback API | Release `ci012-business-routing-20260909`: direct requests such as “share training program details” reach tenant retrieval without requiring prior context; off-topic lookalikes and genuine follow-ups remain separated. Live Webtechnosys smoke returned a grounded answer from two approved current sources. |
| `CI-013` | Conclusive missing-answer recovery | `PILOT_EVIDENCE` | Every website bot | `lib/sovereign-intelligence/answer-quality-gate.ts`, public website-bot runtime and widget | Release `core-robustness-20260912` centralizes one category-aware professional response: withhold unverified output, identify the correct team, offer private consented callback capture, show the approved phone when present, persist the lead and route to Team Inbox. Awaiting real visitor-to-inbox pilot confirmation. |
| `CI-014` | Sustained-interest callback capture | `PILOT_EVIDENCE` | Every lead-capable website bot | `lib/lead-qualification.ts`, website widget | Release `ci014-sustained-interest-20260910`: the first interest turn is answered normally; two relevant commercial-interest turns offer one optional, consented private callback. Direct quote/booking requests remain immediate and unrelated questions cannot trigger capture. Awaiting real Webtechnosys visitor-to-lead confirmation. |
| `CI-015` | Delivery-independent Super Admin go-live | `LIVE` | Every web-delivered bot | `lib/website-bot-lifecycle.ts`, Super Admin customer review | Release `ci015-delivery-independent-live-20260910`: standalone web app or website installation is the client’s choice. Super Admin approval, not website detection, activates a reviewed bot. External connector readiness blocks only action-performing modes; ordinary answer and lead-capture bots use governed internal handling. Approval sends the live email; existing entitlement checks count and stop AI replies. |
| `CI-016` | Universal entity understanding and normalized session slots | `LIVE` | Every website bot | `lib/sovereign-intelligence/entities.ts`, shared decision and resolution runtime | Release `ci016-core-entities-20260911`: extracts and normalizes phone, email, Indian pincode, date, time, currency, quantity and booking reference before resolution; persists non-contact slots within the active session, retains consent gating for contact facts, understands “same … as before,” and distinguishes negated callback requests. Golden set covers 126 formats; production Core gate passed 30/30. |
| `CI-017` | Truthful Today website-bot activity matrix | `LIVE` | Every current and future website bot | `app/(app)/dashboard/page.tsx`, `components/dashboard/client-dashboard-view.tsx` | Release `ci017-today-matrix-20260912`: uses the India-day reporting boundary for today’s conversations and messages, keeps the reply queue current across days, and removes inapplicable delivery/read percentages plus decorative count bars. Local TypeScript, 178 channel/product tests and the 85-route build passed; the production-derived focused gate passed 7/7, the 85-route build passed, health is green, PM2 is stable and authenticated Asavari verification passed. Rollback: `/var/backups/aifrogi/ci017-today-matrix-20260912`. |
| `CI-018` | Reusable tenant-owned connector API control | `LIVE` | Every current and future bot persona | `lib/connector-api-control.ts`, tenant Setup, persona connector contracts and Super Admin review | Releases `ci018-connector-api-20260912` and `ci018-payment-verification-20260912`: Tenant Owner/Admin securely installs and tests its own API; encrypted secrets are never returned. Super Admin sees evidence and controls approval/live status but cannot enter or view credentials. Explicit read-only payment verification remains separate from booking status. It does not claim autonomous booking before provider sandbox and read-back certification. Latest rollback: `/var/backups/aifrogi/ci018-payment-verification-20260912`. |
| `CI-019` | Approved booking intent routing, live availability and reusable in-bot search card | `LIVE` | Every website bot with a tenant-approved booking menu item and verified PMS read connector | `lib/widget-menu.ts`, `lib/tenant-availability.ts`, public website-bot route, website-bot booking card and Setup menu | Booking intent opens the governed card. With destination and dates, the bot queries the verified tenant database and returns yes/no, room counts, rates and clickable property links; without dates it requests them. Booking confirmation still requires provider read-back and verified payment. |
| `CI-020` | Category-neutral conversation and operation planner | `LIVE` | Every bot persona and configured connector operation | `lib/sovereign-intelligence/conversation-planner.ts`, Sovereign decision/entity runtime | Release `ci020-conversation-planner-20260913`: produces one governed outcome—answer, clarify, act, hand over or refuse—while collecting required operation slots only from current/recent customer messages. Safety and human intent outrank operations; assistant examples cannot become tenant facts. The existing availability journey is the first production consumer, while its destinations and API remain tenant-owned. Focused Core/website regression passed 62/62, TypeScript and the 86-route VPS build passed, PM2 is stable and production readiness returned HTTP 200. Rollback: `/var/backups/aifrogi/ci020-conversation-planner-20260913`. |
| `CI-021` | Confidence routing and tenant-entity session memory | `LIVE` | Every governed website bot | `lib/sovereign-intelligence/conversation-confidence.ts`, website knowledge runtime | Release `ci021-confidence-memory-20260914` extends CI-003, CI-016 and CI-020 with deterministic answer/clarify/handover routing. Recent customer turns retain the selected tenant entity plus consent-safe normalized slots; unclear requests receive one specific clarification and then exit to human support. Local TypeScript, focused 20/20, channel 207/207 and Sovereign 365/365 passed; VPS TypeScript, focused 20/20 and the 87-route build passed. Live Asavaristays acceptance retained Rohet Garh across a natural `it` follow-up and returned exact railway evidence. PM2 is online with zero unstable restarts. Rollback: `/var/backups/aifrogi/ci021-confidence-memory-20260914`. |
| `CI-022` | Fleet-wide Core release certification | `LIVE` | Every real live tenant before every Core release | `lib/sovereign-intelligence/fleet-release-gate.ts`, `scripts/verify-core-fleet-release.ts` | Release `ci022-ops001-20260914` fails closed unless the Core suite passes and every non-demo live tenant has a complete Golden bank that passes a fresh actual-path run. Synthetic demos remain in the fixed bot-family suite. Production Core passed 30/30 and the completed Asavaristays and Webtechnosys banks passed 2/2 on 14 September 2026. Rollback: `/var/backups/aifrogi/ci022-ops001-20260914`. |
| `CI-023` | Answer-path context priority, claim equivalence and replay trace | `BLOCKED` | Every governed website bot | `lib/sovereign-intelligence/answer-context.ts`, claim validator, conversation planner and website knowledge runtime | Local suites, builds, Core 30/30 and fresh fleet Golden 3/3 passed. The approved exact-answer replay fixed rate retrieval, stale destination inheritance and cancellation retrieval, but still produced “self-parking … included as a property amenity” without explicit no-charge evidence. The entitlement validator therefore remains incomplete and deployment is blocked pending a separately approved Core correction and repeat replay. |

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
