# Existing policy + RAG quality comparison — 3 October 2026

**Completed the isolated combination trial. Combining policies did not improve reliability on this sample. Production is unchanged.**

## Scope and method

Three composition modes use the same existing authorised Webtechnosys source snapshot, lexical/semantic retrieval, contact routing correction and batch support reviewer. Existing-policy reuses the actual legacy `BOT_ANSWER_CONSTITUTION` through the structured RAG adapter. It is a controlled comparison of the existing composition policy, **not** a replay of the complete old production pipeline. RAG uses its current composition policy; combined adds the existing policy, removes unsolicited closing offers before verification, and reuses existing deterministic number/action/entitlement claim checks on the model-cited evidence.

The combined trial makes one generation and one batch verification call, without answer voting, second generation, retrieval fallback to old facts, or automatic production activation. Exact public contacts still bypass generation. A new trial-only optional composition parameter defaults to unchanged RAG behavior for production callers.

Ten recent questions plus three known-failure probes were run with real OpenAI on the isolated approved-content database. The three modes for each question run concurrently; measured totals include shared database load and model network time. Per-stage timings, exact retrieved and cited passages, exact replies and token usage are saved in the JSON. This test does not measure browser/HTTP rendering or delivery-receipt latency. One run of 13 cases per mode cannot establish statistical superiority or production readiness.

## Results

| Mode | Supported | Failed | Coverage gaps | Median seconds | Mean reply words |
| --- | ---: | ---: | ---: | ---: | ---: |
| existing-policy | 11 | 0 | 2 | 4.88 | 32.4 |
| rag | 10 | 1 | 2 | 4.78 | 25.2 |
| combined | 9 | 2 | 2 | 4.67 | 25.7 |

Coverage gaps are Sunday opening hours and a published doubled-revenue guarantee. They are not counted as answered business facts. For Sunday hours, all modes abstain but use internal evidence language and an unrelated bootcamp citation; presentation and absence-claim handling still need correction.

## Case comparison

| # | Question | Existing policy | RAG | Combined |
| --- | --- | --- | --- | --- |
| 1 | Where can I visit your Goa office? | PASS (1.87s) | PASS (2.08s) | PASS (2.25s) |
| 2 | What phone number can I use to discuss a project? | PASS (1.31s) | PASS (1.34s) | PASS (1.35s) |
| 3 | Can you help train our internal operations team in AI? | PASS (6.67s) | PASS (6.54s) | PASS (6.55s) |
| 4 | What kind of film can you make for a resort? | PASS (7.22s) | PASS (7.89s) | PASS (7.28s) |
| 5 | Can you build an app for my customers? | PASS (6.77s) | PASS (4.43s) | PASS (4.64s) |
| 6 | Would that work on both an iPhone and an Android phone? | PASS (4.84s) | PASS (4.95s) | PASS (5.32s) |
| 7 | Will my company receive the source code once the project is paid for? | PASS (5.02s) | PASS (4.41s) | PASS (4.68s) |
| 8 | Could you sign an NDA before we discuss our idea? | PASS (4.88s) | PASS (5.07s) | PASS (4.76s) |
| 9 | Where should I email a project brief? | PASS (1.28s) | PASS (1.31s) | PASS (1.32s) |
| 10 | Are you open this Sunday, and what time? | COVERAGE_GAP (4.50s) | COVERAGE_GAP (4.78s) | COVERAGE_GAP (4.67s) |
| 11 | Which platforms do those apps support? | PASS (7.08s) | FAIL (5.61s) | FAIL (5.34s) |
| 12 | What is the exact price of an AI filmmaking project? | PASS (5.14s) | PASS (4.93s) | FAIL (2.88s) |
| 13 | Do you guarantee that your software will double my revenue? | COVERAGE_GAP (2.45s) | COVERAGE_GAP (2.45s) | COVERAGE_GAP (2.54s) |

## What the combination revealed

- Device follow-up: all modes now answer iPhone/Android correctly. This improvement is caused by the shared contact/device routing correction, not by mixing prompts.
- General platform probe: existing policy explicitly separates the farmer product from the general app offering. RAG generalises Flutter from that product. Combined also transfers Kannada/English, voice and offline features to the general offering. Automated support review accepted these wrong relationships; independent source review marks them failed.
- Pricing probe: RAG gives the published scope-dependent pricing limitation. Combined produces an inconsistent disposition/missing-parts schema (`INCOMPLETE_ANSWER_LABEL`) and returns a technical failure. Existing policy safely states that an exact price is unspecified but provides less useful detail.
- Customer-app reply: existing policy is verbose; combined is shorter. That local presentation gain does not compensate for its factual and schema failures elsewhere. On average the combined replies remain longer than RAG replies in this run.

