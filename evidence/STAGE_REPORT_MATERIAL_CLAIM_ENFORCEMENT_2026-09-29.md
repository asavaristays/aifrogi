# Stage report: material claim-to-evidence enforcement

Date: 2026-09-29  
Scope: active-crawl factual answers, isolated application and PostgreSQL  
Production state: unchanged

## Implemented

- Final answers are decomposed into material factual statements.
- Each statement records matched evidence terms and missing numeric assertions.
- Every number, duration and percentage must occur in the selected evidence.
- Each material statement requires majority significant-term coverage from selected chunks.
- Unsupported statements fail closed before provider delivery.
- PostgreSQL requires a nonempty decision array, requires every decision to be supported, verifies every recorded claim is text actually present in the final answer, and persists the decisions with the answer hash.
- The prior database routine signature was dropped, preventing callers from bypassing claim decisions.

## Verification

| Check | Result |
|---|---|
| TypeScript | PASS |
| P2-B suite | PASS — 13/13 |
| Supported multi-statement answer | PASS |
| Invented founding year/employee count | BLOCKED as expected |
| Empty decision array | BLOCKED as expected |
| PostgreSQL durable audit cardinality | PASS |
| Disposable database result | `MATERIAL_CLAIM_ENFORCEMENT_PASS` |
| Production migration/deployment | NOT RUN |

## Artifact hashes

- Claim validator: `abc97e7ba4a2a832aa73334c3988e23d03340989210961c1f480020457b300d0`
- Crawl delivery boundary: `cef92e11374a8c9c8dc15af2dbf9d68828737779ff715572bd7b32b0e3f24aac`
- Migration: `155274de091efbff51c189d09668b286e0d14c9676ebabc60b854108aafc50e2`
- SQL behavioral fixture: `42be3873c7a529c30efb7ea3e40c4180ffe55b53952d71a54c2d7c1dd808ca36`

## Architecture status change

- ANS-07: NEEDS ATTENTION -> WORKING FINE in isolated active-crawl scope.
- Totals: 37 Working Fine, 21 Needs Attention, 9 Not Implemented, 7 Not Run.

## Next P0 stage

Force website, WhatsApp and future adapters through one canonical request, decision, claim-validation, audit and delivery boundary.
