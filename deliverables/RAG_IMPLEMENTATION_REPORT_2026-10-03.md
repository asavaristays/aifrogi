# RAG candidate implementation and test report — 3 October 2026

Release decision: **FAIL — do not deploy**. The remaining integration work is saved in this candidate, but the full answering objective is not yet achieved. Production application, production database and crawler were not changed.

## Implemented changes

One shared production answering engine combines approved document claims and existing authorised crawl evidence. It supports a document-only bot, conversation subject resolution, lexical plus semantic retrieval, tenant and version scoped request-local caching, optional reranker fallback, exact contact extraction without model calls, one generation and one batch factual review. Length is a formatting preference. Failed optional retrieval does not discard successful eligible evidence; permission failures fail closed.

Owner upload/staging, row approval and preview approval now feed canonical publication and derived indexing. Repeated upload/index/publication is idempotent. Corrections publish a new immutable version, reconfirmation creates a reviewed successor, withdrawal appends an audit event, and open answer flags suppress the affected claim. Answer receipts recheck current tenant/publication/source permissions and bind exact answer bytes and citations. A recovered grounded answer is no longer replaced solely because a failed optional stage retained a technical failure label.

Typed live public-catalogue reads validate connector permission, credentials, timestamp, host and schema. Private PMS/order reads and payment transactions are not implemented by this public adapter. Workbook commercial information approval does not authorise transactions.

No new crawl, FAQs or question-specific answer patches were introduced. Existing authorised 21 pages / 62 crawl chunks and 62 approved public workbook rows were copied into an isolated test database. Approvals and tenant identities in that database are synthetic fixtures; this does not certify production metadata or permissions.

## Validation

| Check | Result |
| --- | --- |
| TypeScript type check | Passed |
| Production build (`npm run build -- --webpack`) | Passed |
| Database permission, publication, immutable-version, receipt and indexing checks | 12/12 passed |
| Owner upload → review → publish → update/reconfirm → withdraw workflow | 7/7 passed |
| Real OpenAI semantic paraphrase retrieval and idempotent repeat indexing | Passed; repeat indexed 0 rows because previous run had indexed the content |
| Broad shared/channel/sovereign regression suite | 798/808 passed; 10 failures remain |
| Original approved 15 questions: original keyword criteria | 15/15 passed |
| Original approved 15 questions: source correctness review | 14/15 passed; question 6 failed |
| Additional phone/address/email/app/follow-up/missing-hours checks | 6/6 supported |
| Online Chrome verification on this release | Not run; candidate not deployed |

The HTTP fixture fixes repair missing database-scope mocks and imports. They do not change the approved 15 questions or their acceptance signals. Local owner tests use synthetic application-role grants, not verified production grants. Failure/isolation checks are local automated cases, not injected production outages. The real-model test exercises retrieval through canonical delivery receipt directly; it excludes browser rendering, HTTP orchestration and public network latency. Conversation resolution is recorded but is not separately timed in this harness.

## Actual question results

Each JSON case includes complete retrieved and cited passages, immutable source versions, the actual reply, original acceptance signals, assessment, per-stage and total latency, and receipt outcome. Keyword matching is not treated as proof of correctness.

