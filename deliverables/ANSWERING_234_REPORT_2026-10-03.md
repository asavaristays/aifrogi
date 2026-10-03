# Combined priorities 2–3–4: candidate review

**Candidate source commit: `dc6eeb7`. Not deployed. Release gate failed. Production remains healthy on `rag-7c395d4`.** This work combines answer clarity/latency, knowledge-gap diagnosis and expanded quality tests in the existing shared RAG engine. It does not add another answering pipeline.

## Current results

| Check | Result | Meaning |
|---|---|---|
| Full regression suite | 845/845 | Code contracts, permissions, cache boundaries, proof guards and existing channel tests passed |
| TypeScript / isolated production build | Passed / passed | Candidate compiles; this does not prove answer quality |
| Intermediate failures and tenant-isolation scenarios | 13/13 | Synthetic adapter tests; actual replies, sources, stage timings and expected coverage states recorded |
| Original 15 question wording and signal checks | 15/15 raw signals | Source review still finds omitted useful pricing information in #14; a keyword match is not sufficient |
| Original 15 plus 15 frozen expanded cases | 25/30 raw signals | Actual replies and original signals preserved; the release gate is failed |
| Grounded answer review | Incomplete answers in #14, #21, #24, #27; false missing part in #20 | Candidate must not replace the current release |
| General clarity | Not achieved consistently | #1 and #19 remain long; #3 redundantly lists booking and volunteers a weekday |
| Production / public test after deployment | Not performed | No deployment occurred, so there is no new production pass claim |

The raw matcher checks substrings and minimum matching counts, exactly as before. #26 is a supported scope-dependent/on-request pricing answer despite failing the word matcher on synonyms. #28 gives an explicitly sourced results limitation instead of a phone fallback, so it also fails its raw phone matcher. Conversely, #14 passes raw words but omits the published pricing policy. These disagreements are retained, not repaired by rewriting questions, criteria or answers. Raw 25/30 is not a customer resolution rate or an industry rating.

## Changes implemented in the candidate

- Kept one shared tenant-scoped retrieval/composition/proof path. Exact permitted contact facts remain extracted without model calls. No new crawling, FAQs, business content, payment connectors, model migration or second answer service.
- Simplified the generation instructions and shortened default style guidance. Supported length remains a formatting preference; no factual answer is rejected merely for being long, and no second shortening call or generation retry was added.
- Kept lexical/semantic retrieval parallel for general questions and one generation plus one batch support check. The verifier receives only the union of draft-cited **full** source passages; source text is not truncated. Verifier citations must stay within that supplied set.
- Added a process-local query-vector cache: 120-second TTL, 256 entries, shared in-flight work and copies on read. Keys include organisation, property, source snapshot, embedding model/dimensions and query. Authority is checked before lookup; source retrieval and final authority recheck still run. Answers, passages and conversation memories are not cached by this addition.
- Added coverage diagnostics for supported/partial answers, missing information, source conflict, live-data requirements, authority denial and engine failure. Recorded model request duration, token usage and embedding cache-hit duration separately from non-overlapping pipeline stage timing.
- Protected URL/email/mixed-case identifiers during typo normalization; improved generic email and weekend-visit parsing.
- Added conservative guards for conditional claims and per-unit quantity relationships. They prevented the fabricated public-sharing promise and invented per-shoot count seen in earlier runs, but the final run shows that these guards can also remove useful facts or introduce unasked uncertainty. This is an explicit candidate limitation.
- Changed the fact guard so a bad optional sentence cannot discard all supported facts. The existing support review determines whether removal leaves a specifically requested part missing. Hard-rejected claims cannot be rescued by a model's incorrect approval.

## Why the release fails

| Cases | Failure | Evidence and cause | Classification |
|---|---|---|---|
| #14, exact filmmaking price | Only phone and missing-price message returned | Retrieved row 10 says pricing depends on scope/assets/campaign/formats and offers commercial pricing on request. The numerical quote is absent, but the useful policy is present and omitted | Generation/completeness defect; not a need for another crawl |
| #20, hotel promo video | Supported capability followed by “requested unconditional commitment” uncertainty | Visitor asked for capability. The relation guard introduced an unasked missing part after omitting another draft sentence | Guard/request-binding defect |
| #21, delivery-driver apps | Supported generic app capability omits iOS/Android | Published platform evidence exists; #22 correctly answers the related iPhone follow-up | Completeness defect |
| #24, public sharing of an idea | Fabricated promise blocked, but NDA safeguards also lost | Rows 18/52 describe conditional NDA/access-control safeguards. They do not establish an absolute public-sharing promise | Claim/safeguard binding defect plus a genuinely absent specific policy |
| #27, videos from one shoot | Invented yield blocked, but published packages omitted | Row 10 offers sets of 10/25; row 8 says one planned production can create several formats. These do not establish a guaranteed numerical per-shoot yield | Incomplete partial answer, not missing package data |
| #1, #19 | Excessive length and process detail | Evidence is supported; style instructions are not followed consistently | Presentation/latency limitation; length does not invalidate facts |
| #3 | Booking repeated and unasked schedule volunteered | Row 55 describes Saturday cohorts while row 56 describes Friday cohorts for the same published bootcamp context | Source discrepancy requiring owner confirmation; presentation should omit unasked dates |
| #26, #28 | Published limitation delivered with a partial label | Correct limitation is available; missing exact fee/target is not necessarily another unanswered policy part | Outcome-label/completeness normalization warning |

