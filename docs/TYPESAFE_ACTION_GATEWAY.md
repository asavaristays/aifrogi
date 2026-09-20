# TypeSafe Action Intent Gateway

## Purpose

TypeSafe provides a narrow, typed assessment of a customer message before a
potentially commercial conversation branch. It is an advisory classification
layer, not an action engine.

## Non-negotiable boundaries

- It never receives connector credentials, payment data, OTPs, card data, or
  private guest records.
- It cannot create a quote, booking, cancellation, payment order, or refund.
- A high-confidence availability or booking enquiry still requires deterministic
  field validation, live connector reads, tenant authorization and the existing
  provider verification rules.
- Payment, transaction, sensitive, unclear and human-handover intents are never
  eligible for autonomous execution.
- API failure, malformed output, a missing credential or low confidence fails
  closed: no action suggestion is made and existing AiFrogi controls continue.

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
connector command.