| # | Question | Actual reply | Source assessment | Total seconds |
| --- | --- | --- | --- | --- |
| 1 | Can you tell me about AI Filmmaking? | AI filmmaking creates cinematic films, commercials, and social-media videos by starting with real property footage and photography, enhancing storytelling and mood using AI without replacing the actual hotel. It designs an emotional guest journey through sequences like arrival, stay, cuisine, experience, sundowner, and brand close, combining real footage with cinematic AI production, editing, sound, and narrative. The workflow includes brand discovery, shot planning, storyboarding, and can produce multiple content outputs such as social media content banks, short commercials, and full brand films tailored to hospitality and tourism. This approach integrates hospitality understanding, visual storytelling, technology, and AI production to build stories informed by hotel architecture, guest psychology, and location assets. | PASS | 9.78 |
| 2 | What video outputs can you create? | You can create a set of 10 social media content videos focusing on arrival, room, cuisine, pool/beach, and sundowner scenes. A set of 25 social media content videos are also available covering brand story, destination, experience reel, campaign cut, and more. A 30 second AI commercial film is offered for paid advertising and promotional use. A 60 second AI brand film provides a complete cinematic hospitality story combining property, guest journey, experience, destination, narrative, sound and brand close. | PASS | 7.23 |
| 3 | What training does Webtechnosys offer? | Webtechnosys offers an on-demand Corporate In-House AI Skill Program that helps companies adopt practical AI workflows and team training tailored to their business context. They provide a Practical AI Tool Universe Bootcamp featuring AI tool selection, prompt templates, automation workflow templates, and a 30-day implementation roadmap. The AI Tool Universe Bootcamp requires bringing a charged laptop and accounts for tools like Cursor, Gemini, Claude, ChatGPT, Kling, and Higgsfield, with a focus on working with a real but non-confidential business problem. | PASS | 5.91 |
| 4 | Who is the corporate AI training for? | The corporate AI training is designed for companies seeking practical AI adoption with their own teams, including founders, managers, operations teams, sales teams, and other departments wanting applied AI skills and responsible daily AI use. It is also useful for operators aiming to practice AI-assisted workflows to reduce repetitive tasks and enhance execution. | PASS | 6.56 |
| 5 | Do you develop mobile apps? | Yes, Webtechnosys develops mobile applications including polished iOS and Android products integrated with core business systems, tailored for customers, guests, field teams, and service operations across locations like Mumbai, Bengaluru, Gurugram, and Goa in India. | PASS | 5.15 |
| 6 | Which platforms do those apps support? | Yes, Webtechnosys develops mobile applications that support Android and iOS platforms, using technologies such as Flutter for cross-platform development. | FAIL | 5.53 |
| 7 | Where are your offices? | Webtechnosys AI Agency operates from H.No 746 - TF, New Wada, Morjim, Goa 403512, India and also has an office in Gurgaon supporting Gurugram/NCR businesses. | PASS | 5.57 |
| 8 | How can I contact Webtechnosys? | Phone: +91 74105 82898 Email: info@webtechnosys.com | PASS | 1.07 |
| 9 | How do you start a project? | Every project starts with a discovery session, followed by a detailed proposal, Statement of Work, project timeline, and commercial agreement before development begins. | PASS | 5.13 |
| 10 | Who owns the source code after delivery? | After successful project completion and full payment, the agreed source code and deliverables are transferred to the client, with ownership and rights specified in the project agreement. | PASS | 5.42 |
| 11 | Do you sign NDAs? | Yes, Webtechnosys signs Non-Disclosure Agreements (NDAs) along with Master Service Agreements, Statements of Work, and Software Development Agreements to protect both parties. | PASS | 4.61 |
| 12 | How are project payments structured? | Project payments are typically structured on a milestone basis to ensure transparency and reduce risk for both the client and Webtechnosys. | PASS | 5.05 |
| 13 | Do you provide post-launch support? | Yes, Webtechnosys provides post-launch support including maintenance, enhancements, and AI optimization through flexible support plans after project launch. | PASS | 5.03 |
| 14 | What is the exact price of an AI filmmaking project? | The supplied authorised business evidence does not provide an exact price for an AI filmmaking project, as pricing depends on property assets, campaign needs, and final formats and must be requested commercially. | PASS | 4.96 |
| 15 | Do you guarantee that your software will double my revenue? | Phone: +91 74105 82898 I cannot confirm: A published guarantee for the requested outcome. Please contact the team. | PASS | 2.03 |
| 16 | What is your phone number? | Phone: +91 74105 82898 | PASS | 1.23 |
| 17 | Could you give me your business address? | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | PASS | 1.25 |
| 18 | What is your email address? | Email: info@webtechnosys.com | PASS | 1.04 |
| 19 | Do you develop mobile apps? | Webtechnosys develops cross-platform mobile applications integrated with core business systems for businesses across Mumbai, Goa, Bengaluru and Gurugram, including polished iOS and Android apps for guests, customers, and field teams. | PASS | 5.63 |
| 20 | Can it also run on iPhones? | Webtechnosys develops custom mobile applications that include polished iOS products compatible with iPhones, as well as Android apps, for business operations across multiple Indian cities. | PASS | 5.23 |
| 21 | What are your exact opening hours? | Phone: +91 74105 82898 I cannot confirm: Exact opening hours. Please contact the team. | PASS | 3.60 |

