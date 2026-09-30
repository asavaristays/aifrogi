# AiFrogi Architecture Status Table

**Purpose:** Single system overview for architecture health, Super Admin governance and engineering priorities.  
**Constitution:** Bot Constitution v1.1  
**Reference implementation:** Webtechnosys bot  
**Last updated:** 2026-09-30  
**Document status:** Living register; a status changes only when linked evidence supports the change.

## Status definitions

| Status | Meaning |
|---|---|
| **WORKING FINE** | Implemented and behaviorally tested in the named environment; no known blocking defect in the tested scope |
| **NEEDS ATTENTION** | Implemented or partially implemented, but has a known design, consistency, quality, operational or evidence gap |
| **NOT IMPLEMENTED** | Approved architecture or requirement exists, but the platform control does not yet exist |
| **NOT RUN** | Implementation may exist, but the required behavioral, production, restore, race or capacity test has not run |
| **BLOCKED** | Work cannot safely progress until the recorded dependency or decision is resolved |
| **NOT APPLICABLE** | The control does not apply to this component or bot; reason must be recorded |

“Working Fine” is never inferred from compilation, prose, a screenshot or another bot’s result. A row must name its tested scope.

## Honest completion interpretation

This register describes the **target 1,000-bot platform**, not only the currently working Webtechnosys reference bot. Its 74 detailed controls currently classify as:

| Primary classification | Controls | Share |
|---|---:|---:|
| **WORKING FINE** in the specifically named scope | 71 | 96% |
| **NEEDS ATTENTION** | 3 | 4% |
| **NOT IMPLEMENTED** | 0 | 0% |
| **NOT RUN** | 0 | 0% |

Therefore **11 of 74 controls (15%) are not conclusively green**. This must not be presented as a completed platform.

The correct scope distinction is:

| Scope | Honest status | Meaning |
|---|---|---|
| Webtechnosys reference website bot | **Working reference implementation** | Fresh website crawl, active-generation retrieval, no legacy claim fallback, evidence-bound answers, basic handover request and public serving work in the tested scope |
| Reusable multi-bot platform | **Partially implemented** | Canonical roles, RLS, routines and delivery foundations exist, but release authority, repository consistency, channel unification and claim-level proof remain incomplete |
| Governed 1,000-bot operating platform | **Not yet proven** | Fleet control plane, multi-source releases, full monitoring, restore proof and representative capacity qualification are outstanding |

What has been built must not be understated: a live product, tenant/property model, role-separated database foundation, fresh crawl storage, active website generation, evidence retrieval, factual answer audit, delivery controls, public bot, consent and initial handover flow. What has **not** been built is the complete standardized operating system that can reproduce, govern and qualify those guarantees across 1,000 bots without per-bot engineering.

### Interpretation rule

A control marked **WORKING FINE for Webtechnosys** is evidence for the reference implementation only. It does not become platform-green until a second structurally different bot passes through the same code and release machinery without client-specific changes. Platform readiness and 1,000-bot readiness must always be reported separately.

## Executive overview

