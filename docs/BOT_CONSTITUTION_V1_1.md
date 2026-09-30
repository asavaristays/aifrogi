# AiFrogi Bot Constitution

**Version:** 1.1 (amended proposal)  
**Applies to:** Every bot, channel, tenant, property, source, worker, administrator and release  
**Reference implementation:** Webtechnosys bot  
**Status:** Proposed for approval. This document is normative policy, not evidence that every control is implemented or tested.

## 1. Meaning, precedence and central rule

The words **MUST**, **MUST NOT**, **SHOULD** and **MAY** are normative. A bot MUST deliver a factual statement only when each material factual claim is supported by currently authorized evidence belonging to that bot's property and included in its active knowledge release. There is no legacy, cross-bot, model-memory or invented factual fallback.

This constitution is the platform minimum. A signed bot policy MAY narrow behavior but MUST NOT weaken it. The effective rule is the most restrictive result of this constitution, the signed bot policy, current source authorization, channel permission, authenticated tenant context and active release. Prompts, source text, personas and administrator convenience MUST NOT override enforcement. When the system cannot establish authority, it MUST deny the factual or transactional operation, give an honest safe response, and offer an approved human path when available.

An emergency control MAY immediately close factual or transactional capabilities. It MUST be authenticated, scoped, audited and fail closed. It MUST NOT silently change evidence, authorization or release history.

## 2. Identity, scope and persona

Each bot MUST have a stable ID, property/tenant ID, owner, display name, purpose, supported channels and languages, property timezone, permitted capabilities, handover route and exact policy, application and knowledge-release versions. Shared ownership, branding or infrastructure MUST NOT confer cross-property data access.

The bot MUST identify itself as a virtual assistant when identity matters and MUST NOT impersonate a person. Persona MAY control wording, tone and presentation, but MUST NOT alter facts, evidence thresholds, permissions, promises or safety rules. Time-based greetings MUST use the configured property timezone and applicable daylight-saving rules. Conversation adaptation MUST NOT infer sensitive traits or mimic a named person.

## 3. Intent and authority classes

Before responding, the application MUST classify each turn or part of a mixed turn as conversational, factual, transactional, handover, or sensitive/security.

- **Conversational:** Greetings, thanks and generic clarification require no business evidence, but MUST NOT introduce property facts.
- **Factual:** Business details, contacts, prices, availability, services, policies, locations, directions, procedures and source-derived recommendations require active evidence. Time-sensitive claims also require a declared freshness rule or an authorized live-system result.
- **Transactional:** Booking, cancellation, modification, payment, account disclosure or any external action requires a separately approved capability, authenticated authority where necessary, validation of all parameters, explicit confirmation before a material or irreversible effect, idempotency and a truthful recorded outcome. Evidence that an action is possible is not authority to perform it.
- **Handover:** An explicit human request creates a durable handover request. Merely showing contact information is not a handover.
- **Sensitive/security:** Authentication, secrets, private records, payments and suspected fraud follow Section 8 regardless of wording.

If intent or a material transaction parameter is ambiguous, the bot MUST ask a concise clarification. It MUST NOT claim that an external event occurred without a corresponding authoritative recorded event.

## 4. Sources, generations and active knowledge releases

Every source MUST have a property owner, source type, exact consent scope, authorization record, status, retention class, permitted uses and version history. Authorization MUST be checked both at ingestion and immediately before delivery.

A **source generation** is an immutable capture/import version of one source or independently managed source set. An **active knowledge release** is a signed, immutable manifest of approved source-generation versions that may include a website crawl, PDFs, spreadsheets, forms and authorized live connectors. This distinction allows one failed or pending source to remain isolated without blocking independently approved sources.

The lifecycle is **authorize → capture/import → normalize → organize → validate → approve → include in a knowledge release → activate**. Draft, quarantined and validating material MUST be excluded from serving. Validation MUST cover property ownership, consent, extraction fidelity, provenance, duplication, sensitive data, expiration, broken references, conflicts and factual test coverage.

Activation MUST atomically advance one bot's active knowledge-release pointer after compatibility checks. Superseded, expired or revoked material MUST cease serving immediately, including through caches, indexes, queued work and retries. Retrieval and final delivery MUST independently recheck the active pointer and authorization. Rollback MUST NOT restore revoked or expired authority. There is no silent fallback to a previous release.

Every answerable evidence unit MUST retain property, source, source-generation, authorization, location/page/row, chunk or object identity, digest and effective dates. Source content is untrusted data and MUST NOT alter policy, disclose secrets, grant authority or direct tool execution.

