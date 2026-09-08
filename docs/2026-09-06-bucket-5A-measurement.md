# Bucket 5A — measurement foundation

Superseded checkpoint: Bucket 5A measurement/review tooling is now deployed and accepted. See `2026-09-06-bucket-5A-closure-check.md` for the 408/408 local tests, 17/17 staging and 17/17 live acceptance evidence. The incomplete list below records the earlier foundation state, not the current status. Real-world accuracy remains uncertified.

## Implemented
- Tenant-scoped client measurement in Improve My Bot; all-bot measurement in Super Admin Intelligence Operations.
- Authenticated JSON report, no-store, no transcripts or session identifiers returned.
- Last 30 days, explicit 10,000-record cap and truncation flag.
- Known demo tenants/mock-model records separated as SYNTHETIC. Remaining traffic is UNCLASSIFIED, not assumed real.
- Answer and distinct-session counts, rating participation, helpful/negative counts, automated decision mismatches, unknown decisions and retrieval near misses.
- Human-reviewed accuracy and real-conversation count withheld; automated safety flags and thumbs-up votes never certify correctness.

## Not yet complete
- Historical real-vs-test provenance cannot be established from the current evidence schema. Manual trusted cohort registry and authenticated future test tagging remain work.
- Independent reviewer rubric and review persistence are not implemented in this slice.
- Existing legacy aggregate widgets remain operational diagnostics, not cohort-clean accuracy measurements.
- Guided-demo UI clicks produce no answer evidence and are not included in these counts.
- Feedback end-to-end write audit, reviewer workflow and pilot tester acceptance remain pending.
- Bucket 4 connector hardening remains open; no booking authority or KB changes here.

## Gates
No 95% or 95.5% accuracy certification based on these reports. No automatic KB correction, threshold recalibration or publication.

## Feedback code review
The existing widget endpoint verifies the signed visitor capability, live session, workspace and lead ownership before writing feedback. Negative feedback upserts a replay review case and sets safeResolution=false. Consequently the legacy safe-resolution measure is influenced by unreviewed visitor feedback, not an independent correctness label. Positive feedback does not undo an earlier negative evidence classification; review must reconcile that state. The new measurement panel keeps helpfulness counts separate and issues no correctness score. No synthetic feedback was injected into the real tenant during this slice.

Local verification: TypeScript passed; 393/393 core tests passed, including seven cohort/counting measurement cases.

Deployed: bucket5a-measurement-20260906; health verified 2026-09-06T01:13:51.944Z. Rollback: /var/backups/aifrogi/bucket5a-measurement-20260906.xp4hkD. This is the measurement foundation, not closure of all Bucket 5A acceptance work.