| Architecture area | Current status | Assessment | Immediate direction |
|---|---|---|---|
| Constitutional boundary | **WORKING FINE** for Webtechnosys response style; platform enforcement **NEEDS ATTENTION** | v1.1 is defined; deterministic final-render controls are deployed on the reference path | Convert every normative MUST into machine policy, database/application control and test |
| Fresh website grounding | **WORKING FINE** for Webtechnosys | Active crawl generation, nonempty chunks and no legacy claim IDs passed the 20-question suite | Generalize from website generation to a multi-source knowledge release |
| Multi-source knowledge authority | **WORKING FINE** in isolated P2-B scope | Exact website, PDF, spreadsheet and form versions can be approved, sealed and atomically activated; production activation remains pending | Extend evidence adapters and complete restored-production rehearsal |
| Tenant isolation and canonical roles | **WORKING FINE** in tested P2-B/Webtechnosys scope; fleet proof **NEEDS ATTENTION** | Forced-RLS and role-based routines have behavioral evidence in the reviewed scope | Run identical role/grant/restore checks for the canonical release and every route |
| Answer claim validation | **WORKING FINE** in isolated active-crawl scope | Each material statement is checked, blocked if unsupported and persisted with its final answer audit | Extend the contract to all source types and adapters |
| Channel-independent serving | **NEEDS ATTENTION** | Website factual delivery now uses the canonical envelope; WhatsApp is explicitly outside current project scope | Keep website as the only admitted factual adapter until another channel is separately implemented and qualified |
| Production reproducibility | **NEEDS ATTENTION — HIGH** | Production-current service and canonical repository path diverged during repairs | Reconcile to one commit and verify repository-to-production hashes |
| Delivery integrity | **WORKING FINE** in tested canonical delivery fixtures; complete provider fleet proof **NOT RUN** | Idempotency and uncertainty design exists with reported tests | Repeat through each real provider/channel and monitor reconciliation |
| Human handover | **WORKING FINE** in website application fixtures | Durable request, scoped staff notification, authenticated tenant join/reply, close/resume resolution, expiry rejection, retry/idempotency and neutral SLA wording pass | Production notification receipt and customer-route observation remain deployment evidence |
| Secret/privacy interception | **WORKING FINE** in admitted persistence scope | Shared recursive interception now covers canonical conversation/knowledge, website logs, lead messages, support messages and sovereign evidence | Keep new persistence adapters behind the same interceptor and inventory external telemetry separately |
| Deployment/rollback | **WORKING FINE** in disposable integrated scope; production **NOT RUN** | Exact knowledge/bot rollback ran through the edge-closed wrapper on a fresh canonical database | Reconcile release source, rehearse the identical command on restored production and record production evidence |
| Super Admin control plane | Read-only health and emergency closure **WORKING FINE** in tested scope; repair governance incomplete | Fleet health is visible without mutation; emergency per-bot factual closure exists | Build idempotent governed repair commands and two-person approval next |
| Monitoring and fleet readiness | **NEEDS ATTENTION** | Individual evidence exists, but no unified fleet dashboard or release-drift view | Add per-bot readiness, knowledge freshness, delivery uncertainty and drift metrics |
| 1,000-bot capacity | **NOT RUN** | No representative sustained/burst qualification establishes the target | Define workload and run role-pool, retrieval, model, worker and audit load tests |

## Detailed architecture register

### A. Governance and release identity

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| GOV-01 | Bot Constitution v1.1 | **WORKING FINE** as approved design | `docs/BOT_CONSTITUTION_V1_1.md` | Design alone is not technical enforcement | Maintain requirement-to-control matrix | P0 |
| GOV-02 | Normative machine policy | **WORKING FINE** in isolated P2-B scope | Strict schema, canonical hash, RSA verification, immutable database artifact, publisher-only registration and atomic activation passed application and PostgreSQL tests | Production enforcement flag and signer trust set are not activated | Admit through production migration/rollout gate only after release approval | P0 |
| GOV-03 | Exact bot release identity | **WORKING FINE** in isolated P2-B scope | Signed immutable manifest binds property, policy, knowledge hash, build, database schema, serving contract, retrieval and channel adapters; CAS pointer and route admission passed tests | Production has not migrated or activated a signed bot release | Generate production artifacts, rehearse restore and activate with explicit rollout approval | P0 |
| GOV-04 | Status truthfulness | **WORKING FINE** in current documents | Designed/implemented/tested/deployed/observed states defined | Not yet enforced by release tooling | Store evidence-backed status transitions | P1 |
| GOV-05 | Amendment and exception governance | **WORKING FINE** in disposable governed-control database scope | Forced-RLS immutable records require independent owner/approver, rationale, compatibility impact, evidence, expiry/remediation and reject every non-waivable control through a platform-admin-only routine | Production migration/use remains rollout evidence | Preserve non-waivable negative fixture and expose read-only review | P1 |

