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
