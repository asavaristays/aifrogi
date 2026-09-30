# Webtechnosys Constitution v1.1 — 20-question comparison

Date: 2026-09-29  
Target: production Webtechnosys bot  
Active generation: `4015cb59-2095-4cc6-bbb7-0042bbfbea0d`  
Constitution: v1.1 proposed boundary  

## Behavioral result

- Technical grounding gate: **20/20 PASS**.
- Every result used the same active generation and non-empty ordered chunk evidence.
- Every result used zero legacy claim IDs.
- Every result returned the factual `ANSWER` disposition.
- Shared local regression suite: **32/32 PASS**.
- Public bot route after deployment: **HTTP 200**.
- The initial post-change test ran in four bounded groups. Two groups initially failed to start because concurrent harness processes rewrote the same PM2 snapshot; those starts were discarded and questions 1–10 were rerun sequentially. This was a harness defect, not a bot answer failure.

## Answer-quality review

| # | Question | Result | Quality /5 | Reviewer feedback |
|---:|---|:---:|:---:|---|
| 1 | What services does Webtechnosys provide? | PASS | 4.0 | Broad, readable overview; slightly dense. |
| 2 | How can I contact Webtechnosys? | PASS | 3.5 | Accurate and useful, but includes both offices when phone/email alone would be more direct. |
| 3 | Where are the Webtechnosys offices located? | PASS | 5.0 | Exact two-office answer. Constitution update removed the incorrect implication that the bot itself is located there. |
| 4 | Does Webtechnosys develop mobile applications? | PASS | 4.5 | Direct yes with concise supporting scope. |
| 5 | Does Webtechnosys build custom software for Indian companies? | PASS | 4.5 | Direct and relevant; office detail is useful but optional. |
| 6 | What AI automation services are available? | PASS | 3.5 | Grounded and cleaner after removal of the sales follow-up, but it leans toward training/programs rather than enumerating automation service categories. |
| 7 | What hospitality AI solutions does Webtechnosys offer? | PASS | 4.0 | Strong product list; filmmaking is relevant to hospitality marketing but secondary to the requested AI-product answer. |
| 8 | What is HotelRADAR? | PASS | 4.5 | Clear description and target market; could be more concrete about individual product modules. |
| 9 | Does Webtechnosys provide AI training? | PASS | 4.5 | Clear yes, with both approved programs. |
| 10 | How can I book the AI Tool Universe Bootcamp? | PASS | 4.5 | Useful procedure, price and truthful verification boundary. A verified booking link would improve actionability if the active evidence supplies it. |
| 11 | Does Webtechnosys create AI films or commercial videos? | PASS | 4.5 | Direct, specific and relevant to target clients. |
| 12 | Who founded Webtechnosys? | PASS | 5.0 | Exact and appropriately concise. |
| 13 | How does a new software project begin? | PASS | 5.0 | Complete ordered process with no unnecessary sales language. |
| 14 | What happens before software development starts? | PASS | 4.5 | Complete and clear; overlaps question 13 by design. |
| 15 | Which industries does Webtechnosys work with? | PASS | 3.5 | Safe and grounded, but “primarily hospitality” is narrower than a robust industry inventory. This is a knowledge/retrieval coverage opportunity, not permission to infer more sectors. |
| 16 | Does Webtechnosys serve hotels and resorts? | PASS | 4.5 | Direct and covers several relevant offerings. |
| 17 | Can Webtechnosys help with digital transformation? | PASS | 3.5 | Correct high-level answer; “structured management and secure communication” is vague and not useful to the customer. |
| 18 | Does Webtechnosys work with businesses outside Goa? | PASS | 4.5 | Direct answer with geographic examples and service scope. |
| 19 | What is the email address and phone number? | PASS | 5.0 | Exact deterministic answer. Final update separates bot identity from business contact facts. |
| 20 | How can I request a project proposal? | PASS | 4.5 | Correct discovery-to-agreement path; could offer the approved contact route without claiming a request was submitted. |

Average reviewer quality score: **4.35/5**.

## Before/after observations

| Boundary | Before | After v1.1 |
|---|---|---|
| Factual evidence | Active crawl generation and chunks already enforced | Preserved; 20/20 remained bound to the same active generation with no legacy claims |
| Informational sales prompts | Questions 6 and 7 could end with unsolicited “Would you like…” prompts | Deterministic final-render boundary removes those prompts before evidence binding and delivery |
| Business versus bot identity | Office/contact formatter could describe the bot display name as the located/contactable entity | Neutral “The offices…” and “Contact details…” wording separates assistant identity from business facts |
| Performance | Up to six chunks per answer; no new model call added | Same retrieval and model-call count; deterministic cleanup is in-process and negligible |

## Engineering judgment

The bot is now strong on evidence isolation, direct facts, contacts, project process and training. The main remaining quality opportunities are retrieval coverage and answer selection for broad questions (automation, industries and digital transformation). These must be improved through source taxonomy, coverage tests and ranking—not through client-specific answer patches or model-memory fallback.

This run validates the Webtechnosys reference path. It does not prove that every future bot has a signed multi-source knowledge release; that platform-wide v1.1 control remains an implementation program with explicit status tracking.
