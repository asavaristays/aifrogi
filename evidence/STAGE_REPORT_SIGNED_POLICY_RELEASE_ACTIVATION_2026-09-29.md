# Stage report: signed policy and release activation

Date: 2026-09-29  
Scope: isolated implementation and disposable PostgreSQL verification  
Production state: unchanged; signed-release enforcement is not enabled in production

## Implemented

- Immutable `BotMachinePolicyArtifact`, `BotReleaseArtifact` and compare-and-set `BotReleasePointer` models.
- Forced RLS and explicit privilege removal on all three property-owned tables.
- Publisher-only registration and activation routines using trusted property, principal and purpose context.
- SHA-256 checks over the exact canonical payload bytes PostgreSQL stores.
- Atomic activation with stale-generation rejection and one active policy/release per pointer.
- Public read routine for the active release; no public direct table privilege.
- Application verification of RSA signature, trusted key ID, exact build, schema, serving contract, policy hash and knowledge-release hash.
- Fail-closed factual-route admission behind `AIFROGI_SIGNED_BOT_RELEASE_REQUIRED=1`.
- Startup refusal when signed enforcement is requested without schema identity or trusted signer keys.
- Corrected two forward-reference grants in the canonical baseline migration discovered by the empty-database rehearsal.

## Verification

| Check | Result |
|---|---|
| Prisma client generation | PASS |
| TypeScript | PASS |
| P2-B application suite | PASS — 10/10 |
| Empty disposable bootstrap | PASS |
| New migration application | PASS |
| Direct runtime write privileges absent | PASS |
| Forced RLS present | PASS |
| Publisher authority/context | PASS |
| Cross-property context rejection | PASS |
| First activation at expected generation 0 | PASS |
| Stale generation activation rejection | PASS |
| Public active-release lookup | PASS |
| Isolated production build | PASS |
| Production migration/deployment/activation | NOT RUN |

Disposable database: `p2b_rehearsal_signed_release_20260929` on the authorized server. The test transaction emitted `SIGNED_BOT_RELEASE_BEHAVIOR_PASS`.

The local build initially failed because the desktop sandbox denied a Turbopack worker port. The same staged files then passed `prisma generate`, `tsc --noEmit`, and `next build` in `/tmp/aifrogi-signed-release-build` on the server. Nothing in `/var/www/lead-os-ai` was modified.

## Artifact hashes

| Artifact | SHA-256 |
|---|---|
| `lib/bot-machine-policy.ts` | `afb57246ac7ff580bfd8869740a6a954ba9a096f1406cddcd1bb91297284f45c` |
| `lib/canonical-bot-release.ts` | `6bd5cbb62e92639f82a1dc40fb8f0790251f04f00e4e5ebd120b9f4b6fadbb0c` |
| `lib/canonical-serving-gate.ts` | `d1ce077dc38ecd9ed8676e8eb30064cf1c6b6cfba6223dffd1dbe05f5c2c3ba8` |
| signed release migration | `595214bb59483b1a0f3f8c4854ffd2f953b8ab03dad3593ad4565dd950c1e59a` |
| PostgreSQL behavioral fixture | `94706df1284173c03b82033e226f936a4050b628def80048d5633d311a97f5e2` |
| `prisma/schema.prisma` | `a4c729223d21896e2487ec514efb78745e4ff696ffe2e0b45f3696625d1138b3` |

## Architecture status change

- GOV-02: NEEDS ATTENTION -> WORKING FINE in isolated P2-B scope.
- GOV-03: NEEDS ATTENTION -> WORKING FINE in isolated P2-B scope.
- Current totals: 34 Working Fine, 23 Needs Attention, 10 Not Implemented, 7 Not Run (74 total).

## Next P0 stage

Build the signed multi-source knowledge release whose hash is currently bound by this release manifest: exact website, PDF, spreadsheet and profile/form source-version membership, approval, sealing and atomic serving activation. Production remains unchanged until that stage and rollout gates pass.
