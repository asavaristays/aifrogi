# AiFrogi Super Admin and Platform Strengthening Strategy

**Version:** 1.0 proposed  
**Constitution:** AiFrogi Bot Constitution v1.1  
**Reference bot:** Webtechnosys  
**Objective:** Move from one strengthened reference bot to a reproducible, observable and governable platform for 1,000 bots.

## 1. Governing decision

Super Admin is the platform control authority for inspection, quarantine, repair proposals, controlled execution, verification, rollback and incident response. Super Admin is not an invisible tenant or a universal runtime bypass.

No Super Admin action may silently weaken tenant isolation, invent factual authority, restore revoked evidence, forge delivery, rewrite append-only history or declare an unexecuted check PASS. Emergency availability actions may close capabilities immediately; reopening requires evidence and an approved release transition.

## 2. Authority model

### 2.1 Control plane

Super Admin may:

- inspect bot health, release compatibility, crawl coverage, consent, evidence, delivery and handover state across properties;
- close factual or transactional serving for one bot, property, channel or release;
- quarantine a source, generation, release or connector;
- initiate a fresh crawl/import or validation job through canonical routines;
- propose corrected configuration, source membership or release manifests;
- approve and activate a repair when separation-of-duty policy permits;
- initiate rollback to a currently authorized compatible release;
- run acceptance, race, restore and capacity tests;
- view redacted operational evidence and immutable audit events.

### 2.2 Data plane restrictions

Super Admin must not directly:

- answer a customer as the bot without using the canonical delivery boundary;
- read or write another property by changing request-supplied tenant identifiers;
- edit sealed evidence, delivered answers or append-only handover events;
- mark a source authorized without the required consent and ownership evidence;
- mark a release, test or delivery successful without the authoritative event;
- reopen a bot whose release, database, policy or build compatibility has failed.

### 2.3 Execution classes

| Class | Examples | Approval | Execution |
|---|---|---|---|
| Observe | Health, catalogs, coverage, drift, redacted audit | Authenticated Super Admin | Read-only views/routines |
| Contain | Close factual edge, quarantine source/release, revoke worker lease | One authorized Super Admin | Immediate, append-only event, reversible where safe |
| Repair | Recrawl, reindex, rebuild manifest, rerun validation | Super Admin initiates | Worker/canonical routine; no direct table edit |
| Material change | Activate release, change consent scope, restore, production migration | Named approval; two-person approval for high-risk production actions | Compare-and-set routine with preconditions |
| Break-glass | Security containment when ordinary control plane is unavailable | Strong authentication plus incident ID; retrospective independent review | Time-limited, fail-closed, fully audited |

## 3. Target architecture

```text
Super Admin Control Plane
  ├── Fleet inventory and health
  ├── Release/compatibility manager
  ├── Source, consent and retention manager
  ├── Crawl/import and validation jobs
  ├── Quarantine and emergency closure
  ├── Acceptance, restore and capacity evidence
  └── Incident, approval and immutable audit
                 │ canonical commands only
                 ▼
Bot Runtime Data Plane
  ├── Authenticated property context
  ├── Signed bot policy
  ├── Atomic active knowledge release
  ├── Retrieval and claim validation
  ├── Exact-answer binding
  ├── Channel-independent delivery
  └── Handover and delivery event ledgers
```

The control plane can command and observe the data plane. It cannot impersonate its runtime roles or bypass their invariants.

## 4. Strengthening programme

### Gate A — Reproducible source of truth

Goal: one reviewed repository commit must reproduce production.

Work:

1. Reconcile the deployed production service into the canonical repository path.
2. Remove or permanently disable older filesystem, legacy-claim and alternate serving branches once an active knowledge release exists.
3. Record exact build identity, schema level, policy version and deployment manifest.
4. Prove clean build, empty-database bootstrap, restored-database migration and rollback compatibility.
5. Block deployment when working-tree artifacts or unregistered production files affect runtime.

Exit evidence:

- repository-to-production file/hash parity;
- clean build and tests;
- repeatable migration from empty and restored production-derived databases;
- signed build admission and rollback result.

### Gate B — Atomic multi-source knowledge release

Goal: replace “one active website crawl equals all knowledge” with one signed release manifest.

Work:

1. Introduce immutable source-version identities for website, PDF, spreadsheet, form/profile and live connectors.
2. Introduce a knowledge-release manifest containing exact approved source versions, consent decisions, digests, authority order and freshness rules.
3. Seal and approve the manifest before activation.
4. Advance one property serving pointer using compare-and-set semantics.
5. Recheck source authorization and active manifest before delivery.
6. Ensure revocation removes only affected authority without enabling an older fallback.

Exit evidence:

- atomic activation and rollback tests;
- partial-source failure tests;
- revocation/retrieval/delivery race tests;
- exact source membership visible to Super Admin.

### Gate C — One channel-independent answer boundary

Goal: website, WhatsApp, API and future adapters cannot implement their own factual policy.

Work:

