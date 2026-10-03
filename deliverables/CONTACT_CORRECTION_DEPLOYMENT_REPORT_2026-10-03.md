# Deployed contact correction — 3 October 2026

Source commit: `ede70a2`, including candidate `cab0c35`. Six changed source files were overlaid on the existing server tree. The build and all six source files matched the tested candidate after deployment; public readiness returned ok. Existing health metadata still labels the release `webtech-rag-v4`; build identity and source comparison verified the correction.

## Changes

Exact phone, email and address extraction from admitted tenant evidence, without embedding or generation when extraction is complete. Tenant, generation, digest and authority checks remain. No global fact cache. Contact replies no longer append unrelated sales qualification. Brevity is a formatting preference; unasked schedules are omitted. Missing guarantee evidence is not a negative policy. Nonnumeric conversational questions do not count as factual claims; numeric checks remain.

No new crawl, FAQ, question-specific answer, workbook activation, connector, database migration or unrelated service change.

## Verification

Candidate: 21/21 original signal checks passed, covering all 15 unchanged approved questions plus six contact/follow-up/missing-information cases. Signal checks do not establish universal correctness. Local tests: 20 contact/conversation, 8 governance/fact, 19 claim/context/presentation, 29 hotel regressions passed. Type checking and production build passed. Hotel tests used a temporary no-op for the Next server-only marker; application dependencies were unchanged.

## Initial ten Chrome questions

Seven satisfactory replies, two failures, one safe abstention. First six used the pre-existing conversation. The visible Start a new AI chat action was used after the API error. Timings include UI automation overhead; two timings were not captured. Training passed on a fresh-chat retest; its initial failure is retained.

| # | Question | Actual reply | Time | Assessment |
|---|---|---|---|---|
| 1 | Please share your complete postal address. | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | 1.55s | Pass |
| 2 | Which WhatsApp number can customers use? | Phone: +91 74105 82898 | 1.66s | Pass |
| 3 | Where should I email a business enquiry? | Email: info@webtechnosys.com | 0.29s | Pass |
| 4 | Can you build an Android app for our customers? | Webtechnosys can build custom Android mobile applications for your customers, offering polished products for guests, customers, field teams, and service operations with full source-code ownership.<br><br>What outcome or service would you like help with? | 2.38s | Pass |
| 5 | Can it also run on iPhones? | I don’t have enough verified Webtechnosys Fresh AI Bot information to answer that accurately. You can also call +91 74105 82898. Please share your name and mobile number below if you would like the business team to call you back. | 2.08s | Fail — referential iPhone follow-up lost context |
| 6 | What would your team teach our staff about AI? | Canonical factual evidence is unavailable. | Not captured | Fail — API evidence error in reused conversation; fresh-chat retest passed |
| 7 | Can you make social media videos from our hotel footage? | Yes, we can create social media videos from your hotel footage by using real property assets to build cinematic AI-assisted films, commercial videos, and focused social media content sets such as reels and campaign cuts. | Not captured | Pass |
| 8 | Can you integrate an application with our existing CRM? | Yes, Webtechnosys can integrate applications with your existing CRM by mapping your current systems and designing integrations around measurable outcomes, provided suitable APIs are available. | 3.67s | Pass |
| 9 | What support can we get after the software goes live? | After the software goes live, you can get maintenance, enhancements, and AI optimisation through flexible post-launch support plans offered by Webtechnosys. | 2.29s | Pass |
| 10 | What are your Sunday opening hours? | I could not verify the following from the published information: Exact opening hours. | 0.72s | Safe abstention — Sunday schedule not verified |

## Additional retests

| Question | Actual reply | Time |
|---|---|---|
| What would your team teach our staff about AI? | Our team would teach your staff practical AI skills focused on your business context, helping them experiment safely with AI tools for research, document handling, analytics, communication and workflow assistance, plus a live project to build usable AI outputs within your processes. The training covers defining business policy for AI use, identifying AI opportunities without losing control of business judgement, and hands-on practice with AI models and automation tools to improve productivity responsibly. | 3.57s |
| Please share your complete postal address. | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | 1.55s |

## Remaining failures and coverage gaps

- The referential question Can it also run on iPhones? failed despite admitted iOS/Android evidence.
- Training intermittently hit canonical evidence rejection in reused conversations. The subsequent visitor capability was rejected, blocking later questions in that session. A fresh-chat training retest passed. Answer/state handling remains unresolved.
- Exact Sunday/opening hours were not verified; no hours were invented.
- Existing admitted training sources disagree on Friday/Saturday schedules. Unasked schedules are omitted, but the source conflict still needs owner resolution.
- Persistent owner-approved profile publication/source precedence is outside this contact correction.

