# Fresh production question checks — 3 October 2026

**Candidate not deployed.** These results are from the existing production release, not candidate `aa6ce68`. The candidate release gate remains failed (unsupported cross-entity Flutter assertion and ten broad regression failures). No production source files, schema, serving pointer, model configuration or crawl were changed. Test conversations were created by the authorised checks.

Ten fresh questions were submitted to the public HTTPS endpoint; the first four were also checked in Chrome. Question 6 follows question 5 in the same token-authenticated session. Other endpoint cases use separate sessions. Times are measured HTTP round trips and exclude browser rendering. No production stage timing or retrieved passage trace was collected; source assessments compare replies to the previously captured authorised content, not to an unavailable production retrieval trace.

| # | Question | Actual reply | Result | Seconds |
| --- | --- | --- | --- | --- |
| 1 | Where can I visit your Goa office? | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | PASS | 1.90 |
| 2 | What phone number can I use to discuss a project? | Phone: +91 74105 82898 | PASS | 0.47 |
| 3 | Can you help train our internal operations team in AI? | Yes, Webtechnosys offers an on-demand Corporate In-House AI Skill Program designed to train internal operations teams in practical AI adoption, workflow experiments, and applied team training focused on your company's real business context and processes. The program helps the team use AI for research, documents, analytics, follow-up, content, and workflow assistance with business policy on AI usage and data sharing. It improves reporting, productivity, follow-up quality, and resource optimization by practicing AI-assisted workflows that reduce repetitive work and improve execution rhythm. | PASS | 3.66 |
| 4 | What kind of film can you make for a resort? | You can make cinematic AI films for resorts that tell an emotional guest journey, including arrival, stay, cuisine, experience, sundowner, and brand close, using real property footage enhanced with AI for commercial films, social media videos, campaign cuts, and website visuals. | PASS | 6.43 |
| 5 | Can you build an app for my customers? | Webtechnosys can build custom apps for your customers, delivering dashboards and multi-agent systems on a compressed timeline, deploying them on cloud infrastructure under your control, and training your team to manage and improve these solutions independently.  What outcome or service would you like help with? | PARTIAL | 3.56 |
| 6 | Would that work on both an iPhone and an Android phone? | Phone: +91 74105 82898 | FAIL | 0.56 |
| 7 | Will my company receive the source code once the project is paid for? | Upon successful project completion and full payment, the agreed source code and deliverables are transferred to the client as specified in the project agreement. | PASS | 2.66 |
| 8 | Could you sign an NDA before we discuss our idea? | Yes, Webtechnosys can sign Non-Disclosure Agreements (NDA) to protect both parties before starting project discussions. | PASS | 1.87 |
| 9 | Where should I email a project brief? | Email: info@webtechnosys.com | PASS | 0.40 |
| 10 | Are you open this Sunday, and what time? | I don’t have enough verified Webtechnosys Fresh AI Bot information to answer that accurately. You can also call +91 74105 82898. Please share your name and mobile number below if you would like the business team to call you back. | COVERAGE_GAP | 2.89 |

Seven passed; one partial; one failed; one coverage gap. The device compatibility follow-up is a routing failure, not a crawl gap. Exact Sunday hours remain a coverage gap and were not invented.

A candidate-only correction now distinguishes device references from requests for business contact numbers. It retains explicit contact requests even when the visitor mentions an Android/iPhone project. This correction has not been deployed and does not resolve the candidate's separate cross-entity generation/verifier failure or its ten remaining regressions. Deployment, post-deployment testing and rollback verification remain outstanding.

Complete raw replies and public response metadata: `LIVE_RANDOM_10_PREDEPLOY_2026-10-03.json`. Visitor authentication tokens are removed from the saved results.