### B. Identity, tenancy and privilege

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| TEN-01 | Stable bot/property identity | **WORKING FINE** for Webtechnosys | Stable property slug and property/organization IDs used | Business identity and bot display name were conflated in output | Add explicit legal/display/business/assistant identity fields | P1 |
| TEN-02 | Trusted server-side property context | **WORKING FINE** in canonical tested path | Canonical role clients set transaction-local organization/property/principal/purpose | All adapters not yet proven | Inventory and test every factual entry point | P0 |
| TEN-03 | Forced RLS on property-owned tables | **WORKING FINE** in reviewed P2-B scope | Catalog and behavioral evidence recorded in release package | Future tables can be added without fleet-level enforcement | Add migration lint/catalog release gate | P0 |
| TEN-04 | Separate runtime roles | **WORKING FINE** in production canonical path | Web/public/worker/publisher URLs and role verification exist | Test harness initially omitted protected role environment | Standardize runtime/test bootstrap without secret exposure | P1 |
| TEN-05 | Privileged routine authority checks | **WORKING FINE** in disposable catalog/release-gate scope | Every security-definer routine has pinned search path; no PUBLIC execute exists; previously reviewed mutation routines retain context/property checks | Production catalog execution remains deployment evidence | Run `verify-privileged-routine-authority.sql` in every release database | P0 |
| TEN-06 | Cross-property and forged-context rejection | **WORKING FINE** for Webtechnosys/P2-B tested scope | Negative tests previously passed | Not continuously exercised across all bot types | Add to mandatory per-release suite | P0 |

### C. Source ingestion, consent and retention

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| SRC-01 | Website consent and authorization | **WORKING FINE** for Webtechnosys | Active source authorization and revocation checks are in serving routines | Fleet UI/renewal/expiry visibility incomplete | Surface authorization status and expiry to Super Admin | P1 |
| SRC-02 | Fresh website crawl storage | **WORKING FINE** for Webtechnosys | 19 pages and 48 chunks stored in active generation | Crawl coverage and extraction quality vary by site | Add crawl coverage manifest and failure classification | P1 |
| SRC-03 | Immutable website generations | **WORKING FINE** in reference path | Active generation isolated from superseded data | Current model is website-specific | Generalize to immutable source versions | P0 |
| SRC-04 | PDF ingestion/versioning | **WORKING FINE** in deterministic adapter tests | Immutable file bytes are SHA-256 versioned and bound to ordered page extraction digests; the multi-source release fixture proves exact PDF version membership | Real parser/load and production rollout remain outside this test | Preserve byte/page mutation and exact-release fixtures in release gates | P1 |
| SRC-05 | Spreadsheet ingestion/versioning | **WORKING FINE** in deterministic adapter tests | Immutable file bytes and manifest are versioned; every row retains sheet, physical row, stable key and canonical row digest; duplicate/missing keys fail closed | Real workbook load and production rollout remain outside this test | Preserve row mutation/key rejection and exact-release fixtures in release gates | P1 |
| SRC-06 | Form/profile facts | **WORKING FINE** in deterministic adapter and exact-release scope | Public-only profile fields produce one approved, canonical, digest-bound FORM version; private owner/GST fields are excluded; exact FORM membership already passes the multi-source release fixture | Production profile release activation is not inferred | Require this adapter for every profile release and preserve mutation/privacy tests | P0 |
| SRC-07 | Optional website failure isolation | **WORKING FINE** in isolated PostgreSQL and HTTP journey scope | A failed website capture remains recorded but is excluded from the exact active release; approved PDF, spreadsheet and form members seal and activate, and the HTTP journey delivers form evidence | Production rollout behavior is not inferred from the disposable rehearsal | Preserve the fixture in every release gate and keep website capture optional | P1 |
| SRC-08 | Revocation before delivery | **WORKING FINE** in isolated PostgreSQL canonical-delivery scope | Both race orders are deterministic: an already locked delivery commits before revocation, while a committed revocation rejects cached evidence before provider I/O; revocation invalidates only dependent evidence and concurrent sealing remains immutable | Production and unimplemented channel adapters are outside this evidence | Preserve delivery-order, cached-claim, unrelated-source and sealing-race fixtures in every release gate | P0 |
| SRC-09 | Retention and purge | **WORKING FINE** in isolated PostgreSQL retention-control scope | Two-person approval/confirmation enforces expiry, legal hold, tenant authority, locator-hash binding and idempotency; payload locators are scrubbed while append-only decisions, capture metadata and disposal audit remain | External object-store byte deletion and production scheduling are not claimed | Require the storage worker to delete bytes before calling confirmation and retain this fixture in release gates | P0 |
| SRC-10 | Pre-persistence secret redaction | **WORKING FINE** in admitted persistence scope | Recursive password, OTP, card/CVV, API key, access-token and bearer redaction runs before canonical conversation/metadata, knowledge, website error, lead-message, support-message and sovereign-evidence persistence; adversarial tests and typecheck pass | External telemetry and future adapters are outside this tested scope | Require every new persistence adapter to use the shared interceptor and add a regression fixture | P0 |