The bottleneck is proposition-level grounding and completeness: paragraph citations and a model's “supported” verdict do not reliably preserve the actor, condition, quantity unit or requested part. More broad prompt rules did not consistently solve it. The next bounded correction should bind each proposed claim to an exact source statement and a requested question part, preserving conditions and keeping useful published limitations. It should use the same composition/verification calls rather than another answering service. That correction is **not claimed completed by this candidate**.

## Data coverage, separately from engine failures

| Topic | Reviewed evidence | Required action |
|---|---|---|
| Exact office/weekend hours | Not established in the permitted passages; “Indian business hours” and workshop schedules do not give exact office visiting hours | Owner supplies/approves operating hours if desired; retain approved contact meanwhile |
| Bootcamp refunds | No refund eligibility/terms found in reviewed approved workbook or existing crawl matches | Owner supplies/approves policy if desired; do not invent eligibility |
| Microsoft certification | No explicit business certification established; certificate of participation/tool use is different | Require explicit owner-approved certification evidence before a positive claim |
| Guaranteed number of outputs per shoot | Published packages 10/25 exist, but their numerical relationship to one shoot is not explicitly established | Explain existing packages and scope; do not manufacture a yield guarantee |
| Bootcamp weekday | Existing sources describe Friday and Saturday cohorts | Owner confirms whether these are separate valid cohorts or stale/conflicting schedules |
| Pricing / NDA safeguards / application platforms / revenue-results limitation | Already present in approved sources | Fix retrieval/composition and claim binding; do not ask the owner to invent or re-upload these facts |

The existing row 35 contains a general limitation that figures are not promises of revenue/results. The guarantee question #15 did not retrieve that row and used a safe approved contact instead. This is a retrieval/selection gap, not proof that all guarantee-policy content is absent. No new crawl or content was created.

## Measured speed

| Measurement | Pre-change production baseline | Final candidate |
|---|---:|---:|
| 30-case median total | 3.837s | 3.462s |
| p95, nearest rank | 6.329s | 6.176s |
| Maximum | 9.575s | 8.097s |
| Mean reply words | 33.20 | 32.97 |

These are single runs against the same frozen questions. Baseline used public HTTPS; candidate used loopback HTTP on the isolated server, so the reduction cannot be attributed entirely to the code or treated as a production SLA. Reply length did not improve materially overall.

The separate repeated-query experiment recorded embedding 562ms/cache miss, then 1ms/cache hit. Total reply time was 4.411s then 4.461s: output and verifier variability outweighed the embedding saving. The cache is functioning, but it does not prove instant answers. Source authority/retrieval still ran on the hit.

The output/call reduction approach follows [OpenAI's latency guidance](https://developers.openai.com/api/docs/guides/latency-optimization). Measurement, not that guidance alone, determines whether this bot improves.

## Evidence

- [Frozen original and expanded questions](ANSWERING_234_FROZEN_QUESTIONS_2026-10-03.json): created before changes; wording and expected signals unchanged.
- [Every final actual reply in a table](ANSWERING_234_ACTUAL_REPLIES_2026-10-03.md).
- [Final candidate](ANSWERING_234_CANDIDATE_2026-10-03.json) and [pre-change baseline](ANSWERING_234_BASELINE_2026-10-03.json): 30/30 exact response-to-delivery-receipt bindings in each. Each case includes actual reply, full retrieved passages, citations/source versions, source assessment, persisted outcome and per-stage/total timings. No latest-question-text guessing is used to select a receipt.
- [First failed candidate](ANSWERING_234_INITIAL_2026-10-03.json) and [second failed candidate](ANSWERING_234_SECOND_2026-10-03.json): retained, not presented as passes.
- [Cache experiment](ANSWERING_234_CACHE_2026-10-03.json), [13 isolated failure cases](ANSWERING_234_FAILURES_2026-10-03.json), [reproducible failure harness](ANSWERING_234_FAILURE_GATE_2026-10-03.ts).
- [845-test regression log](ANSWERING_234_REGRESSION_2026-10-03.log), [TypeScript log](ANSWERING_234_TYPECHECK_2026-10-03.log), [candidate build log](ANSWERING_234_BUILD_2026-10-03.log).
- [Source hashes](ANSWERING_234_SOURCE_MANIFEST_2026-10-03.json), [server source identity and current production readiness](ANSWERING_234_SOURCE_VERIFICATION_2026-10-03.txt), [read-only crawl coverage scan](ANSWERING_234_CRAWL_COVERAGE_SCAN_2026-10-03.txt).

Pipeline stages and child model-request durations are recorded separately; summing both double-counts time. The regression command uses the existing test-only server-only import-marker shim; it does not disable production runtime permissions. Fault scenarios use synthetic in-memory adapters, not production outages or modified tenant knowledge.

## Rollback and current production

No production source, build, environment, schema, knowledge, permission or PM2 process was changed by this task. No production rollback is needed. The isolated candidate process is stopped after evidence collection; candidate sources/build remain for review.

Candidate code rollback is `git revert dc6eeb7` on this branch after reviewing later dependent work; it does not require deleting business data. It was not executed. To discard only the isolated runtime, stop its confirmed loopback-3217 launcher/child, not other Next/PM2 processes.

Before any future deployment, retain the currently healthy production source/build and release identity `rag-7c395d4`, validate the complete candidate gate, and deploy only that immutable tested build. On regression, restore that retained source/build and release identity, restart only `lead-os-ai`, verify `/api/health/ready`, then repeat the approved public questions. Never restore an old business database merely to roll back answer code. The existing [step-1 rollback script](FALLBACK_STEP1_ROLLBACK_2026-10-03.sh) restores an older `b20f5b1` release and must not be mistaken for a rollback of this undeployed candidate.