## Actual replies

| # | Mode | Exact reply | Source assessment |
| --- | --- | --- | --- |
| 1 | existing-policy | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | PASS |
| 1 | rag | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | PASS |
| 1 | combined | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | PASS |
| 2 | existing-policy | Phone: +91 74105 82898 | PASS |
| 2 | rag | Phone: +91 74105 82898 | PASS |
| 2 | combined | Phone: +91 74105 82898 | PASS |
| 3 | existing-policy | Yes, we can help train your internal operations team in AI through our Corporate In-House AI Skill Program by Webtechnosys. This on-demand program focuses on practical AI adoption, workflow experiments, and applied team training tailored to your company's business context and real work scenarios. Additionally, our Practical AI Tool Universe Bootcamp offers hands-on experience with AI tools, automation, and deployment, building confidence in using AI effectively in business. | PASS |
| 3 | rag | Webtechnosys offers an on-demand Corporate In-House AI Skill Program that trains teams in practical AI adoption, workflow experiments, and building useful outputs connected to the company's own processes. Additionally, the Practical AI Tool Universe Bootcamp helps teams gain working confidence in AI by researching, automating workflows, building small applications, and deploying them live with guided use of various AI tools. | PASS |
| 3 | combined | Yes, Webtechnosys offers an on-demand Corporate In-House AI Skill Program that trains your internal team in practical AI adoption, tailored to your business workflows and real work scenarios. Additionally, there's a Practical AI Tool Universe Bootcamp that guides teams through research, automation, building AI-assisted applications, and deployment to boost working confidence with AI tools. | PASS |
| 4 | existing-policy | You can make cinematic AI films and commercials for resorts that tell an emotional guest journey starting from real footage of the property, including architecture, rooms, pool, food, people, and surroundings. These films typically showcase sequences such as arrival, stay, cuisine, experience, sundowner moment, and brand close, creating a continuous story to engage guests. Available formats include short social media content sets for regular posting, 30-second commercials for campaigns, or full 60-second brand films combining narrative, sound, and cinematic visuals. | PASS |
| 4 | rag | For a resort, you can create cinematic AI films that showcase real property elements such as architecture, rooms, pool, food, people, surroundings, and the destination, forming an emotional guest journey including arrival, stay, cuisine, experiences, sundowners, and brand closure. Film types range from short social media content sets to 30-second commercials and 60-second full brand films incorporating narrative, sound, and brand identity. | PASS |
| 4 | combined | For a resort, you can create cinematic AI films and commercials that showcase real footage of the property including architecture, rooms, pool, cuisine, guest experiences, and surroundings, structured as a guest journey from arrival to departure. These films include elements like arrival, stay, cuisine, experiences such as pool or spa, sundowner moments, and a brand close, designed with real hospitality storytelling enhanced by AI. The content can range from short social media reels to 30- or 60-second AI-assisted commercials and brand films, tailored to campaign needs and using actual property assets. | PASS |
| 5 | existing-policy | Yes, we can build custom apps for your customers, including mobile and web applications tailored to your business needs across regions like Bengaluru, Mumbai, Gurugram, and Goa. We focus on software tied to an operating outcome, delivering milestone-driven builds with source-code ownership for you, ensuring your team can operate and extend the platform independently. Our approach includes mapping your operations, building quickly, deploying on your cloud infrastructure, training your team, and providing ongoing support to ensure your app remains effective and owned by you. | PASS |
| 5 | rag | Yes, Webtechnosys can build custom mobile applications for your customers, including polished iOS and Android apps tailored to your business needs with full source-code ownership and focused milestone delivery. | PASS |
| 5 | combined | Yes, we build custom mobile apps for customers tailored to your business, with full source code ownership and focused milestones. | PASS |
| 6 | existing-policy | Yes, we can build custom mobile apps for your customers that are designed to work on both iOS and Android phones. | PASS |
| 6 | rag | Webtechnosys can build custom mobile apps for your customers that work on both iOS (Apple phones) and Android phones, delivering polished cross-platform mobile products integrated with your business systems. | PASS |
| 6 | combined | Yes, we build custom mobile applications for customers that run on both iOS and Android platforms, supporting polished apps for customers, guests, and field teams across India including Mumbai, Gurugram, Bengaluru, and Goa. | PASS |
| 7 | existing-policy | Yes, once the project is successfully completed and full payment is made, your company will receive the agreed source code and deliverables, transferring ownership according to the project agreement. | PASS |
| 7 | rag | After successful completion and full payment, your company will receive ownership and access to the agreed source code and deliverables as defined in the project agreement. | PASS |
| 7 | combined | Yes, your company will receive the agreed source code and deliverables after successful completion of the project and full payment, with ownership and handover defined in the project agreement. | PASS |
| 8 | existing-policy | Yes, Webtechnosys can sign Non-Disclosure Agreements (NDAs) before you discuss your idea, ensuring confidentiality for both parties. | PASS |
| 8 | rag | Yes, Webtechnosys can sign Non-Disclosure Agreements (NDAs) before project discussions to protect both parties. | PASS |
| 8 | combined | Yes, Webtechnosys can sign Non-Disclosure Agreements (NDAs) before discussing your idea to protect both parties during collaboration. | PASS |
| 9 | existing-policy | Email: info@webtechnosys.com | PASS |
| 9 | rag | Email: info@webtechnosys.com | PASS |
| 9 | combined | Email: info@webtechnosys.com | PASS |
| 10 | existing-policy | The provided approved knowledge base does not include information about opening days or times for Sunday. | COVERAGE_GAP |
| 10 | rag | There is no specific information about Webtechnosys's opening hours on Sundays in the provided evidence. | COVERAGE_GAP |
| 10 | combined | The supplied information does not specify Sunday opening hours or confirm if the business is open on Sundays. | COVERAGE_GAP |
| 11 | existing-policy | Yes, Webtechnosys develops mobile apps. They build polished mobile applications for both iOS and Android platforms to serve guests, customers, field teams, and service operations. Specifically for the BEAN Coffee Farm Intelligence Platform, the farmer app is built with Android and Flutter UI, supporting Kannada and English languages with voice and offline modes. | PASS |
| 11 | rag | Yes, WebTechnosys develops mobile applications supporting Android and iOS platforms, using technologies like Flutter for cross-platform UI development. | FAIL |
| 11 | combined | Yes, mobile apps are developed using Android and Flutter platforms, supporting Kannada and English with voice and offline modes. The published mobile offering includes iOS and Android products. | FAIL |
| 12 | existing-policy | The supplied information about AI filmmaking projects from Webtechnosys does not specify the exact price for such projects. | PASS |
| 12 | rag | The exact price of an AI filmmaking project is not published as it depends on the property assets, campaign needs, and final formats, with commercial pricing available upon request for specific films like 30-second commercials or 60-second brand films. | PASS |
| 12 | combined | I’m having trouble preparing your answer. Please try again. | FAIL |
| 13 | existing-policy | Phone: +91 74105 82898 I cannot confirm: A published guarantee for the requested outcome. Please contact the team. | COVERAGE_GAP |
| 13 | rag | Phone: +91 74105 82898 I cannot confirm: A published guarantee for the requested outcome. Please contact the team. | COVERAGE_GAP |
| 13 | combined | Phone: +91 74105 82898 I cannot confirm: A published guarantee for the requested outcome. Please contact the team. | COVERAGE_GAP |

## Validation and next decision

43 shared-answer tests passed, including combined policy reuse, exactly one composition/verification pair, and rejection of unsupported numeric claims despite a permissive model review. Type checking and webpack production build passed. The broad suite is 802/812 with the same ten remaining legacy HTTP failures; no new failure remains after moving the URL policy assertion to the shared policy constant without changing its required rule.

Recommendation: retain one answering pipeline. Use RAG for permitted, current evidence and selectively reuse the existing visitor-facing policy and deterministic guards. Do not activate the naive merged policy from this experiment. The next correction must bind a claim to the relevant product/entity, preserve a consistent partial-answer schema, and provide approved contact recovery without technical wording. More crawling or answer voting does not resolve these failures.

The unchanged full 15-question release gate, broader regressions and production-role/HTTP preflight remain required before deployment. This 13-case comparison is diagnostic and does not replace that gate. No production rollback is needed because no production source, schema or serving pointer was changed.

Raw evidence: `ANSWER_ENGINE_COMPARISON_2026-10-03.json`.