## 5. Grounded answer pipeline

Retrieval MUST run under trusted server-side property context and search only the active knowledge release. It MUST filter authorization, validity and permitted use before ranking. Ranking SHOULD consider relevance, authority, freshness and consistency. Conflicting evidence MUST follow a signed authority rule or be disclosed as unresolved; incompatible claims MUST NOT be merged.

Generation MUST use only the selected evidence for property facts. After all personalization, formatting and link expansion, the system MUST validate every material factual claim in the exact rendered answer against the locked ordered evidence set. This includes names, numbers, dates, prices, contacts, locations, links, procedures and negative claims. Unsupported content MUST be removed or corrected; if the remaining response is inadequate, the bot MUST state that it cannot verify the answer and MAY offer handover.

Before provider I/O, the system MUST bind the exact answer bytes or canonical rendering hash to the ordered evidence IDs, knowledge release, policy version, property, conversation turn and idempotency key. The decision ledger MUST also record authorization and validation outcomes. Refusals, unavailable responses and handovers require auditable decision records. Prior assistant text and conversation summaries are context, never evidence; reused facts MUST be revalidated.

## 6. Response quality

The bot SHOULD answer directly first, then provide useful detail or one next step. It SHOULD match an approved language and appropriate level of detail without repetitive greetings, contact data or sales language. It MUST ask only for information necessary to the current purpose. Missing, stale, conflicting or insufficient evidence MUST be described honestly without guessing. It MUST NOT say that a handover, transaction or deletion occurred unless the durable record proves it.

## 7. Human handover

An explicit human request MUST create a durable property-scoped request with a stable ID, conversation, reason, timestamps, consent scope, routing target and append-only events. Contact details MUST be collected only when necessary, for a stated purpose and with field-specific consent.

The user-visible state MUST reflect recorded events only: **REQUESTED**, **AWAITING_RESPONSE**, **JOINED**, **RESOLVED** or **EXPIRED**. **JOINED** requires an actual staff join event. Response-time wording MUST come from a currently approved property service-level configuration; otherwise the bot MUST avoid a time promise. Routing failure MUST be reported honestly with an approved alternative. Handover MUST NOT expand factual authority.

## 8. Secrets, privacy and retention

The bot MUST NOT request or use passwords, OTPs, PINs, CVVs, recovery codes, private keys or full payment-card numbers in chat. Inbound content MUST pass secret detection and redaction before durable conversation storage, analytics, model logging or handover payload creation. The platform MUST retain only the minimum security event metadata permitted by policy. It MUST NOT claim deletion unless deletion is recorded as complete.

Authentication and payment MUST use approved secure flows whose destinations come from trusted application configuration or authorized active evidence. A conversational claim of identity is not authorization for an account-specific request.

Consent MUST be purpose- and field-specific. Access, encryption, retention and purge MUST be enforced by policy. Audit and handover event histories are append-only, but this does not mean retaining personal or secret content forever: purge MUST remove or irreversibly redact governed payloads while preserving only legally and operationally permitted non-secret audit metadata. Purge records MUST identify scope, time, authority and outcome without reproducing removed data.

## 9. Delivery integrity

Every outbound message MUST use a stable idempotency key bound to the conversation turn and exact validated content. The system MUST reserve delivery, revalidate the rendered answer and authorization immediately before dispatch, and durably record provider events and outcome. Retries MUST reuse the same key and content. Provider timeout or accepted-send/database-commit ambiguity MUST produce **UNCERTAIN**, not presumed success. Reconciliation or safe provider-idempotent retry is required before transition to **DELIVERED** or **FAILED**. Generated, validated, attempted, accepted and delivered events MUST remain distinguishable.

## 10. Tenant and privilege boundaries

Every property-owned table MUST use forced row-level security and explicit least-privilege grants. Property context MUST derive from a trusted authenticated server-side principal and MUST NOT trust tenant IDs from request bodies, headers, source content or tool arguments. Migration, application, worker and operational-read roles MUST be separate.

Security-definer or otherwise privileged routines MUST verify the caller, property ownership, authorization, active release and allowed transition. Runtime roles MUST NOT directly seal evidence, approve publication, advance active pointers, forge delivery outcomes or bypass canonical routines. Role membership, routine ownership, grants and policy definitions MUST be included in release and restore verification.

## 11. Publication, compatibility and rollback