## Rollback

The previous build and sources remain at /var/backups/aifrogi-contact-ede70a2-20261003 on the existing server. Run CONTACT_CORRECTION_ROLLBACK_2026-10-03.sh there if required. It stops only lead-os-ai, preserves the replaced build, restores the saved .next and source files, restarts the process, and checks readiness. No database rollback is required. Backup availability and deployment failure recovery were checked; a post-deployment rollback drill was not performed.

## Production approved-question rerun

The original run answered the first two questions, then training returned HTTP 503 and the old visitor capability returned HTTP 401 for the remaining twelve questions. Those twelve results are blocked requests, not twelve independent knowledge failures. A recovery run in a new test session repeated the failed training question and all twelve blocked questions: 13/13 original signal checks passed. Thus all fifteen approved questions obtained passing replies across the two runs, but the initial production session failure prevents calling this a clean production gate. Both runs are preserved.

### Final candidate — 21 cases

| Question | Actual reply | HTTP | Total time | Original signal check | Source URLs |
|---|---|---|---|---|---|
| Can you tell me about AI Filmmaking? | AI Filmmaking creates cinematic films, commercials, and social-media videos by blending actual hotel footage and architecture with AI-enhanced storytelling to build emotional guest journeys and multiple content outputs. | 200 | 4.19s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| What video outputs can you create? | We create various video outputs including sets of 10 or 25 social media content pieces like arrival reels, room stories, and campaign cuts. We produce 30-second AI commercials for advertising, launches and promotions. We also create 60-second AI brand films combining property, guest journey, destination, narrative, sound and brand closing. Final outputs include a main film plus platform-specific social cuts with film edit, pacing, music, ambience, captions, and narrative. | 200 | 3.14s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| What training does Webtechnosys offer? | Webtechnosys offers an on-demand Corporate In-House AI Skill Program focused on practical AI adoption, workflow experiments, and applied team training tailored to company-specific business contexts. They also provide an AI Tool Universe Bootcamp with scheduled paid cohorts for learners to book seats and participate in AI tool training sessions. | 200 | 2.60s | Pass | https://webtechnosys.com/training/ai-build-accelerator/<br>https://webtechnosys.com/training-booking/ |
| Who is the corporate AI training for? | The corporate AI training is for companies that want practical AI adoption with their own people, including founders, managers, operations teams, sales teams, and departments aiming to use AI responsibly in daily work. | 200 | 2.15s | Pass | https://webtechnosys.com/training/ai-build-accelerator/ |
| Do you develop mobile apps? | Yes, Webtechnosys develops mobile apps, including cross-platform customer and workforce apps, polished iOS and Android mobile products, and mobile applications integrated with core business systems across Mumbai, Goa, Bengaluru, and Gurugram. | 200 | 2.69s | Pass | https://webtechnosys.com/custom-software-development-india/<br>https://webtechnosys.com/ai-software-development-mumbai/<br>https://webtechnosys.com/ai-software-development-bengaluru/ |
| Which platforms do those apps support? | Webtechnosys develops mobile apps that support iOS and Android platforms, and also creates cross-platform customer and workforce apps integrated with business systems. | 200 | 2.01s | Pass | https://webtechnosys.com/ai-software-development-mumbai/<br>https://webtechnosys.com/custom-software-development-india/ |
| Where are your offices? | Webtechnosys operates from an office located at H.No 746 - TF, New Wada, Morjim, Goa 403512, India, and also maintains an office in Gurgaon to support Gurugram/NCR businesses. | 200 | 2.17s | Pass | https://webtechnosys.com/ai-software-development-gurugram/<br>https://webtechnosys.com/terms-of-service/ |
| How can I contact Webtechnosys? | You can contact Webtechnosys by WhatsApp at +91 74105 82898 or email them at info@webtechnosys.com. | 200 | 2.62s | Pass | https://webtechnosys.com/ai-filmmaking/<br>https://webtechnosys.com/terms-of-service/ |
| How do you start a project? | Every project at Webtechnosys starts with a discovery session, followed by a detailed proposal, Statement of Work (SOW), project timeline, and commercial agreement before development begins. | 200 | 2.37s | Pass | https://webtechnosys.com/ |
| Who owns the source code after delivery? | Upon successful project completion and full payment, the agreed source code and deliverables are transferred to the client unless otherwise specified in the agreement. | 200 | 3.05s | Pass | https://webtechnosys.com/<br>https://webtechnosys.com/ai-software-development-goa/<br>https://webtechnosys.com/ai-software-development-mumbai/ |
| Do you sign NDAs? | Webtechnosys does sign Non-Disclosure Agreements (NDAs), Master Service Agreements (MSAs), Statements of Work (SOWs), and Software Development Agreements to protect both parties during projects. | 200 | 1.88s | Pass | https://webtechnosys.com/ |
| How are project payments structured? | Webtechnosys structures project payments around agreed delivery milestones to ensure transparency and reduce risk for both the client and the company. | 200 | 2.07s | Pass | https://webtechnosys.com/ai-software-development-bengaluru/<br>https://webtechnosys.com/ |
| Do you provide post-launch support? | Yes, Webtechnosys provides post-launch support including maintenance, enhancements, and AI optimization through flexible support plans after project launch. | 200 | 2.72s | Pass | https://webtechnosys.com/ai-software-development-bengaluru/<br>https://webtechnosys.com/ |
| What is the exact price of an AI filmmaking project? | The exact price of an AI filmmaking project is not published as pricing depends on the property assets, campaign needs, and final formats, and commercial pricing for films is provided upon request.<br><br>What outcome or service would you like help with? | 200 | 1.96s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| Do you guarantee that your software will double my revenue? | I could not verify the following from the published information: A published guarantee for the requested outcome. | 200 | 0.54s | Pass |  |
| Could you give me your business address? | Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India | 200 | 0.24s | Pass | https://webtechnosys.com/terms-of-service/ |
| Which phone number can I use to contact you? | Phone: +91 74105 82898 | 200 | 0.28s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| What is your email address? | Email: info@webtechnosys.com | 200 | 0.20s | Pass | https://webtechnosys.com/disclaimer/ |
| Do you develop mobile apps? | Webtechnosys develops mobile applications as part of their custom software and AI software development services, building polished cross-platform iOS and Android apps integrated with core business systems for clients in Mumbai, Bengaluru, Gurugram, and wider India. | 200 | 2.48s | Pass | https://webtechnosys.com/custom-software-development-india/<br>https://webtechnosys.com/ai-software-development-mumbai/<br>https://webtechnosys.com/ai-software-development-bengaluru/ |
| Which platforms do those apps support? | WebTechnosys develops polished mobile applications that support both iOS and Android platforms for customers, guests, field teams, and service operations.<br><br>Are you the decision-maker, or are other team members involved? | 200 | 2.24s | Pass | https://webtechnosys.com/ai-software-development-mumbai/ |
| What are your exact opening hours? | I could not verify the following from the published information: Exact opening hours. | 200 | 0.46s | Pass |  |