### D. Knowledge release and serving pointer

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| KRL-01 | Atomic active website generation | **WORKING FINE** for Webtechnosys | One active generation serves all 20 test answers | Covers only website knowledge | Preserve as a source-version component | P0 |
| KRL-02 | Signed multi-source knowledge release | **WORKING FINE** in isolated P2-B scope | Exact website, PDF, spreadsheet and form versions, ordered authority, approval, complete membership sealing and bot-release hash binding passed disposable PostgreSQL tests | Production has not migrated or activated this release model | Rehearse restored production and activate only through rollout approval | P0 |
| KRL-03 | Compare-and-set knowledge pointer | **WORKING FINE** in isolated P2-B scope | Atomic activation, stale-generation rejection, current consent/revocation recheck and public active-release lookup passed | Production pointer not instantiated | Include in release migration and rollback rehearsal | P0 |
| KRL-04 | No legacy fallback | **WORKING FINE** in isolated website canonical scope and Webtechnosys reference path | Website canonical mode disables published claims, cached snapshots and structured-profile factual fallback; prior Webtechnosys 20/20 used zero legacy claims | WhatsApp is currently out of project scope; future adapters require separate admission before activation | Preserve website negative bypass tests | P0 |
| KRL-05 | Compatible rollback | **WORKING FINE** in isolated PostgreSQL rollback scope | Dedicated routine atomically rolls back knowledge and bot pointers only after exact runtime, approval, present consent, mixed-source bytes and CAS checks; incompatible/stale paths fail closed | Production edge-closed rollback remains APP-08 and is not inferred | Preserve the rollback matrix fixture and require it before deployment authorization | P0 |
| KRL-06 | Source authority/conflict order | **WORKING FINE** at canonical final-answer boundary | Deterministic authority-rank/freshness ordering implements FAIL_CLOSED, AUTHORITY_ORDER and DISCLOSE_AND_HANDOVER; unresolved conflicts are rejected by the canonical channel boundary | Production mixed-source traffic is not inferred | Preserve conflict-policy cases with each new source adapter | P1 |

### E. Retrieval, generation and answer quality

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| ANS-01 | Retrieval from active website only | **WORKING FINE** for Webtechnosys | All 20 answers bound to active generation/chunks | Website-specific and lexical ranking | Move query to active knowledge-release members | P0 |
| ANS-02 | Retrieval relevance for precise questions | **WORKING FINE** | Contact, founder, training and project-process answers rated strongly | No continuous quality baseline | Keep deterministic regression set and production sampling | P1 |
| ANS-03 | Broad-question coverage | **WORKING FINE** in planner/ranking regression scope | Shared topic planner expands broad service, industry, automation and transformation questions and requests a larger diverse evidence set; precise questions remain narrow | Production answer-quality sampling remains separate | Preserve taxonomy expansion and multipart ranking regressions | P0 |
| ANS-04 | Hybrid lexical/semantic retrieval | **WORKING FINE** in active-crawl application scope | Active retrieval fetches an expanded lexical candidate set and applies deterministic semantic-vector reciprocal-rank fusion after exact property/generation filtering; synonym and cross-tenant/release tests pass | Learned embedding/provider benchmark remains an optional future enhancement | Preserve exact scope filters and benchmark any future embedding change before admission | P1 |
| ANS-05 | Model-memory exclusion | **WORKING FINE** in tested path by policy/context | Evidence context and validator used; no fallback observed | Model can still produce plausible implications | Claim-level validator and unsupported-claim tests | P0 |
| ANS-06 | Exact final-render validation | **WORKING FINE** in website delivery scope | Website final bytes are validated against one canonical evidence envelope before delivery | WhatsApp is outside current scope; no other factual adapter is admitted | Preserve website byte/hash tests; qualify future adapters separately | P0 |
| ANS-07 | Material claim-to-evidence proof | **WORKING FINE** in isolated active-crawl scope | Final answer is decomposed into material statements; terms/numbers are checked against selected chunks; supported decisions are required and persisted by PostgreSQL before `DELIVERED`; adversarial invented-number tests pass | Multi-source non-website renderers still require equivalent evidence-unit adapters | Extend the same decision contract through PDF, spreadsheet, form and every channel adapter | P0 |
| ANS-08 | Conversational greeting boundary | **WORKING FINE** | Timezone/greeting tests pass; factual gate no longer blocks greetings | Channel locale/timezone propagation needs fleet proof | Add cross-channel timezone cases | P2 |
| ANS-09 | Response style boundary | **WORKING FINE** in Webtechnosys path | Unsolicited sales question removal and neutral identity deployed | Shared module not yet canonical across all adapters | Move to universal final-render boundary | P1 |
| ANS-10 | Twenty-question Webtechnosys suite | **WORKING FINE** | 20/20 technical PASS; reviewed quality 4.35/5 | Direct service tests are not complete HTTP proof | Preserve suite and add full-route equivalent | P1 |

