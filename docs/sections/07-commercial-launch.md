# Section 07: Commercial Launch

Status: Launch foundation implemented on 2026-07-03
Target score: 8.5/10

## Think

Primary users: a prospective buyer deciding whether to trust AiFrogi and the internal team responsible for operating the promise after purchase.

Primary job: convert qualified interest into a successful trial while ensuring the service is supportable, secure, observable, and measurable.

## Product Flow

Marketing discovery -> Product explanation -> Pricing and trust -> Trial registration -> Activation analytics -> Guided success -> Upgrade -> Ongoing education and support. In parallel: monitoring -> alert -> incident response -> customer communication -> recovery -> post-incident improvement.

## Implementation Blocks

1. Final pricing, allowances, annual terms, add-ons, enterprise conditions, and commercial approval.
2. Branded 60-90 second product video with captions and static fallback.
3. Documentation, onboarding resource center, demo booking, and lifecycle email sequence.
4. Product analytics for conversion, activation, onboarding drop-off, time-to-live, campaign success, automation health, and support burden.
5. Central error monitoring, uptime checks, alerts, incident runbook, and status communication.
6. Backup restore test, retention, export, organization deletion, and disaster-recovery evidence.
7. Accessibility, keyboard, screen-reader, target-browser, mobile, performance, and security QA.

## Acceptance Gates

- Marketing promises map to shipped and monitored product behavior.
- A trial conversion and cancellation can complete without manual database work.
- Critical failures alert an accountable operator with a tested runbook.
- Restore, export, and deletion procedures are verified.
- Legal, privacy, security, consent, retention, subprocessors, and Meta dependencies are consistent.
- Product-owner acceptance reaches at least 8.5/10 across the complete journey.

## Achieve Definition

The section is complete when AiFrogi can intentionally acquire, activate, support, bill, retain, and safely offboard real customers with measurable service quality.

## 2026-07-03 Implementation

- Original 71-second AiFrogi product film built from real product screens, branded motion, original ambient audio, English captions, and a static poster.
- Public `/product-tour` and `/help` surfaces with six task-based customer guides.
- Help links embedded in customer support and the marketing site.
- Global skip navigation, strong focus visibility, reduced-motion support, increased-contrast support, accessible failure pages, and captioned video.
- Public liveness and dependency-aware readiness endpoints.
- Stateful external health monitor with down and recovery notifications.
- Encrypted PostgreSQL backup with catalogue validation, checksum, retention, and a guarded non-production restore drill.
- Incident response, monitoring, backup/restore, and launch QA runbooks.
- `npm run verify:launch` and aggregate `npm run verify:all` release gates.

## Remaining Commercial Decisions

- Product-owner visual acceptance at 8.5/10.
- Configure an external alert destination and off-VPS backup replication.
- Record the first production restore drill.
- Complete the manual browser/device journey before paid acquisition.
- Keep Razorpay deferred until pricing and early-customer billing behavior stabilize.
