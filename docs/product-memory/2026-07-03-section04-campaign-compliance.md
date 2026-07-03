# 2026-07-03 Section 04 Campaign Compliance Memory

Section 04 has started with the campaign safety layer.

## Implemented

- Campaigns now persist compliance/audit fields:
  - `templateStatus`
  - `consentSource`
  - `consentProof`
  - `consentConfirmedAt`
  - `consentConfirmedBy`
  - `audienceSnapshot`
  - `testMode`
- Campaign recipients now persist:
  - `consentStatus`
  - `consentSource`
  - `consentProof`
  - `suppressionReason`
- `lib/campaign-compliance.ts` is the governed campaign catalogue and compliance helper.
- Approved campaign templates currently include:
  - `goa_ai_audit_image_v2`
  - `goa_ai_audit_trial_v1`
  - `trial_intake_followup_v1`
- `goa_ai_audit_image_v2` is the correct image campaign template. Do not use `goa_ai_audit_image_v1`.
- Pending templates are visible in the catalogue but blocked from sending.
- Campaign API now requires authenticated access, approved template selection, consent confirmation, valid consent source, and proof text.
- Campaign UI is now a guided wizard: template, audience, consent, confirmation.
- Recent campaign analytics are visible on the Campaigns page.
- `npm run verify:campaigns` creates and removes a synthetic campaign run without sending WhatsApp messages.

## Remaining Section 04 Work

- Real Meta template catalogue sync through Graph API when the required permissions and identifiers are confirmed.
- Durable consent ledger model shared across contacts, campaigns, imports, opt-ins, and opt-outs.
- Suppression list and opt-out enforcement before send.
- Audience diff preview before final confirmation.
- Scheduling, cancellation, idempotent retries, and recipient-level recovery messages.
- Campaign reply/conversion analytics.