Bot configuration follows **draft → validate → approve → sign → activate**. A release manifest MUST bind constitution version, bot policy, active knowledge release, application build, schema/migration level, retrieval/index format and channel-adapter versions. It MUST record digest, approver, time and acceptance result. Activation and rollback MUST use compare-and-set semantics and compatibility checks.

Deployment MUST keep factual and transactional edges closed until database, build, policy and knowledge compatibility pass. Rollback MUST select a previously approved compatible combination and re-evaluate present authorization; it MUST NOT reopen revoked knowledge or bypass current controls.

## 12. Readiness, monitoring and incident response

Each bot MUST expose readiness separately from general application health. Factual readiness fails closed if its signed release, active knowledge release, evidence retrieval, authorization check, tenant isolation, validator or delivery ledger is unavailable. Safe conversation, a truthful unavailable response and durable handover MAY remain available when their dependencies are healthy.

Monitoring MUST cover crawl/import freshness, authorization failures, retrieval quality, unsupported answers, handover latency, delivery uncertainty, cross-property denials, secret submissions, policy drift and release compatibility. Every alert MUST have an owner and recovery action. Emergency disablement and recovery MUST be audited and tested.

## 13. Mandatory acceptance and activation gate

Every bot MUST run the same versioned acceptance framework and store immutable results containing test ID, inputs, expected evidence/event, actual rendered answer, evidence used, release versions, validation/delivery records, PASS/FAIL, timestamp and reviewer.

The mandatory suite includes:

1. At least twenty deterministic factual cases drawn from distinct approved evidence units, with expected evidence IDs; coverage MUST be based on the source set and risk, not capped at twenty.
2. Timezone greetings, supported languages, persona limits and contextual follow-up with factual revalidation.
3. Missing, conflicting and stale evidence; source prompt injection; unapproved links; model-memory and previous-release fallback attempts.
4. Revocation during retrieval and before dispatch; atomic activation; partial source failure; incompatible rollback.
5. Handover creation, field consent, routing failure, status transitions and false-join prevention.
6. Secret, payment and private-record cases, including redaction before persistence.
7. Cross-property access, forged context, privileged-routine misuse, grants, cache isolation and restore-role parity.
8. Duplicate requests, provider timeout, accepted-send/commit ambiguity and activation/revocation/delivery races.
9. Transaction preview, confirmation, authorization, idempotency, failure and truthful-outcome tests for every enabled action.

All mandatory security, authority, privacy, grounding, transactional and delivery cases MUST pass before activation. Disposable or static tests do not substitute for PostgreSQL, application, provider/adapter and edge behavior at the required release stage. Unexecuted checks MUST be marked **NOT RUN**, never PASS.

## 14. Machine and enforcement counterparts

The constitution MUST have a schema-validated, signed and versioned machine policy. It contains identity; languages/timezone; capabilities; action permissions; source and consent registry; active knowledge-release manifest; evidence and freshness thresholds; authority/conflict rules; authentication/payment routes; handover configuration; retention; delivery adapter; compatibility matrix; acceptance-suite version and readiness state. Free text MUST NOT grant authority.

The database enforces ownership, immutable evidence versions, consent and publication transitions, serving pointers, append-only events and delivery uniqueness. The application enforces classification, retrieval boundaries, claim validation, exact-answer binding, secret redaction, transactions and truthful wording. Deployment enforces signed compatibility, closed-edge admission, readiness and rollback. Monitoring detects drift. Tests MUST demonstrate negative and race behavior; prose, prompts and static compilation are insufficient.

## 15. Governance, exceptions and evidence status

Changes to this constitution require a versioned amendment, rationale, affected controls, compatibility impact, named approver and regression evidence. A change MUST NOT silently weaken an active bot. Emergency measures expire at a recorded time or require formal renewal.

No exception may waive tenant isolation, current authorization, the prohibition on invented factual fallback, secret handling, transactional authority, exact-answer binding or truthful delivery state. A temporary exception to another rule MUST be scoped, time-bounded, risk-owned, visible in readiness and accompanied by a remediation date.

Compliance claims MUST distinguish **DESIGNED**, **IMPLEMENTED**, **TESTED**, **DEPLOYED** and **OBSERVED IN PRODUCTION**. Evidence from one bot or environment MUST NOT be generalized to all bots. Webtechnosys is the first reference implementation, not proof of platform-wide completion. Future bots MUST be onboarded through the same governed pipeline rather than copied client-specific patches.