### Production initial — 15 cases

| Question | Actual reply | HTTP | Total time | Original signal check | Source URLs |
|---|---|---|---|---|---|
| Can you tell me about AI Filmmaking? | AI filmmaking in Goa creates cinematic films, commercials, and social videos for hotels and tourism brands by starting with real property footage and enhancing storytelling with AI to build emotional guest journeys. The workflow involves brand discovery, shot planning, storyboard creation, AI-assisted cinematic production, and editing to produce multiple content outputs such as social media content banks and commercial films. | 200 | 4.02s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| What video outputs can you create? | We create cinematic AI films, commercials, and social-media videos for hospitality and local businesses. Output formats include sets of social media content with 10 or 25 clips, 30-second AI commercials, and 60-second AI brand films. The final commercial includes the main film plus platform-specific social cuts with edits, sound, music, ambience, captions, and narrative. | 200 | 3.78s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| What training does Webtechnosys offer? | (No answer returned) | 503 | 2.46s | Failed/blocked |  |
| Who is the corporate AI training for? | (No answer returned) | 401 | 0.03s | Failed/blocked |  |
| Do you develop mobile apps? | (No answer returned) | 401 | 0.02s | Failed/blocked |  |
| Which platforms do those apps support? | (No answer returned) | 401 | 0.03s | Failed/blocked |  |
| Where are your offices? | (No answer returned) | 401 | 0.02s | Failed/blocked |  |
| How can I contact Webtechnosys? | (No answer returned) | 401 | 0.02s | Failed/blocked |  |
| How do you start a project? | (No answer returned) | 401 | 0.06s | Failed/blocked |  |
| Who owns the source code after delivery? | (No answer returned) | 401 | 0.07s | Failed/blocked |  |
| Do you sign NDAs? | (No answer returned) | 401 | 0.03s | Failed/blocked |  |
| How are project payments structured? | (No answer returned) | 401 | 0.03s | Failed/blocked |  |
| Do you provide post-launch support? | (No answer returned) | 401 | 0.03s | Failed/blocked |  |
| What is the exact price of an AI filmmaking project? | (No answer returned) | 401 | 0.04s | Failed/blocked |  |
| Do you guarantee that your software will double my revenue? | (No answer returned) | 401 | 0.03s | Failed/blocked |  |


