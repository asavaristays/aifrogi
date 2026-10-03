# RAG recovery — fixed candidate results, 3 October 2026

**The tested candidate is green. Production is unchanged.** All 15 unchanged approved cases, six additional cases, 39 composition-comparison outputs and two real-database failure-recovery cases met the reviewed expectations. The local regression suite is 821/821. These results establish passing tested cases, not 100% correctness for all future questions.

## Changes

- Scope retrieval to the requested subject. Named project/case-study passages cannot establish a general business offering, and general offering passages cannot establish a named project's implementation. Scope is derived from explicit entity metadata or named-case title markers; approved source bytes are unchanged. Unmarked or inaccurate source metadata still needs review when onboarding other businesses.
- Reconcile structured disposition with factual and missing parts before support verification. ANSWER plus missing parts becomes PARTIAL, preserving facts and omissions without another generation. Malformed evidence and unauthorised facts remain rejected.
- Preserve a source opening's explicit deliverable inventory for general offering questions if generation drops an item. This generic, source-derived rule is covered with accommodation and workshop fixtures; it does not contain stored tenant answers or edits to approved questions.
- Resolve questions inside explanatory wrappers without treating “this” as an unresolved topic. Ambiguous affirmative replies clarify unless a specific next-step link offer is present; this confers no transaction authority.
- Recognise operating-hours questions such as Sunday opening queries without interpreting device references as business phone requests.
- If generation or batch verification fails, retrieve an approved phone and recheck its tenant/snapshot authority. Return only that exact contact fact with a clear limitation. No retry, invented answer, callback promise or unsupported model text is delivered. Recovery cannot survive revocation or authority change. If no approved phone can be accessed, factual recovery remains unavailable.

No crawl, extra FAQs, invented content, payment connector, production activation or parallel production pipeline was added. Trial composition modes remain inactive for production callers; the default remains one RAG pipeline.

## Validation

| Check | Result |
| --- | --- |
| Full shared/channel/sovereign regressions | 821/821 passed |
| Type check | Passed |
| Webpack production build | Passed |
| Original approved questions, unchanged criteria plus source review | 15/15 passed |
| Additional contact/follow-up/missing-hours cases | 6/6 passed |
| Corrected policy comparison | 39/39 acceptable: each mode has 11 supported answers and two safe missing-information replies |
| Generation outage → approved contact → canonical delivery receipt | Passed; one generation attempt, no retry |
| Verification outage → approved contact → canonical delivery receipt | Passed; one generation and one verification attempt |
| Database controls and owner workflow from earlier candidate | Previously 12/12 and 7/7; not rerun this turn |
| Production role preflight and online verification of this candidate | Pending; candidate not deployed |

Full end-to-end browser/application rollout is not certified by these isolated tests. Actual model tests use the server-held credential against a local isolated database via a loopback tunnel. Document/publication permissions in that fixture do not certify production grants. The policy comparison reuses existing composition instructions on the RAG adapter, not the entire old production engine.

## Corrected composition comparison

| Mode | Source-supported | Safe missing information | Failed | Median seconds |
| --- | ---: | ---: | ---: | ---: |
| existing-policy | 11 | 2 | 0 | 4.46 |
| rag | 11 | 2 | 0 | 4.12 |
| combined | 11 | 2 | 0 | 4.13 |

The general app-platform probe now answers iOS/Android without transferring Flutter, languages or offline features from the farmer project. The exact-price probe returns the published scope-dependent limitation without a schema failure. The comparison does not prove superiority among composition policies; sample size is small and modes share the corrected retrieval/normalisation layer.

## Approved and additional actual replies

Complete retrieved passages, cited source versions, receipt outcomes, model usage, and per-stage timings are retained in `RAG_FIXED_GATE_2026-10-03.json`.

