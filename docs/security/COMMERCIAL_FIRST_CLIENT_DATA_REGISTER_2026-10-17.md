# First commercial client: internal data/provider evidence register

17 October 2026. Source-based preparation; **not a published vendor assurance or executed DPA**.

| Provider/path found in source | Data potentially sent | Evidence | Verification still needed |
| --- | --- | --- | --- |
| OpenAI Responses + embeddings | Customer questions, retrieved public/approved business material, candidate answers; personal data may appear in message/source text | lib/shared-answer-provider.ts; lib/shared-answer-runtime.ts; voice translation service | Actual contracted entity/account, active model/features, region, retention, training and vendor DPA settings |
| Hostinger SMTP/IMAP | Account activation, recipient email/name, notification content; mailbox messages where enabled | lib/channel-config.ts; lib/services/mailbox-service.ts | Active mailbox/features, contract, storage/processing locations, retention, access and delivery monitoring |
| TypeSafe, conditional | Bounded message/context used for advisory intent decisions if enabled | lib/typesafe-action-gateway.ts | Confirm disabled/enabled on the deployed build; if enabled, exact entity/contract/location/data terms |
| Razorpay, conditional billing | Checkout/order/payment identifiers, amounts and transaction metadata; confirm actual fields in the deployed flow | app/api/billing/checkout; app/api/billing/webhook/razorpay | Live mode and contract, actual customer fields, notification handling; no settlement executed here |
| Hosting, PostgreSQL, backup storage | Workspace/lead/conversation records, approved knowledge and encrypted backup copies | lib/db.ts; ops/backup-postgres.sh | Exact hosting vendors/regions, operational access, production schedules, backup expiry and used-tenant deletion verification |

Owner: product/operator must assign an accountable person before external contractual commitments. No provider name/location/zero-retention claim should be copied into public policy until matched to actual account settings and agreements. This session prepares traceable evidence and test results; it does not assert vendor-risk or legal approval. Current source privacy/deletion pages exist, but DPA execution, a verified vendor list and precise retention rules remain evidentiary gaps from the earlier review. No new public promises were published.


## Follow-up evidence, 17 October 2026

The user explicitly authorized synthetic-only OpenAI use through the established server account. Real inference and embeddings were exercised without moving the API credential into this workspace or changing production data. This verifies a functioning account path, not contracted entity, region, training, retention or DPA settings. The prepared candidate now sets `store:false` on its Responses requests; this does not establish Zero Data Retention and is not deployed. Ordinary subscription reads no longer purge tenants; suspended retention expiry records an operator review, preserving prior no-purge holds. Full used-tenant erasure across source evidence, physical payloads, backups and providers is still unverified. See `deliverables/COMMERCIAL_FIRST_CLIENT_READINESS_2026-10-17.md` for the latest failed real-answer reliability gate and bounded remaining launch decisions.
