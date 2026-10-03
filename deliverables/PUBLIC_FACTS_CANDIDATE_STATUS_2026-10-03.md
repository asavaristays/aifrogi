# Answer-engine candidate — 3 October 2026

Status: candidate implemented and tested in isolation; production not changed.

Changes:
- Shared extraction of explicit phone, email, postal/operating address and labelled business hours from admitted tenant evidence.
- Contact-specific lexical retrieval prevents mobile-software and workshop-location passages from dominating contact requests.
- Exact extracted facts bypass embedding and model generation while retaining digest, tenant, active-generation and delivery-authority checks.
- Incomplete extraction falls through to existing grounded composition. Exact hours are explicitly marked missing when no schedule is verified.
- Request-local, tenant/generation-scoped workbook-query deduplication avoids duplicate database work. No global fact or conversation cache added.
- Contact queries can use already published workbook-linked crawl evidence.
- Removed generated-text character-length restrictions; brevity remains a prompt preference.
- Current-question contact resolution supports the existing follow-up context format.

Verification:
- 23 targeted tests passed (14 fact-path, 3 conversation, 6 existing fact-governance tests).
- Type checking and production webpack build passed.
- Isolated server engine benchmark: unchanged 15 questions pass original signal checks. Signal checks do not establish complete factual correctness.
- Phone: +91 74105 82898, 62–85 ms. Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India, 135 ms. Email: info@webtechnosys.com, 97 ms. All four contact cases use zero model tokens.
- Approved-question median engine latency: 1999 ms. These are engine measurements, not full public API/client response times.
- Exact opening hours: correctly unverified; response identifies the missing schedule.

Remaining gate work:
- Full public-route end-to-end candidate test including actual conversation follow-ups and total latency.
- Independent claim-by-claim review of generated answers, including the guarantee answer.
- Resolve or suppress unasked training schedule detail: admitted crawl has Friday cohorts on training page and Saturday cohorts on booking page.
- The persistent owner-approved profile publication/source-precedence integration is not part of this candidate; exact fact delivery uses existing admitted crawl/workbook evidence. No raw organization profile values have been newly activated.

No new crawl, FAQs, question-specific answers, profile publication, production migration or deployment occurred.

Recovery/rollback:
- Production remains on the existing release; no production rollback is necessary.
- Candidate server files are isolated at /tmp/aifrogi-facts-candidate and do not replace /var/www/lead-os-ai files.
- Revert the candidate commit to remove the source changes. Preserve the JSON evidence report for audit.