| # | Exact question | Actual reply | Assessment | Seconds |
| --- | --- | --- | --- | ---: |
| 1 | Can you tell me about AI Filmmaking? | AI Filmmaking creates cinematic films, commercials, and social videos for hotels and tourism brands by starting with real property footage and enhancing the story with AI to reflect guest experiences and moods without replacing authenticity. It involves a structured guest journey storytelling approach—arrival, stay, cuisine, experience, sundowner, and brand close—using AI production to develop real footage into cinematic sequences with editing, sound, and platform-specific cuts. The process integrates hospitality knowledge, visual storytelling, and AI to build emotional narratives from real moments, creating multiple content outputs such as social media sets, commercials, and brand films. | PASS_SOURCE_SUPPORTED | 7.43 |
| 2 | What video outputs can you create? | AI filmmaking creates cinematic AI films, commercials, and social-media videos using real hotel footage and storytelling elements like mood and guest experience. Video outputs include social media content sets of 10 or 25 videos, 30-second AI commercials, and 60-second AI brand films tailored for hospitality campaigns. Final videos are cinematic sequences edited with pacing, music, ambience, captions, and narrative, plus platform-specific social cuts. | PASS_SOURCE_SUPPORTED | 6.19 |
| 3 | What training does Webtechnosys offer? | Webtechnosys offers a Corporate In-House AI Skill Program for companies seeking practical AI adoption, workflow experiments, and applied team training tailored to their business context and use cases. They provide a Practical AI Tool Universe Bootcamp, a one-day hands-on program covering tools like Gemini, Claude, ChatGPT, Cursor, automation, deployment, and AI video production, culminating in a live project. Webtechnosys also offers paid seats for AI Tool Universe Bootcamp cohorts, which include a practical toolkit, prompt templates, AI tool guides, automation workflow templates, and a 30-day AI learning roadmap. | PASS_SOURCE_SUPPORTED | 6.24 |
| 4 | Who is the corporate AI training for? | The corporate AI training is for companies wanting practical AI adoption with their internal teams, including founders, managers, operations teams, sales teams, and departments aiming to use AI responsibly in daily work. It is also useful for operators who want to practice AI-assisted workflows to reduce repetitive work and improve execution rhythm. | PASS_SOURCE_SUPPORTED | 4.91 |
| 5 | Do you develop mobile apps? | Yes, we develop mobile apps including cross-platform customer and workforce apps, polished iOS and Android products integrated with your core business systems, as part of our custom software and AI software development services across Mumbai, Goa, Bengaluru, and Gurugram in India. | PASS_SOURCE_SUPPORTED | 5.48 |
| 6 | Which platforms do those apps support? | Webtechnosys develops polished mobile applications supporting iOS and Android platforms for customers, field teams, and service operations across Mumbai, Bengaluru, Gurugram, and Goa. | PASS_SOURCE_SUPPORTED | 4.61 |
| 7 | Where are your offices? | Webtechnosys AI Agency operates from H.No 746 - TF, New Wada, Morjim, Goa 403512, India, and also has an office in Gurgaon to support businesses in Gurugram/NCR. | PASS_SOURCE_SUPPORTED | 4.91 |
| 8 | How can I contact Webtechnosys? | Phone: +91 74105 82898 Email: info@webtechnosys.com | PASS_SOURCE_SUPPORTED | 1.23 |
| 9 | How do you start a project? | Every project at Webtechnosys starts with a discovery session, followed by a detailed proposal, Statement of Work (SOW), project timeline, and commercial agreement before development begins. | PASS_SOURCE_SUPPORTED | 4.66 |
| 10 | Who owns the source code after delivery? | After successful project completion and full payment, the agreed source code and deliverables are transferred to the client, establishing client ownership unless otherwise specified in the agreement. | PASS_SOURCE_SUPPORTED | 4.88 |
| 11 | Do you sign NDAs? | Webtechnosys signs Non-Disclosure Agreements (NDAs) along with Master Service Agreements, Statements of Work, and Software Development Agreements to protect both parties during engagement. | PASS_SOURCE_SUPPORTED | 5.12 |
| 12 | How are project payments structured? | Project payments at Webtechnosys are typically structured as milestone-based payments, ensuring transparency and reducing risk for both client and provider. | PASS_SOURCE_SUPPORTED | 4.80 |
| 13 | Do you provide post-launch support? | Yes, Webtechnosys provides post-launch support including maintenance, enhancements and AI optimization through flexible support plans after project launch. | PASS_SOURCE_SUPPORTED | 4.43 |
| 14 | What is the exact price of an AI filmmaking project? | The exact price of an AI filmmaking project is not published and depends on the property's assets, campaign needs, and final content formats. | PASS_SOURCE_SUPPORTED | 4.58 |
| 15 | Do you guarantee that your software will double my revenue? | Phone: +91 74105 82898 I cannot confirm: A published guarantee for the requested outcome. Please contact the team. | PASS_SAFE_MISSING_INFORMATION | 2.08 |
| 16 | What is your phone number? | Phone: +91 74105 82898 | PASS_SOURCE_SUPPORTED | 1.18 |
| 17 | Could you give me your business address? | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | PASS_SOURCE_SUPPORTED | 1.26 |
| 18 | What is your email address? | Email: info@webtechnosys.com | PASS_SOURCE_SUPPORTED | 0.84 |
| 19 | Do you develop mobile apps? | Yes, Webtechnosys develops mobile applications including cross-platform apps and polished iOS and Android products integrated with core business systems for customers, guests, field teams and service operations. | PASS_SOURCE_SUPPORTED | 5.17 |
| 20 | Can it also run on iPhones? | Yes, we develop mobile applications including polished iOS and Android products that can run on iPhones, designed for customers, guests, field teams, and service operations. | PASS_SOURCE_SUPPORTED | 4.59 |
| 21 | What are your exact opening hours? | Phone: +91 74105 82898 I cannot confirm: Exact opening hours. Please contact the team. | PASS_SAFE_MISSING_INFORMATION | 3.00 |