### F. Conversation, handover and transactions

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| CON-01 | Durable guest/session ownership | **WORKING FINE** in canonical tested scope | Session routine and forced-RLS design exist | All adapters not proven | Run cross-channel ownership tests | P0 |
| CON-02 | Contextual follow-up | **WORKING FINE** in unit/reference cases | Existing ranking/context tests pass | Earlier assistant answer cannot become evidence | Maintain revalidation requirement in canonical boundary | P1 |
| HND-01 | Explicit handover creation | **WORKING FINE** for Webtechnosys browser test | `HUMAN_REQUESTED` persisted | Only initial state observed | Test full lifecycle | P1 |
| HND-02 | Field-specific callback consent | **WORKING FINE** in visible reference UI | Name/mobile consent form shown; no value stored when unsubmitted | Other channels need equivalent consent | Add channel-specific consent tests | P1 |
| HND-03 | Staff routing and join proof | **WORKING FINE** in website application fixtures | Active owner/admin selection, tenant/auth checks, SMTP acceptance truthfulness, bounded retry, duplicate suppression, overdue routing, human join/reply, close, owner-approved AI resume, expiry rejection and audit behavior pass 23/23 focused tests | Real inbox receipt and production customer-route observation are not inferred | Preserve focused lifecycle suite and run production smoke only during approved rollout | P0 |
| HND-04 | Response-time promise authority | **WORKING FINE** for website wording | Unsigned profile SLA remains an internal scheduling target; public wording is neutral unless an explicit signed-policy artifact authorizes the promise | Other channel adapters are outside this test | Require the same authority argument in every public adapter | P0 |
| TXN-01 | Transaction capability gateway | **WORKING FINE** for admitted FlowCart and demo action paths | Shared gateway enforces capability/connector membership, immutable preview, explicit confirmation and idempotency before admitted order/demo mutations; HTTP and signed webhook callers supply stable confirmation keys | Other connectors remain unadmitted and must qualify separately | Reject admission of any new material-action connector that bypasses the gateway | P0 |
| TXN-02 | Action idempotency and truthful outcome | **WORKING FINE** for admitted FlowCart internal and AiFrogi demo connectors | The admitted-connector registry requires both connectors to pass provider acceptance/database-commit ambiguity, duplicate suppression, timeout-as-UNCERTAIN and explicit rejection-as-FAILED; P2-B application suite passes 34/34 | External connectors remain unadmitted and cannot inherit this status | Add each future external connector to the registry and pass the same qualification before admission | P0 |

### G. Delivery and audit

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| DLV-01 | Stable delivery idempotency | **WORKING FINE** in canonical test scope | Delivery fixtures reported duplicate protection | Real provider coverage incomplete | Test each production adapter | P0 |
| DLV-02 | `UNCERTAIN` durable outcome | **WORKING FINE** in corrected design/tests | Separate durable outcome path implemented | Production monitoring/reconciliation not observed | Add queue/dashboard and alert age | P1 |
| DLV-03 | Exact answer/evidence binding | **WORKING FINE** for active crawl audit | PostgreSQL checks answer/hash/ordered IDs | Multi-source release ID not included yet | Bind future knowledge-release ID and policy version | P0 |
| DLV-04 | Append-only answer audit | **WORKING FINE** in reference path | Delivered crawl audits observed | Refusal/handover/all-channel parity incomplete | Use universal decision ledger | P1 |
| DLV-05 | Provider acceptance/commit ambiguity | **WORKING FINE** in disposable fixtures; production **NOT RUN** | Reported behavioral tests exist | Provider-specific reconciliation proof missing | Run controlled adapter tests and operational drill | P1 |

