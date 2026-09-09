# AiFrogi Daily Work Record

Status: Active from 7 September 2026
Purpose: Keep one evidence-based, append-only record for each day on which project work occurs.

## Operating rule

Before intelligence work, read [`../CORE_INTELLIGENCE_LEDGER.md`](../CORE_INTELLIGENCE_LEDGER.md) and [`../TENANT_INTELLIGENCE_LEDGER.md`](../TENANT_INTELLIGENCE_LEDGER.md). Every intelligence entry must reference its existing `CI-*`, `TI-*` or `TEN-*` identifier so daily chronology does not become a second capability backlog.

1. Create one file named `YYYY-MM-DD.md` when the first project task begins that day.
2. Append each completed work item on the same day; do not rewrite earlier evidence.
3. Separate discussion, implementation, verification and deployment.
4. Record production release and rollback references only when deployment actually occurs.
5. Label synthetic, staging, production and real-client evidence explicitly.
6. A plan, design decision or passing synthetic test must never be reported as real-world acceptance.
7. Preserve blockers, failures and limitations until later evidence closes them.
8. Do not record passwords, tokens, private keys, OTPs or other secrets.
9. Link detailed specifications or acceptance reports instead of duplicating them.
10. If a previous statement is corrected, append a dated correction; never silently alter history.

## Daily file structure

```markdown
# AiFrogi daily worklog — YYYY-MM-DD

## Starting position
- Evidence-backed state at the beginning of the day.

## Decisions and discussion
- Decisions agreed without implying implementation.

## Implemented
- Code, content or configuration actually changed.

## Verification
- Test, build, browser, database or provider evidence.

## Deployed
- Release, production checks and rollback reference.

## Issues and corrections
- Failures found, cause and correction status.

## Open items
- Work still unimplemented or unproven.

## End-of-day position
- Concise factual handoff for the next working day.
```

The consolidated historical record remains in [`../date-wise-progress.md`](../date-wise-progress.md). Daily files are the detailed source for work from 7 September 2026 onward.