Gate latency: median 4.66s, range 0.84–7.43s, including canonical receipt time. These isolated timings exclude public HTTP/browser overhead and are not instant-response guarantees. Filmmaking and training replies remain more verbose than desired; supported facts are not rejected for length.

## Failed intermediate run retained

The first run in this recovery had an offering-completeness failure on question 1 and a 15-second upstream composition timeout on question 20. They are preserved in `RAG_FIXED_INITIAL_RUN_2026-10-03.json`. A corrected full run passed 21/21 without delivery errors. The later model-failure branch was independently exercised through two actual database receipts and local regression tests. Passing a later run does not erase the earlier upstream timeout or guarantee uninterrupted provider service.

## Coverage gaps and rollout limits

Exact opening hours and a published doubled-revenue guarantee are absent from the tested authorised content. Exact filmmaking price is scope dependent, not a fixed published figure. These are kept separate from engine failures; nothing was fabricated to fill them.

Automatic future-dated publication activation, other private PMS/order integrations, and large-scale onboarding performance remain outside the completed answering recovery. Subject inference relies on explicit entity metadata/named-case title markers and is not a universal multilingual entity classifier.

Before deployment, verify production roles, schema/function compatibility and current authoritative publication contents; capture and rehearse application/database rollback; then run the unchanged gate through candidate HTTP and Chrome before switching the serving release. The detailed migration rollback procedure is retained in `RAG_IMPLEMENTATION_REPORT_2026-10-03.md`. No production rollback is needed now.

## Evidence

- `RAG_FIXED_GATE_2026-10-03.json`: 21 exact replies, passages, stages and receipts.
- `ANSWER_ENGINE_FIXED_COMPARISON_2026-10-03.json`: 39 corrected policy outputs and passages.
- `RAG_FAILURE_RECOVERY_2026-10-03.json`: two injected upstream failures and successful isolated delivery receipts.
- `RAG_FIXED_VALIDATION_2026-10-03.json`: verification summary and retained failed cases.
