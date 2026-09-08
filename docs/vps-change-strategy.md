# AiFrogi VPS change strategy

This is the default working rule for future AiFrogi and Webtechnosys changes.

## 1. Normal lane: grouped local releases

- Group up to three closely related, low-risk changes into one release batch.
- Keep each batch inside one product area, such as Widget, Setup or Intelligence.
- Run focused tests after each change, but run the full typecheck and production build once when the batch is ready.
- Request one explicit upload/deployment authorization for the complete package and named VPS destination.
- Create one production-based VPS stage, one rollback backup, one restart and one end-to-end browser verification.
- Never add unrelated dirty-worktree files to a batch.

Deploy a normal batch when any one condition is met:

- Three related changes are locally complete.
- The user says the current milestone is complete and asks to deploy.
- Waiting would block the next product area.

## 2. Hotfix lane: immediate release

Deploy a single change immediately only when production has a:

- broken customer-critical action;
- security or data-integrity risk;
- failed installation, opening, closing or message-sending path;
- service outage or health failure.

The hotfix must remain isolated, tested and reversible. It still requires explicit authorization for its package and destination.

## 3. VPS implementation standard

- Build from the current production source in an isolated stage; do not upload the whole local worktree.
- Overlay only the explicitly approved files.
- Build before promotion.
- Back up the current build and every replaced source file.
- Promote with automatic rollback if health or route verification fails.
- Verify the actual client journey in Chrome after deployment.
- Remove only the exact temporary stage after verification; retain the rollback backup.
- Use a new static asset filename whenever an existing asset has immutable cache headers.

## 4. Cost and context controls

- Do not repeat full builds for unchanged code.
- Prefer focused tests during development and one final build per release batch.
- Keep progress and the pending batch in the daily log so a new session does not need to rediscover completed work.
- Summarize tool output and avoid reopening already verified files unless the relevant source changes.
- Follow `docs/token-and-storage-optimization-strategy.md` for compact VPS inspection, bounded retention and the one-build/one-deploy/one-verification rule.

## 5. Pending-change ledger

- Use `docs/PENDING_VPS_CHANGES.md` as the single deployment queue.
- Add an entry only after a change is implemented and locally verified.
- Each entry must identify its product-area batch, purpose and exact source file or files.
- Before preparing a VPS release, read this ledger and include only the authorized entries from one related batch.
- Remove an entry only after VPS promotion, health checks and client-facing verification all pass.
- When every queued change is deployed, leave the file with its title and explanatory sentence but no change entries. Do not delete the file.
- Record completed deployments permanently in the dated daily log; the pending ledger is not deployment history.

## Current deployment queue

Read `docs/PENDING_VPS_CHANGES.md`. Start the next normal release with its existing product-area batch and add no more than two closely related changes.