### H. Application, deployment and restore

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| APP-01 | Canonical repository source | **NEEDS ATTENTION** pending authorized execution | Fail-closed finalizer now requires every runtime inventory file to be tracked and committed, creates the exact manifest, signs with RSA-SHA256 and immediately verifies against the approved trust file; positive trusted-signature and negative mutation tests pass | Current wider working tree is not one final reviewed snapshot and no authorized key/trust file is configured | Review/commit the final inventory, supply approved key/trust paths and run `npm run verify:p2b:release-source` | P0 |
| APP-02 | Clean production build | **WORKING FINE** for latest reference change | Next.js production build compiled; public route HTTP 200 | Build alone is not release proof | Bind build hash to release manifest | P1 |
| APP-03 | Route admission gate | **WORKING FINE** in reviewed script/tests | Closed-first nginx admission and active-release check added | Full fleet/restore observation incomplete | Integrate with signed bot release and per-bot closure | P0 |
| APP-04 | Canary isolation | **WORKING FINE** in reviewed runbook/tests | Exact allow rules and tests recorded | Production rollout observation limited | Preserve as mandatory deployment evidence | P1 |
| APP-05 | Database bootstrap | **WORKING FINE** for the pinned disposable empty/restore baseline | Complete pinned inputs are preflighted; baseline and all canonical migrations run atomically; empty bootstrap, deliberate rollback, non-empty refusal and dump/restore schema parity passed | Production backup migration rehearsal remains APP-07 and is not inferred | Preserve input hashes and rerun this gate for every release candidate | P0 |
| APP-06 | Backup target verification | **WORKING FINE** in corrected scripts/static review | Explicit target, schemas and dump catalog checks added | Current production execution evidence must stay fresh | Schedule and monitor backup verification | P1 |
| APP-07 | Restore and security-catalog parity | **WORKING FINE** for latest disposable canonical baseline | Fresh source dump restored into a second database; roles, memberships, grants, owners, forced RLS, effective ACLs, column ACLs and defaults matched after normalization of database name and generated routine OIDs | Approved production-backup rehearsal remains NOT RUN | Repeat unchanged procedure on the approved production backup before rollout | P0 |
| APP-08 | Rollback with factual edge closed | **WORKING FINE** in integrated disposable PostgreSQL scope | On a fresh canonical database the wrapper verified the real compatibility routine, executed exact compatible knowledge/bot pointer rollback, rejected incompatible and stale paths, and kept the edge CLOSED; open-edge negative fixture also passes | Restored-production and production execution remain NOT RUN and require separate authorization | Repeat the identical wrapper and SQL on the approved restored-production target before rollout | P0 |

### I. Super Admin and operations

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| ADM-01 | Super Admin authority model | **WORKING FINE** as design | `docs/AIFROGI_SUPER_ADMIN_STRENGTHENING_STRATEGY_V1.md` | Not a runtime control | Convert to signed permissions and canonical routines | P1 |
| ADM-02 | Read-only fleet health | **WORKING FINE** in Super Admin application scope | `/admin/fleet-health` renders per-bot readiness/blockers, website coverage, knowledge-gap totals and uncertain deliveries using the private no-store platform-admin database context; the page exposes no repair mutation | Production observation remains deployment evidence | Preserve read-only authority and add links to governed repair commands only after ADM-04 exists | P1 |
| ADM-03 | Emergency per-bot factual closure | **WORKING FINE** in disposable PostgreSQL and website-route scope | Platform-admin-only CAS routine, forced RLS, append-only events and route fail-closed check passed; closing one bot did not close another | Production application and admin UI use are not inferred | Keep fixture mandatory and expose action in fleet health UI | P0 |
| ADM-04 | Governed repair commands | **WORKING FINE** in disposable governed-command admission scope | Forced-RLS ledger and platform-admin routine enforce command allowlist, property FK, reason, expected version, exact payload hash and idempotency convergence; direct runtime roles have no table mutation | Canonical workers for each command type remain separately admitted implementations | Require workers to claim only this ledger and record terminal result | P1 |
| ADM-05 | Two-person material approval | **WORKING FINE** in disposable approval-ledger scope | Platform-admin-only request, independent approval and exact action/target/payload-hash consumption enforce expiry and one-time execution; self-approval and mismatch fail closed | Production material routines must pass the consumed approval during rollout integration | Preserve exact-payload and self-approval negative fixtures | P1 |
| ADM-06 | Break-glass control | **WORKING FINE** in disposable database-control scope | Platform-admin-only issuance requires incident format, explicit scopes, reason and maximum one-hour expiry; independent retrospective review is enforced and runtime roles have no direct access | Production authentication step-up remains an operational identity-provider control | Require step-up before calling issuance and alert on unreviewed expired grants | P1 |

