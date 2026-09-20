# TypeSafe Action Intent Gateway

## Purpose

TypeSafe provides a narrow, typed assessment of a customer message before a
potentially commercial conversation branch. It is an advisory classification
layer, not an action engine.

## Current implementation status

The website bot source now calls a shadow observer after deciding its answer.
Activation requires TYPESAFE_ACTION_GATEWAY_ENABLED=true, TYPESAFE_MODE=shadow,
a key, and an exact organization ID in TYPESAFE_SHADOW_ORGANIZATIONS. Defaults
send no traffic. These runtime changes have not been promoted to production.

The observer applies a fixed English vocabulary projection before transmission:
unknown words, digit-containing tokens, email tokens and URLs are omitted.
This is a lossy minimization technique, not a general anonymization guarantee;
allowed words can still convey sensitive intent. Only the projection and generic
"Hospitality business" name are sent. Telemetry contains labels, confidence,
latency and token counts, never the message. A process-local limit permits 20
requests per tenant per UTC day and one in flight; it resets on restart and is
not an account-wide billing cap. Requests can add up to the adapter timeout to
response latency. Audit writes use a separate transaction and failure cannot
roll back the visitor response. The primary response is never changed.

### Production promotion blocker discovered

The existing production release script returned a misleading 0/0 fleet pass
because it did not establish the system identity required by RLS. The candidate
script now establishes that identity and refuses zero-tenant production passes.
The corrected server check found three live tenants (Asavaristays, Castle Mandawa,
Webtechnosys), all blocked because no Golden banks were available. A read-only
check also found no tenant-certification JSON files in the active application data
directory. Restore/review their banks and rerun certification before promotion.
Core's fixed certification remains 30/30. No RLS policy was weakened.

The standalone synthetic runner can be invoked with:
`node --import tsx scripts/evaluate-typesafe-synthetic.ts`
It expects `TYPESAFE_API_KEY` in the process environment and reads no tenant
records. Its 24 hand-authored cases are a smoke test, not production certification.

### Completed comparison pilot

The standalone bundled runner is installed on the bot VPS at
`/var/lib/aifrogi-typesafe-pilot/evaluate-20260920-r2.mjs`. The root-only report is
`/var/lib/aifrogi-typesafe-pilot/report-20260920-r2.jsonl`.

The second server run matched 24/24 expected classifications with zero category
compatibility disagreements after two targeted local Core routing fixes. All
24 primary plans were retained unchanged. Two results abstained (low-confidence
wedding enquiry and unknown text). Usage: 15,303 input and 2,430 output tokens.
This is TypeSafe usage, separate from OpenAI usage; no dollar estimate is claimed.

The initial comparison found that Core missed a misspelled reservation contact
request and incorrectly routed a guest-owned mobile-number request as public
contact. Targeted code fixes and regression tests now cover both. These Core
changes are committed source, not a promotion of the running bot application.

Low confidence now recommends KEEP_EXISTING rather than adding a human handover.
Payments retain existing transaction controls; sensitive requests retain existing
safety controls. Only an explicit human request recommends handover. The
comparison module never mutates the primary plan and skips non-synthetic inputs.

Validation: 25 targeted tests, TypeScript check and the full `test:core` command
passed. Live tenant Golden banks, data-minimization review and customer-message
pilot approval are still required before a production routing release.

### Authenticated evaluation — 20 September 2026

The user-supplied credential was tested without displaying it and stored on the
bot VPS in `/etc/aifrogi-typesafe-evaluation.env` (root-only, mode 0600), separate
from the live bot environment. The live routing flag remains false.

Initial evaluation: 11/12 intent labels matched; a misspelled public reservation
phone enquiry was incorrectly classified as sensitive. After clarifying public
contact versus private guest records in the criteria, the expanded run matched
16/16 labels. Observed per-request latency was 343–1215 ms. The wedding enquiry
was correctly labelled INFORMATION but confidence was 0.56, below the provisional
0.82 threshold; the original policy would request review. The comparison pilot
now abstains and preserves existing routing instead. Label agreement alone
does not establish a good customer experience. No production bot route has been
connected. No real customer messages were transmitted.

## Required boundaries before customer rollout

- Synthetic evaluation sends only fictional messages. Before any customer
  rollout, review the vocabulary projection and tenant opt-in. Direct adapter
  callers must not pass raw customer messages; only the runtime observer applies
  projection.
- It cannot create a quote, booking, cancellation, payment order, or refund.
- A high-confidence availability or booking enquiry still requires deterministic
  field validation, live connector reads, tenant authorization and the existing
  provider verification rules.
- Payment, transaction, sensitive, unclear and human-handover intents are never
  eligible for autonomous execution.
- API failure, malformed output, a missing credential or low confidence fails
  closed: no action suggestion is made. Production remains disabled pending
  fleet certification and tenant-specific enablement.

## Controlled rollout

1. Create a dedicated TypeSafe API key; store it only in the server environment
   as `TYPESAFE_API_KEY`, never in tenant records or browser code.
2. Keep `TYPESAFE_ACTION_GATEWAY_ENABLED=false` until shadow-mode evaluation has
   been reviewed against representative tenant conversations.
3. Compare its typed classification with existing deterministic routing and
   record disagreements. Do not change customer-visible behaviour in shadow mode.
4. Enable it only for a designated pilot tenant after approval and regression
   tests. Existing booking/payment provider verification remains unchanged.
5. Meter request usage separately from OpenAI usage and support immediate key
   revocation by removing the server-side value and restarting the service.

## Contract

`lib/typesafe-action-gateway.ts` accepts only a customer message and business
name. It returns one fixed intent plus confidence. It accepts an availability or
booking next step only at confidence 0.82 or above, and returns no executable
connector command. The threshold is provisional and requires calibration against
labelled examples. Typed output and high confidence do not prove factual truth
or authorize transactions.
