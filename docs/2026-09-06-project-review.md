# AiFrogi project review — 6 September 2026

## Management verdict

The platform has substantial implemented controls and synthetic acceptance evidence. It is not yet evidenced for broad commercial scale or a 95% real-world accuracy claim. No combined numerical rating is issued: platform engineering, connector certification and client content readiness have different evidence gaps.

## Latest delivery: Sheets recovery

- Deployed `bucket4-sheet-recovery-20260906`; deployment readiness passed at `2026-09-06T02:19:58.143Z`.
- Rollback: `/var/backups/aifrogi/bucket4-sheet-recovery-20260906.cXOQxl`.
- Local TypeScript and 439/439 core tests passed; includes 14 recovery transport tests and five sync-key tests. The earlier key helper remains separate from the deployed reservation implementation.
- VPS: 7/7 real-database/simulated-provider checks passed: interleaved A/B/A, cancellation in place, lost response read-back, unknown-result hold, concurrent same-booking retry, lost DB acknowledgement recovery, visible unresolved errors.
- Test tag `qa-sheet-2b37d9dd-5196-4ead-919b-a428e3a78c07`; zero real Google writes. Exact temporary isolated property fixture and dependent test records removed after testing; this test data was not retained for recovery.
- Existing 17/17 authenticated measurement/feedback checks passed against staging before deployment. Synthetic evidence IDs `cmtp6ozkz000dg3kxv6itva3q`, `cmtp6ozr8000ug3kxpxsfwev2`; QA sessions revoked.
- Local appointment contract/state-machine/Calendar/Sheet verifier passed using node --import tsx. Existing template verifier also passed; no WhatsApp implementation change.
- Fresh public post-deployment health request was blocked by the tool approval usage limit. Deployment-time health is verified; a later public check is pending. Do not describe this release as having completed independent public post-deployment acceptance.

### Recovery limits

Reservations are persisted before provider writes. Unknown outcomes do not trigger blind repeats. Cancellations use the existing row. Duplicate/moved/foreign-occupied rows fail closed. This favors safety over automatic availability: an uncertain blank row requires operator review. No operator repair UI or approved repair action was added in this slice. Manual edits during a provider read/write remain an external race; do not claim Google/database atomicity or exactly-once execution under all conditions. No real-provider fault injection, revocation or cancellation certification occurred.

## Area-by-area status

| Area | Supported status | Remaining evidence/work |
|---|---|---|
| Public frontend and onboarding | Existing site and onboarding flows; no redesign in this cycle | Fresh full desktop/mobile onboarding review not run this cycle; historic fixes are not a new blanket acceptance |
| Super Admin / client workspace | 5A review screen, scoped reports, authenticated permissions verified | Human usability exercise and complete commercial user journey |
| Sovereign shared runtime | Prior Bucket 1 acceptance and expanding automated regression | Organic phrasing, false confidence/caution, real reviewed outcomes |
| Eight personas | Prior 80/80 deterministic journey bank; interactive fictional demos | Each real client's knowledge and live connector certification |
| Human handover | Prior Bucket 2 controlled-pilot acceptance | Real staffing/SLA outcomes in first client window |
| Measurement (5A) | Deployed reviewer records, cohort separation, latest-review projection, 17/17 live HTTP acceptance in its closure run | Actual reviewed organic conversations; no inference that all non-demo traffic is real |
| Governed corrections (5B) | Publication safeguard slice deployed, 16/16 rollback-only lifecycle checks | Real owner-approved correction journey, independent concurrency testing and full historical replay remain distinct limits |
| Google connectors (4) | Calendar stable event creation/read-back, fail-closed reads, Sheets reserved-row recovery | OAuth browser binding/single-use state; execution authority wiring; stored-event/HOLD reconciliation; real revocation/reconnect/cancel and resource-provision recovery |
| Billing/support | Existing implementation; not changed this cycle | No fresh full paid checkout/renewal/suspension/support-email acceptance in this review |
| Infrastructure/security | Deployment backups, gated build and deployment health | Fresh public recovery-release recheck pending; restore drill/load/chaos/security assurance not certified by unit tests |
| Private pilot (5C) | 24-case/three-tester plan prepared | Explicitly deferred by user; not executed or closed |

## Webtechnosys client readiness

Latest read-only audit output at `2026-09-06T02:08:38.461Z`: bot LIVE, installation detected, organization ONBOARDING, nine published claims, generic BusinessGPT coverage 30%, freshness 100%, no unresolved conflicts/unsigned claims/pending previews/open incorrect-fact flags, three knowledge gaps, two negative votes and two pending replay reviews. Required CRM/Sheets configuration was REQUESTED/disabled in that registry.

Important: the generic coverage bank differs from the bespoke ten-topic launch specification. Validate mandatory identity/contact/training-booking/safety/handover topics before assigning readiness. The audit printed its data then exited SIGABRT; retain it as a diagnostic checkpoint, not clean acceptance. A clean read-only rerun is outstanding. Google OAuth connection and required-connector registry state should be reconciled, not assumed equivalent.

## Priorities before expansion

1. Obtain fresh public release health and clean tenant-readiness audit.
2. Resolve/approve missing client knowledge and review negative feedback; engineering must not invent business truth.
3. Finish remaining connector controls before enabling unverified live actions. Keep initial pilot limited to approved knowledge, links and handover.
4. Resume 5C when three testers are available: 24 conversations, review every answer, zero unresolved critical failures, explicit owner/Operations decision.
5. After approval, review limited real traffic for 48 hours and seven days before adding risk or scale. No monitoring automation has been created by this report.

No new frontend, pricing, WhatsApp or cosmetic work is recommended without a confirmed blocker. A passing test suite is evidence of the tested controls, not proof of 95% customer accuracy or complete business readiness.
