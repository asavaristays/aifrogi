# External-website intelligence plan — 28 September 2026

## Decision and observed limit

Camp Hornbill and future client websites are not hosted by AiFrogi. The production VPS reaches Google and GitHub but cannot open a TCP connection to `thecamphornbill.com:443`. Retrying the same in-process `fetch` cannot make ingestion reliable. The existing website crawler is an ingestion worker inside the application process; the chat runtime must not crawl. The five-page Camp Hornbill snapshot is a separately approved, browser-observed fallback, not evidence of a successful VPS crawl.

The user confirmed that the two different secondary mobile numbers published by the hotel's header and contact section are both valid. The live tenant snapshot preserves the page locations separately and stores the user's weak-reception guidance as a distinct correction. No client fact belongs in shared Core code.

## Reusable target architecture

1. An AiFrogi-owned crawler worker with independent egress accepts a tenant-bound job containing an approved root URL and an idempotency key. It checks DNS, TLS, redirects, robots policy, content type, origin and maximum page/byte/time limits. It fetches sitemap and links first, then renders pages that need JavaScript. A second egress route is tried only after a classified network failure. The worker cannot access the production database directly.
2. The worker sends signed, content-addressed page captures to a restricted ingestion endpoint. Each page retains original URL, canonical URL, title, capture time, HTTP outcome, content hash, text and exact source spans. Partial failure remains visible; a job cannot become `READY` merely because one page loaded.
3. Extraction produces typed, atomic candidates with value, field, evidence span, source URL, observed time and extractor version. Phone/email/address extraction is deterministic; semantic judgments may rank or classify candidates but never invent a missing value. Repeated values are deduplicated. Different phone numbers are alternatives unless the source or owner says one supersedes another; conflicting rates, policies and identities require review.
4. Reconciliation applies owner correction > approved document/Q&A > website draft. The bot reads only a published tenant version. A new crawl creates a diff and review queue; it cannot silently replace approved commercial facts. The previous approved version is retained for rollback and a bounded stale read after a failed refresh.
5. Retrieval uses source spans, entity identity, lexical search and semantic reranking. A multipart question gets a field-by-field answer plan and a coverage check before delivery. Each factual sentence must map to a current approved fact or source span. Unsupported fields are identified individually, without suppressing the supported parts.
6. The answer composer applies the active category persona after evidence selection. HotelGPT answers first, sounds hospitable without repeated sales prompts, and distinguishes information, enquiry, live availability, booking and verified confirmation. A completed action requires the existing endpoint contract and read-back. Missing information gets one courteous, bounded route to staff.
7. Voice uses a guest-confirmed transcript as input to the same pipeline. Preserve the original transcript, language, names, dates and numbers; translate only for display or staff routing. Hindi/Hinglish and other enabled languages must pass the same privacy, evidence and action gates as typed text.

### Durable records

The proposed database records are `CrawlJob`, `CapturedPage`, `ExtractedFact`, `FactEvidenceSpan`, `FactConflict`, `PublishedKnowledgeVersion`, and `KnowledgeEvaluation`. Each is tenant/property scoped. Raw captures and page hashes may live in encrypted object storage with database pointers; the approved facts, review decisions, publication version and answer evidence remain in the database. JSON is an export and recovery format, not the sole source of truth.

### Release gates

- Test the crawler against at least two unrelated third-party sites, including one whose origin is unreachable from the app VPS. Verify independent egress, rendering, extraction, explicit failure reporting and signed ingestion.
- For a new tenant, withhold bot publication until identity, contact, core offering, location and vertical-required topics have reviewed evidence. Missing price or live inventory remains unavailable, not guessed.
- Replay a human-reviewed bank across factual, multipart, contextual, frustrated, privacy, action and multilingual turns. Report the numerator, denominator and per-category failures. The target is at least 96% acceptable answers on a separate real-world bank, with 100% privacy and false-confirmation safety. The 96-case synthetic contract suite is a code gate, not this accuracy result.
- Keep TypeSafe decision services disabled for production answer authority until narrow candidate-selection/reranking judgments beat the deterministic baseline on this bank. Typed output alone is not proof of factual truth.

## Delhi guest acceptance persona

A Delhi parent plans a two-night stay for two adults and two children, may travel with a dog, asks in English or Hinglish by text or confirmed voice, wants direct answers before giving contact details, and grows impatient after repetition. The bank below is exploratory; expected answers and evidence spans must be reviewed before it becomes a scored release set.

1. Where exactly is Camp Hornbill?
2. How far is it by road from Delhi?
3. Which railway station is nearest?
4. How do we get from that station to the camp?
5. What kinds of cottages do you have?
6. Which cottage suits two adults and two children?
7. Is the camp suitable for my parents?
8. Can we bring our dog?
9. What is special about staying there?
10. Is birdwatching guided?
11. What time does birdwatching start in winter?
12. Do you arrange a wildlife safari?
13. Is safari included in the stay price?
14. What forest walks can children join?
15. Can we cycle near the camp?
16. What is the riverside activity?
17. Can we meet people from the local village?
18. What food do you serve?
19. Can you cater for a vegetarian child?
20. What should we pack in December?
21. Is mobile signal or Wi-Fi available?
22. Is the property wheelchair accessible?
23. What are check-in and check-out times?
24. What is the cancellation policy?
25. What will two nights cost for four of us?
26. Give me the full address, all phone numbers and both emails.
27. I asked for the price twice. Why are you asking for my number?
28. Your answer sounds scripted. Can you just tell me what you know?
29. Book the Stone Cottage for tomorrow and confirm it is complete.
30. I want a person now, but I don't want to share my phone number here.

Distance and station answers require a verified access source or route provider. If a route provider is used, state that the driving distance is an estimate and capture its time and destination. General model memory is not enough to certify a particular route.

## Current release and unresolved dependency

Release `de98249` fixed the live Camp Hornbill contact response and unverified booking wording. The exact contact answer, privacy refusal and booking boundary passed fresh Chrome guest checks; 408 Sovereign tests, 279 channel tests, TypeScript, the 96-route build, SEC-001 and public readiness passed. The Delhi distance/station question still reached the safe knowledge-gap route. A production-grade independent crawler and a verified route source are not yet configured, so the 96% outcome and automatic ingestion for every future signup remain unverified. This document is the implementation contract for that separate infrastructure release; it is not a claim that the worker exists.
