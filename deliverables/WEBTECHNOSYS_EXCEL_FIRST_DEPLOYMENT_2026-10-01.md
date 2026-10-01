# Webtechnosys Excel-first production result — 2026-10-01

Production gate: **15/15 passed**, 0 failed. Median end-to-end latency: **3103 ms**.

| # | Question | Result | Latency | Actual reply |
|---:|---|---|---:|---|
| 1 | Can you tell me about AI Filmmaking? | PASS | 3582 ms | AI Filmmaking by Webtechnosys creates cinematic films, commercials, and social-media videos for hotels and tourism brands by starting with real property assets like architecture, rooms, and guest experiences, then enhancing the story with AI to build an emotional guest journey. |
| 2 | What video outputs can you create? | PASS | 2923 ms | You can create cinematic AI films, commercials, and social-media videos including commercial films, reels, campaign cuts, website visuals, and social content. |
| 3 | What training does Webtechnosys offer? | PASS | 3656 ms | Webtechnosys offers a Corporate In-House AI Skill Program providing practical AI adoption, workflow experiments, and applied team training within companies' own workflows and business problems. They also provide an AI Tool Universe Bootcamp with paid Saturday cohorts where attendees can learn various AI tools and techniques. |
| 4 | Who is the corporate AI training for? | PASS | 3222 ms | The Corporate In-House AI Skill Program is for companies and their internal teams, including founders, managers, operations teams, sales teams, and departments who want practical AI adoption and applied AI capability in daily work. |
| 5 | Do you develop mobile apps? | PASS | 3055 ms | Yes, Webtechnosys develops custom mobile applications across multiple Indian cities including Mumbai, Gurugram, Bengaluru, and Goa, building polished iOS and Android products that are client-owned and integrated with business operations. |
| 6 | Which platforms do those apps support? | PASS | 2575 ms | The apps and software developed by Webtechnosys support iOS and Android mobile platforms as well as web platforms. |
| 7 | Where are your offices? | PASS | 3090 ms | Webtechnosys operates from an office in Gurgaon (Gurugram), India, and also has a registered address at H.No 746 - TF, New Wada, Morjim, Goa 403512, India. |
| 8 | How can I contact Webtechnosys? | PASS | 3103 ms | You can contact Webtechnosys by emailing info@webtechnosys.com or addressing mail to Webtechnosys AI Agency at their Goa address. |
| 9 | How do you start a project? | PASS | 2626 ms | Every project at Webtechnosys starts with a discovery session, followed by a detailed proposal, Statement of Work (SOW), project timeline, and commercial agreement before development begins. |
| 10 | Who owns the source code after delivery? | PASS | 4024 ms | After successful completion of the project and receipt of full payment, the agreed source code and deliverables are transferred to the client, making the client the owner of the source code unless otherwise specified in the agreement. |
| 11 | Do you sign NDAs? | PASS | 2755 ms | Yes, Webtechnosys signs Non-Disclosure Agreements (NDAs), Master Service Agreements (MSAs), Statements of Work (SOWs), and Software Development Agreements to protect both parties. |
| 12 | How are project payments structured? | PASS | 3437 ms | Project payments at Webtechnosys are typically structured around agreed delivery milestones to ensure transparency and reduce risk for both client and provider. |
| 13 | Do you provide post-launch support? | PASS | 3100 ms | Yes, Webtechnosys provides post-launch support through maintenance, enhancements, and AI optimization available via flexible support plans after project launch. |
| 14 | What is the exact price of an AI filmmaking project? | PASS | 3692 ms | The exact price of an AI filmmaking project is not published as it depends on property assets, campaign needs, and final formats, with pricing available on request for specific commercial films such as 30-second AI commercials and 60-second AI brand films.  What outcome or service would you like help with? |
| 15 | Do you guarantee that your software will double my revenue? | PASS | 3293 ms | Webtechnosys does not guarantee that their software will double your revenue; their custom AI software development focuses on building software tied to measurable operating outcomes with focused scope and milestone delivery, but specific results like doubling revenue are not explicitly guaranteed. |

## Deployment evidence

- Production readiness: `GET /api/health/ready` returned `status: ok` after restart.
- Chrome: the deployed bot answered the training question with the Corporate In-House AI Skill Program and AI Tool Universe Bootcamp, and displayed the approved training source link.
- Approved canonical publication: `545fb313-f44b-4c89-b014-76721199fff0`, generation 2, 62 claims.
- Rollback snapshot: `/var/www/lead-os-ai.rollback-unanswered-20261001T102612Z`.
- The acceptance runner records end-to-end latency. The current evidence schema stores aggregate answer-pipeline latency, not each internal stage separately.

## Rollback procedure

Stop `lead-os-ai`, move `/var/www/lead-os-ai` aside, restore `/var/www/lead-os-ai.rollback-unanswered-20261001T102612Z` to `/var/www/lead-os-ai`, restart `lead-os-ai`, then verify `/api/health/ready` and rerun the same gate. The additive canonical search function can remain installed because the rollback runtime does not call it.