### J. Monitoring, reliability and scale

| ID | Control | Status | Evidence / current fact | Fault line | Next action | Priority |
|---|---|---|---|---|---|---|
| MON-01 | Per-bot factual readiness | **WORKING FINE** in Super Admin API/disposable database scope | Private no-store fleet endpoint reports exact blockers for release, closure, source, membership, retrieval, validator and delivery uncertainty; disposable query passed under platform authority | Alert delivery and production observation remain separate | Render this endpoint in the fleet console and preserve blocker tests | P0 |
| MON-02 | Knowledge freshness and crawl coverage | **WORKING FINE** in Super Admin API/disposable database scope | Active capture inventory, page/chunk counts, age, 90% coverage threshold, capture failures and refresh due state are reported per bot | Alert notification ownership remains operational work | Add notification routing without weakening the measured health contract | P1 |
| MON-03 | Unsupported/low-coverage questions | **WORKING FINE** in tenant-isolated clustering/API scope | Open gaps are clustered only within each property and prioritized by occurrence count in the private fleet response | Repair-command workflow remains ADM-04 | Route priority topics into governed repair commands | P1 |
| MON-04 | Delivery uncertainty monitoring | **WORKING FINE** in private fleet API/unit scope | Durable uncertain failures are queried by exact detail flag and returned with property, provider, key, age, threshold and OBSERVE/HIGH/CRITICAL severity | External notification delivery remains operational work | Connect high/critical results to the governed incident channel | P1 |
| MON-05 | Release/configuration drift | **WORKING FINE** in manifest/API test scope | Deterministic expected/runtime manifest comparison detects file or commit drift; private no-store admin endpoint fails visibly on invalid manifests | Continuous production polling is not inferred | Supply admitted manifests in deployment and alert on `drift=true` | P0 |
| MON-06 | Role/database pool capacity | **WORKING FINE** in disposable 1,000-bot database profile | Web, public, worker and publisher pools each completed 100 concurrent identity checks with zero errors; the shared 1,000-query pool probe also had zero errors | Production connection limits and noisy-neighbour behavior are not inferred | Reuse the profile on staging with production pool budgets | P0 |
| MON-07 | Retrieval and model latency | **NEEDS ATTENTION** pending staging execution | Database retrieval passed; a fail-closed staging harness measures real public answer-route p50/p95/p99, errors and timeouts across the model path for at least five minutes; shortened-profile rejection passes | No staging endpoint/inventory is configured, so provider latency/cost was not fabricated | Supply staging URL and bot inventory, pass `verify:p2b:final-three-ready`, then execute the load gate | P0 |
| MON-08 | Crawl-worker throughput and leases | **WORKING FINE** in disposable 1,000-job/20-worker profile | `FOR UPDATE SKIP LOCKED` workers claimed 1,000/1,000 jobs exactly once with zero duplicate claims | Long-running captures, retries and production queue age remain operational evidence | Extend staging profile with real capture duration and reclaim faults | P1 |
| MON-09 | Audit/storage growth | **WORKING FINE** in disposable 50,000-row profile | Indexed per-property recent-audit lookup produced p50 0.10 ms, p95 0.13 ms and p99 0.15 ms after 50,000 inserts | Multi-year volume, partition maintenance and production storage cost are not inferred | Project retention volume and repeat at the first partition threshold | P1 |
| MON-10 | Realistic 1,000-bot qualification | **NEEDS ATTENTION** pending staging execution | Disposable database slice passed; automated tests prove the staging harness refuses fewer than 1,000 unique slugs and unsafe duration/concurrency; the real gate fails above 1% errors or 8-second p95 | Staging URL and 1,000-bot inventory are absent; external delivery/provider quota mix remains unexecuted | Provision the staging fleet/inventory, pass `verify:p2b:final-three-ready`, and run `npm run verify:p2b:staging-load` | P0 |