Measured total latency: median 5.13s; minimum 1.04s; maximum 9.78s. These are isolated-test measurements, not production latency guarantees.

## Remaining failures and limits

1. Question 6 generalises Flutter from a farmer-product architecture to the broader mobile-app offering. The generator and batch verifier accepted that unsupported relationship. Entity binding must be corrected and the original gate repeated before release. Another crawl cannot correct this reasoning failure.
2. Question 14 is factually safe but says “supplied authorised business evidence” and gives no usable contact. Visitor presentation and approved contact recovery need completion.
3. Ten broad regression checks still fail:
- B1-01 published answer is exact and an unsupported affirmative does not invent a next action
- B1-14 paused link cannot be reused after the prior answer
- B3-BUSINESS_AI-02 paraphrase
- B3-PINGBOOK-02 paraphrase
- B3-STAY-02 paraphrase
- B3-RESTAURANT-02 paraphrase
- B3-EDUCATION-02 paraphrase
- B3-REAL_ESTATE-02 paraphrase
- B3-FLOWCART-02 paraphrase
- B3-CUSTOM-02 paraphrase

The failing HTTP fixtures exercise the retained offline legacy branch because their synthetic property omits the organisation identifier used to select the unified production engine. They still need faithful migration or repair; they must not be skipped or relabelled as passes. Two failures concern unsupported affirmative follow-ups; eight concern paraphrases across categories.

Future-dated approved rows are excluded until effective and republished; automatic scheduled activation has not been implemented. Production-role preflight, full HTTP candidate testing and online Chrome validation remain pending. The four-minute onboarding aspiration and scale to 1,000 bots are not certified.

## Coverage gaps — kept separate

- Exact opening hours are not present in the tested authorised content. Reply supplies the approved phone and identifies the missing detail.
- No published promise of doubled revenue was found. The reply does not invent a guarantee or a blanket no-guarantee policy.
- AI filmmaking has scope-dependent commercial pricing, not a fixed published project price. This is a pricing boundary, not an ingestion failure.

## Release and rollback procedure

This migration changes SQL functions and publication behaviour. It must not be treated as an automatically reversible additive migration.

Before any deployment: resolve the above gate failures; verify actual production role grants and migration compatibility; capture an encrypted database backup plus a schema/function-definition snapshot; record the exact current application commit, build, environment and PM2 configuration; rehearse restore in isolation. Copy/build candidate source in a separate release directory, apply reviewed migration only within an agreed release window, verify the unchanged approved tests through HTTP and Chrome, then activate the candidate. This report does not authorise bypassing the gate.

If activation fails: pause bot serving while preserving incoming messages; restore the verified prior application build and configuration; restore replaced SQL functions/grants from the captured pre-migration definitions. If publication writes or schema state cannot be reconciled safely, use the rehearsed database recovery procedure with an explicit plan for writes since the backup. Do not drop tables or restore a stale full database blindly. Restart the existing service only after the matching application/database state is restored, check readiness, tenant isolation, approved contact answers and the original question gate, then resume serving. Preserve failed candidate evidence for diagnosis.

No production rollback is needed now because this candidate has not been deployed.

## Evidence files

- `RAG_CANDIDATE_FINAL_2026-10-03.json`: actual 21 replies, source passages, receipts and stage timings.
- `RAG_DATABASE_TESTS_2026-10-03.json`: 12 database controls.
- `RAG_OWNER_WORKFLOW_TESTS_2026-10-03.json`: seven owner lifecycle cases.
- `RAG_INDEX_TESTS_2026-10-03.json`: real semantic retrieval and repeat-indexing result.
- `RAG_REGRESSION_COMPARISON_2026-10-03.json`: baseline comparison and remaining failures.
