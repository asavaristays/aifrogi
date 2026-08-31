# AiFrogi Intelligence Evidence Pipeline

Version: 1.0  
Implemented: 2026-08-31  
Applies to: every current and future AI Bot persona

## Purpose

The Intelligence Evidence Pipeline turns each governed conversation into measurable engineering evidence. It does not allow a bot to rewrite its own constitution, persona, approved knowledge or authority. Observed failures become reviewable signals and anonymized regression cases; authorised people still control publication.

## Runtime flow

1. Classify the current intent and persona.
2. Score approved atomic claims, including controlled synonym expansion.
3. retain the top retrieval candidates with scores.
4. distinguish candidates, selected claims and claims evidenced in the final answer.
5. identify a near miss when relevant knowledge existed but did not clear selection.
6. record decision, observed behaviour, reliability, failure class and Safe Resolution result.
7. convert negative feedback into an anonymized, tenant-bound replay case.
8. report SRR separately for each persona category.

## Evidence recorded per governed turn

- tenant/property and conversation-safe identifiers;
- constitution, blueprint, persona-pack and pipeline versions;
- intent, disposition, resolution state and decision reason;
- retrieval candidates and normalized scores;
- selected, used and near-miss claim IDs;
- grounding, source evidence and knowledge timestamp;
- decision-versus-behaviour consistency;
- reliability layer, code, attempts, latency and escalation tier;
- normalized failure classification;
- Safe Resolution result.

### Nine new evidence columns

The production `9/9` schema check refers specifically to these new columns on `SovereignAnswerEvidence`:

1. `personaCategory`
2. `personaVersion`
3. `retrievalCandidates`
4. `retrievedClaimIds`
5. `usedClaimIds`
6. `nearMissClaimIds`
7. `failureClassification`
8. `safeResolution`
9. `evidencePipelineVersion`

Decision-versus-behaviour consistency existed before Pipeline v1.0. `SovereignReplayCase` is a separate new table, not one of the nine columns.

## Failure taxonomy

- `RETRIEVAL_MISS`: relevant approved knowledge existed but was not selected.
- `GROUNDED_WRONG`: supplied knowledge or grounded output needs correction.
- `UNGROUNDED_GENERATION`: an ordinary business answer was produced without approved grounding.
- `CONNECTOR_FAILURE`: a required external read/write/verification failed.
- `CONVERSATION_STATE`: multi-turn state, repetition or decision behaviour failed.
- `INFRASTRUCTURE_FAILURE`: model or platform reliability prevented a verified result.
- `SAFE_ESCALATION`: the system correctly declined, clarified or handed over.
- `UNCLASSIFIED_NEGATIVE_FEEDBACK`: a visitor reported an unsuccessful outcome; human review must identify the repair layer before publication changes.
- `NONE`: no detected failure.

## Safe Resolution Rate

SRR is calculated per persona category. Grounded answers and correctly governed clarification, refusal or escalation may count as safe. Retrieval misses, hallucination-like ungrounded answers, connector failures, infrastructure failures and decision mismatches do not count as safe.

Portfolio-wide averages must not hide category behaviour. ClinicGPT, HotelGPT, eduGPT and other personas retain separate denominators.

## Replay governance

Negative feedback creates or refreshes one replay case linked to the original immutable evidence record. Before storage, direct email addresses, phone numbers, URLs and secret-like values are redacted. Replay cases begin as `PENDING_REVIEW`; feedback never silently changes production knowledge or prompts.

An authorised review must determine the expected disposition and evidence before a replay case can become a release gate. This preserves the Sovereign Intelligence principle: learning is governed improvement, not uncontrolled self-training.

## Measurement boundaries

Production logs alone cannot prove retrieval recall. Recall requires a labelled question-to-relevant-claim set. Until reviewed replay cases provide that label set, AiFrogi reports candidate-to-selected traces, used-claim evidence, known-answer retrieval success and reviewed near-miss rate without claiming formal recall.

## Data-dependent next stage

After 3–5 clients provide sufficient reviewed evidence:

- activate reviewed replay cases as pre-publication regression gates;
- tune Answer/Clarify/Escalate thresholds by persona;
- measure false-confidence and false-caution separately;
- alert on decision-consistency and SRR drift between versions;
- correlate failures with claim type and connector class;
- use retrieval-frequency changes as a proactive freshness signal.

These controls require real labelled outcomes. They must not be presented as complete before the sample and review requirements are met.

## Pipeline rollback and patch-forward policy

Rollback the application release immediately when any of these conditions occurs:

- evidence writes cause customer-answer requests to fail or materially increase runtime errors;
- tenant attribution is missing or cross-tenant evidence becomes possible;
- negative feedback can create a replay case linked to another tenant or conversation;
- schema or generated-client incompatibility prevents the current application from starting;
- a shadow comparison shows the evidence-enabled runtime changed answer text, disposition, permitted authority or connector outcome for the same input and version; the evidence layer must remain observational;
- after at least 20 comparable governed turns for a persona, Safe Resolution Rate falls by more than 5 percentage points or refusal/escalation rate rises by more than 10 percentage points against that persona's approved pre-release baseline, without an approved change record explaining the shift;
- before 20 comparable turns exist, any repeated unexplained behaviour shift in three or more reviewed conversations triggers release hold and manual comparison rather than a statistically unsupported percentage decision.

Disable or patch the affected measurement path forward, without reverting the additive schema, when:

- near-miss scoring produces excessive analytical false positives but customer answers remain governed;
- used-claim inference is incomplete while selected claims and source evidence remain accurate;
- persona SRR reporting is delayed, duplicated or temporarily unavailable;
- replay-case review metadata is incorrect but source evidence remains intact and tenant-bound.

The additive columns and replay table may remain after an application rollback because the preceding release ignores them. Destructive down-migrations are prohibited during incident response. Restore the database only for proven data corruption that cannot be repaired transactionally, after explicit incident authority.

Threshold alerts alone do not authorize rollback. The operator must confirm version comparability, tenant scope and absence of an approved persona/knowledge change. Zero-tolerance isolation, unauthorized-action and cross-tenant events bypass the sample threshold and require immediate containment.
