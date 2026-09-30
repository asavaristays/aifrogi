# V5 finding-to-enforcement matrix

| Finding | V6 artifact enforcement | Behavioral proof status |
| --- | --- | --- |
| V5-1 consent trigger mismatch | Part 15 branches by trigger table; new consent rows require an exact source; retained null-source legacy rows are explicitly ineligible | NOT RUN |
| V5-2 incomplete claim seal | effective seal routine includes value, answer, quote, identity qualifiers, audience, dates, policy, generation, requirements and detailed evidence; authorized evidence must cover every required component | NOT RUN |
| V5-3 publication authorization | candidate/nonempty checks, canonical ordered manifest, current eligibility and exact approved purpose/audience/policy/scope hash | NOT RUN |
| V5-4 sealed reassignment | child guards forbid parent-key changes and lock the OLD parent on update/delete | NOT RUN |
| V5-5 role context | exact isolated `session_user`, no role memberships, active principal/property/purpose grant, property GUC and separate role-specific pools | NOT RUN |
| V5-6 file backfill | every filesystem row remains `QUARANTINE`; exact tuples receive `PENDING_BYTE_VERIFICATION_AND_IMPORT`, never `MAP` | NOT RUN |
| V5-7 old-build admission | signed manifest binds contract and release ID to archive SHA-256; script renders active nginx include, validates and reloads | NOT RUN |
| V5-8 delivery race | Part 22 is the only factual network boundary; it holds the policy share lock across final validation and provider acceptance; revocation takes the conflicting update lock; uncertain sends record FAILED/uncertain | NOT RUN |
| V5-9 omitted RLS tables | final reconciliation includes `WebsiteSourceConsent`, `Participant`, `Message` and the runtime grant table, dropping every discovered policy before grants | NOT RUN |

No row in this matrix claims behavioral closure before disposable PostgreSQL and
application tests are separately authorized.