## Current P0 sequence

The following order is mandatory because later controls depend on earlier authority:

1. **APP-01:** reconcile the final source snapshot and sign it with the authorized release key; signing and verification tooling is complete.
2. **GOV-02/GOV-03 — completed in isolated P2-B scope:** machine policy persistence, exact release identity and CAS activation.
3. **KRL-02/KRL-03 — completed in isolated P2-B scope:** signed multi-source release and atomic pointer.
4. **KRL-04 — completed in isolated website canonical scope:** alternate factual fallbacks disabled.
5. **ANS-07 — completed in isolated active-crawl scope:** material claim decisions enforced and persisted.
6. **Website channel boundary — completed in isolated scope:** one factual envelope before canonical delivery; WhatsApp is out of scope.
7. **SRC-10 — completed in admitted persistence scope:** shared pre-persistence interception covers every currently admitted factual/message persistence boundary.
8. **HND-03 — completed in website application-fixture scope:** production inbox receipt remains rollout observation, not an architecture blocker.
9. **APP-08 — completed in integrated disposable scope:** repeat the exact edge-closed rollback on the approved restored-production target only after APP-01.
10. **MON-06/MON-08/MON-09 — disposable database profile complete; MON-07/MON-10:** extend the passing database slice through staging HTTP/model/provider load.

## Update rules

1. Every architecture issue receives a stable ID from this document.
2. New issues are added to the relevant section; they are not kept only in chat or screenshots.
3. A status change records date, environment, command/test, result and evidence path.
4. **WORKING FINE** must name its scope; Webtechnosys evidence is not fleet evidence.
5. A failed test changes the row to **NEEDS ATTENTION**, **BLOCKED** or **NOT RUN** as appropriate.
6. Fixes must strengthen shared architecture. Client-specific patches require explicit exception review.
7. Closed issues remain visible with their evidence and closure date; they are not deleted from the register.
8. Super Admin should eventually render this register from authoritative machine status. Until then, this file is the controlled human overview.
9. After every completed implementation stage, issue a stage report using the mandatory format below. Recalculate the 74-control register from the table; never reuse an earlier percentage without recounting.

## Mandatory stage implementation report

Every completed stage report must contain:

```text
Stage: <name>
Outcome: PASS / PARTIAL / FAILED

Architecture status after this stage:
- <count> of 74 controls WORKING FINE — <percent>%
- <count> NEEDS ATTENTION — <percent>%
- <count> NOT IMPLEMENTED — <percent>%
- <count> NOT RUN — <percent>%

Status changes:
- <CONTROL-ID>: <old status> → <new status> — <evidence>

Tests/evidence:
- <exact command or evidence path>: PASS / FAILED / NOT RUN

Remaining P0:
- <next exact control and action>
```

Rules:

- The four status counts must total 74.
- Percentages must total 100%, allowing only rounding difference.
- A stage with no qualifying status change must say **NO CONTROL STATUS CHANGED**.
- Limited-scope success must retain its scope in the status label and must not become fleet-wide green.
- Reports must distinguish code implementation, behavioral testing, deployment and production observation.
- Failures and unexecuted gates remain visible; they are never removed to improve the percentage.

## Linked evidence

- `docs/BOT_CONSTITUTION_V1_1.md`
- `docs/AIFROGI_SUPER_ADMIN_STRENGTHENING_STRATEGY_V1.md`
- `docs/ACTIVE_CRAWL_SERVING_STANDARD.md`
- `evidence/WEBTECHNOSYS_CONSTITUTION_V1_1_20_QUESTION_REVIEW_2026-09-29.md`
- `evidence/CANONICAL_RUNTIME_RECONCILIATION_2026-09-29.md`
- `docs/P2B_V6_PRODUCTION_ROLLOUT_ROLLBACK_RUNBOOK.md`