1. Create one canonical request contract for property, principal, conversation, channel and turn idempotency.
2. Route all factual adapters through the same retrieval, generation, validation and delivery service.
3. Bind final rendered bytes to ordered evidence, release, policy and delivery key before provider I/O.
4. Persist `UNCERTAIN` for provider acceptance/database ambiguity and reconcile it safely.
5. Prohibit adapters from directly recording `DELIVERED` or assembling factual answers.

Exit evidence:

- parity tests across every enabled channel;
- duplicate, timeout and accepted-send/commit tests;
- privilege tests proving adapter roles cannot bypass the boundary.

### Gate D — Claim-level quality and coverage

Goal: prevent both hallucination and grounded incompleteness.

Work:

1. Split the final answer into material claims.
2. Bind every claim to one or more exact evidence units and record support decisions.
3. Add broad-question detection and topic-coverage requirements.
4. Add source taxonomy, authority, freshness and conflict resolution.
5. Use hybrid lexical/semantic retrieval with evidence diversity and bounded context.
6. Fail only the unsupported portion when a mixed answer can be safely separated.

Exit evidence:

- claim-by-claim trace for each delivered factual answer;
- unsupported implication and negative-claim tests;
- broad service/industry/automation coverage tests;
- measured answer completeness and latency.

### Gate E — Super Admin repair console

Goal: rectify systemic faults without database improvisation.

Minimum views:

- fleet readiness and release drift;
- active knowledge release and source membership;
- failed/partial crawls and extraction coverage;
- unanswered and low-coverage question clusters;
- consent, revocation, expiration and retention state;
- delivery uncertainty and duplicate suppression;
- handover routing and aging;
- build/schema/policy compatibility;
- capacity and noisy-neighbour indicators.

Minimum commands:

- close/reopen factual edge subject to gates;
- quarantine/unquarantine through validated transitions;
- schedule fresh capture/import;
- rebuild and validate a candidate release;
- run acceptance suite;
- propose/approve/activate/rollback a release;
- reconcile uncertain delivery;
- initiate retention or purge procedure;
- export a signed evidence package.

Every command requires an idempotency key, reason, expected current version, authorized actor, result and append-only event.

### Gate F — Privacy and operational hardening

Goal: make platform controls survive mistakes, incidents and restore.

Work:

1. Detect and redact secrets before durable conversation, analytics, model-log or handover persistence.
2. Separate append-only event metadata from purgeable personal payloads.
3. Verify forced RLS, object ownership, grants, routine ownership and role membership after migration and restore.
4. Add per-bot readiness, emergency closure and recovery drills.
5. Verify staff handover routing and remove unverified response-time promises.

Exit evidence:

- pre-persistence secret tests;
- retention/purge tests;
- restored security-catalog parity;
- handover lifecycle and routing evidence;
- incident closure/recovery exercise.

### Gate G — 1,000-bot performance qualification

Goal: demonstrate predictable service under realistic fleet load.

Work:

1. Define traffic distribution: active bots, concurrent sessions, messages per minute, crawl frequency and channel mix.
2. Test database pools for every canonical role, retrieval/index latency, audit writes, worker leases and model-provider quotas.
3. Test noisy-neighbour containment and per-property rate limits.
4. Measure p50/p95/p99 end-to-end latency, timeout/uncertain rates, database saturation, queue age, token cost and crawl completion.
5. Test staged degradation: disable expensive generation while retaining truthful unavailable and handover paths.

Exit evidence:

- sustained-load and burst results against agreed service objectives;
- capacity limits and scaling triggers;
- recovery after provider/database impairment;
- cost per conversation and per active bot.

## 5. Order of execution

The gates run in this order:

1. **A — Reproducible source of truth**
2. **B — Atomic knowledge release**
3. **C — One channel boundary**
4. **D — Claim and coverage quality**
5. **E — Super Admin repair console**
6. **F — Privacy and operational hardening**
7. **G — 1,000-bot performance qualification**

Super Admin read-only fleet visibility and emergency closure can be introduced early. Broad repair/activation controls wait until Gates A–D provide canonical transitions; otherwise the console would merely expose unsafe direct mutation.

## 6. Status language

Every control and bot must report one of:

- **DESIGNED** — approved design exists;
- **IMPLEMENTED** — code/migration exists in the canonical repository;
- **TESTED** — required behavioral tests passed in the named environment;
- **DEPLOYED** — exact tested build/control is active;
- **OBSERVED** — production behavior and monitoring confirm the intended result;
- **FAILED**, **BLOCKED** or **NOT RUN** — never represented as PASS.

## 7. Immediate first milestone

The first milestone is not a larger Super Admin screen. It is a trustworthy control foundation:

1. reconcile production into one canonical repository source;
2. inventory all factual entry points and eliminate alternate active-serving branches;
3. define the machine schema for bot policy and multi-source knowledge release;
4. expose read-only Super Admin fleet/release/source health;
5. implement emergency per-bot factual closure;
6. prove Webtechnosys through the real HTTP and delivery boundary;
7. onboard a second, structurally different bot without client-specific code.

Passing the second bot through the same machinery is the first credible proof that AiFrogi is becoming a platform rather than a repaired single bot.
