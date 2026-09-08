# AiFrogi Webtechnosys Pilot Launch Governance

Version: 1.0
Date: 2 September 2026
Document type: **Normative launch specification**
Evidence status: **This document defines the target state. It is not evidence that any gate has passed.**

## Executive decision

AiFrogi may proceed with a controlled pilot-launch cycle. Webtechnosys may enter production only after its client-specific knowledge, behaviour, installation and operational gates pass with retained evidence.

The core platform does not require another broad redesign before the pilot. The immediate work is operational completion: knowledge preparation, approval, installation, acceptance testing and monitored release.

| Area | Current interpretation |
|---|---|
| Platform engineering | Pilot-capable based on automated and production-health evidence |
| Webtechnosys knowledge | Not complete; target state defined below |
| Public launch | Held behind client-specific gates |
| Initial delivery | Website AI Bot with approved knowledge, AiFrogi lead capture and human handover |
| External write connectors | Excluded until separately required and certified |

## 1. Core platform capability

### Sovereign Intelligence

Implemented platform controls include approved-knowledge retrieval; Answer, Clarify, Refuse and Handover decisions; response evidence; claim approval and publication; conflict and expiry handling; feedback and incorrect-fact flags; Rule 11 loop protection; tenant isolation; signed visitor sessions; decision-versus-behaviour checks; and replay/regression foundations.

Automated evidence supports controlled pilot preparation. It does not substitute for real-client evidence.

### Knowledge governance

Every client knowledge item must pass:

1. Information intake.
2. Atomic-claim generation.
3. Automated validation.
4. Conflict checking.
5. Field-level approval.
6. Conversational preview approval.
7. Versioned publication and monitoring.

### Safety and reliability

Required pilot controls include safe refusal, human handover, bounded retry, circuit breaking, feedback, claim-level pausing, subscription suspension without immediate deletion, support handling, readiness monitoring, automatic TLS renewal and encrypted backup capability.

## 2. Webtechnosys target pilot scope

> **Target-state warning:** Every item in this section is intended pilot scope. It must not be described as currently configured, approved, published or tested unless the evidence register records the corresponding gate result.

### Included after approval

- Company identity and positioning.
- Approved services.
- Project enquiry and qualification.
- Information required to begin a project.
- Verified contact and location information.
- Training enquiries.
- Correct, active training-booking link.
- Approved commercial boundary statements.
- Human callback or specialist handover.
- Consented lead capture.
- Irrelevant-question handling and contextual return.

### Excluded initially

- Binding quotations or delivery guarantees.
- Contractual commitments.
- Autonomous payments.
- Unverified CRM, calendar or Google Sheets actions.
- WhatsApp functionality.
- Unsupported legal, financial, medical or technical assurances.

The bot must disclose unavailable integrations and must not imply that information was delivered to an external system.

## 3. Required knowledge package

The BusinessGPT readiness bank must cover company identity, services, project start, required inputs, contact, location, training, training booking, commercial boundaries and human handover.

At least eight of ten topics must pass. Identity, contact, training-booking link, safety boundaries and human handover are mandatory regardless of the numerical threshold.

Current coverage must be obtained only from the read-only tenant audit. This specification contributes zero claims and zero percentage points to coverage.

## 4. Acceptance gates

### Knowledge gate

- At least 80% required-topic coverage.
- At least 95% published-claim freshness.
- Zero unresolved conflicts.
- Zero unsigned published claims.
- Zero pending conversational previews.
- Zero unresolved incorrect-answer flags.
- Active links verified before publication.
- Contact information tested against realistic customer phrasing.

### Behaviour gate

The retained acceptance run must cover direct, vague and misspelled questions; contextual follow-ups; irrelevant interruption and return; repeated incomplete input without looping; unsupported requests; human assistance; and prohibited commitments.

### Installation gate

The widget or standalone link must work on desktop and mobile, avoid overflow, record installation detection, bind visitor sessions to the correct tenant, expose feedback and handover controls, and pass pause/resume verification.

### Operational gate

The client owner and AiFrogi operator must be named. Support delivery, escalation responsibility, readiness monitoring, recovery backup and stop conditions must be verified.

## 5. Release sequence

1. **Internal preparation:** import, structure, validate, preview, approve and publish.
2. **Internal acceptance:** execute the fixed test script and classify every failure.
3. **Private pilot:** conduct 20–30 conversations with at least three testers; manually review every answer; retain no unresolved critical failure.
4. **Limited production:** expose limited traffic, review every conversation for 48 hours and keep unverified external actions disabled.
5. **Seven-day review:** evaluate Safe Resolution Rate, grounding, retrieval near misses, false confidence, false caution, handovers, feedback, gaps, loops, support SLA and availability before approving another pilot.

## 6. Immediate stop conditions

Pause the pilot for cross-tenant exposure; invented price, policy, contact detail or link; prohibited commitments represented as confirmed; continued use of a paused claim; false booking/payment/action confirmation; persistent loops; unavailable pause or handover; material session/authentication failure; or repeated critical failure within 24 hours.

A single non-critical content gap should contain the affected topic or claim, not remove the complete bot.

## 7. Accountable roles

### Client Owner or Client Admin

Supplies business truth, confirms factual accuracy, approves conversational previews, identifies authorised contacts and approves corrections to business knowledge.

### AiFrogi Operations

Structures inputs, runs verification, supervises publication, monitors evidence and feedback, coordinates incidents and prevents unsupported activation.

### Engineering

Repairs platform, retrieval, state, connector and interface defects; maintains regression tests, isolation, monitoring, backup and recovery; and never silently modifies client-approved truth.

The generic term `Admin` must not be used in evidence or approval records when one of these accountable roles can be named.

## 8. Evidence and rating rule

A combined platform-and-client score is prohibited because it obscures the distinction between platform capability and client implementation.

- Specifications and plans do not increase readiness.
- Test design does not equal test execution.
- Published claims do not equal topic coverage.
- Platform health does not equal client-bot readiness.
- A rating or maturity band may change only when its missing evidence is produced and retained.

The next readiness assessment occurs after the Webtechnosys private pilot and seven-day evidence window, not after additional synthetic functionality.

## 9. Scope control

Do not reopen completed frontend, pricing, Super Admin, billing or architecture work unless a confirmed pilot blocker requires it.

Execution order:

1. Complete the ten-topic Webtechnosys knowledge bank.
2. Approve and publish at least eight topics, including every mandatory topic.
3. Run and retain acceptance evidence.
4. Verify installation, feedback, handover and pause controls.
5. Complete the private pilot.
6. Review 20–30 internal conversations.
7. Begin limited production monitoring.
8. Issue the seven-day evidence report before onboarding the next client.

## 10. Definition of done

This governance artifact is satisfied only when all mandatory gates have retained evidence, no stop condition remains open and the named accountable owners authorise limited production. Until then, all included knowledge and journeys remain target-state requirements.