### Production recovery — 13 cases

| Question | Actual reply | HTTP | Total time | Original signal check | Source URLs |
|---|---|---|---|---|---|
| What training does Webtechnosys offer? | Webtechnosys offers an on-demand Corporate In-House AI Skill Program that focuses on practical AI adoption, workflow experiments, and applied team training tailored to a company's specific business context and team workflows. They also provide the AI Tool Universe Bootcamp as a paid seat program with scheduled Saturday cohorts. | 200 | 3.48s | Pass | https://webtechnosys.com/training/ai-build-accelerator/<br>https://webtechnosys.com/training-booking/ |
| Who is the corporate AI training for? | The corporate AI training is for companies that want practical AI adoption by their own people, including founders, managers, operations teams, sales teams, and departments aiming to use AI responsibly in daily work. | 200 | 2.00s | Pass | https://webtechnosys.com/training/ai-build-accelerator/ |
| Do you develop mobile apps? | Yes, we develop mobile apps as part of our custom software development services, including polished iOS and Android products integrated with core business systems across Mumbai, Bengaluru, Gurugram, and other locations in India. | 200 | 2.81s | Pass | https://webtechnosys.com/custom-software-development-india/<br>https://webtechnosys.com/ai-software-development-mumbai/<br>https://webtechnosys.com/ai-software-development-bengaluru/ |
| Which platforms do those apps support? | Webtechnosys develops polished mobile applications supporting iOS and Android platforms, along with web products and cross-platform apps integrated with core business systems. | 200 | 3.20s | Pass | https://webtechnosys.com/ai-software-development-mumbai/<br>https://webtechnosys.com/ai-software-development-gurugram/<br>https://webtechnosys.com/custom-software-development-india/ |
| Where are your offices? | Webtechnosys operates with a physical office in Gurgaon serving Gurugram/NCR businesses and has its base in Goa, India, at H.No 746 - TF, New Wada, Morjim, Goa 403512, without a physical office in Mumbai. | 200 | 2.31s | Pass | https://webtechnosys.com/ai-software-development-gurugram/<br>https://webtechnosys.com/terms-of-service/ |
| How can I contact Webtechnosys? | You can contact Webtechnosys via WhatsApp at +91 74105 82898 or by email at info@webtechnosys.com. | 200 | 2.59s | Pass | https://webtechnosys.com/ai-filmmaking/<br>https://webtechnosys.com/terms-of-service/ |
| How do you start a project? | Projects start with a discovery session followed by a detailed proposal, Statement of Work (SOW), project timeline, and commercial agreement before development begins. | 200 | 1.81s | Pass | https://webtechnosys.com/ |
| Who owns the source code after delivery? | After successful completion of the project and full payment, the agreed source code and deliverables are transferred to the client unless otherwise specified in the agreement. | 200 | 2.21s | Pass | https://webtechnosys.com/<br>https://webtechnosys.com/ai-software-development-goa/<br>https://webtechnosys.com/ai-software-development-mumbai/ |
| Do you sign NDAs? | Webtechnosys signs Non-Disclosure Agreements (NDA) along with other agreements like Master Service Agreements and Software Development Agreements to protect both parties during projects. | 200 | 2.09s | Pass | https://webtechnosys.com/ |
| How are project payments structured? | Project payments at Webtechnosys are typically structured around agreed delivery milestones, ensuring transparency and reducing risk for both the client and the company. | 200 | 2.11s | Pass | https://webtechnosys.com/ai-software-development-bengaluru/<br>https://webtechnosys.com/ |
| Do you provide post-launch support? | Yes, Webtechnosys provides post-launch support including maintenance, enhancements, and AI optimization through flexible support plans after project launch. | 200 | 1.88s | Pass | https://webtechnosys.com/ai-software-development-bengaluru/<br>https://webtechnosys.com/ |
| What is the exact price of an AI filmmaking project? | The exact price of an AI filmmaking project is not published and depends on the property's assets, campaign needs, and final formats, with commercial pricing available on request.<br><br>What outcome or service would you like help with? | 200 | 1.81s | Pass | https://webtechnosys.com/ai-filmmaking/ |
| Do you guarantee that your software will double my revenue? | I could not verify the following from the published information: A published guarantee for the requested outcome. | 200 | 0.95s | Pass |  |

