# Castle Mandawa shadow pilot

Enabled on Core VPS on 20 September 2026. Only organization `cmu2dcedu003284kxjotchehs` is allowlisted. Mode is shadow: the existing response and transaction controls remain authoritative. Other tenants are excluded.

## Bounds and verification
- 18 TypeSafe tests passed, including request budget and concurrency guards.
- Maximum 20 attempts per tenant per UTC day in the one running process; one in flight. Process restart resets this counter, so this is not a durable global quota.
- Provider timeout: 2.5 seconds. Shadow observation is awaited and can add that latency to a sampled answer.
- Outbound message is an English fixed-vocabulary projection; unknown tokens, numeric tokens, email addresses and URLs are excluded. This loses context and is not a proof of anonymization: common words may still convey personal semantics.
- Audit metadata stores labels, confidence, latency and token counts, not raw question text. Review action `TYPESAFE_SHADOW_OBSERVED` under the tenant's audit scope for actual live samples.
- Synthetic connectivity check succeeded: BOOKING_ENQUIRY, 944 ms, 632 input / 102 output tokens. No customer conversation, lead or booking was created. This standalone check is not evidence of a sampled live request.
- Production readiness HTTP 200 after activation.

## Expiry and rollback
Persistent systemd timer `aifrogi-typesafe-pilot-expiry.timer` disables the pilot at **2026-09-21 08:46:35 UTC / 14:16:35 IST**. The timer survives reboot and runs overdue expiry after startup. Its disabling command restarts the app with TypeSafe off and saves PM2 state.

Immediate disable: `node /var/www/lead-os-ai/ops/typesafe-castle-pilot.mjs disable`.
Status: same command with `status`. Do not run `enable` again without reviewing/resetting expiry.

Do not claim accuracy improvements from this pilot until real sample disagreements, failures, latency and token usage have been reviewed. No automatic routing activation follows expiry. No RLS changes or AI Readiness infrastructure changes were made.
