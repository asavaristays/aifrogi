# Mandatory AI-Frogi session start

Updated 17 October 2026. This is a required work-start procedure, not a scheduled reminder or product readiness certificate. AGENTS.md loads the rule when working in this workspace/repository. The internal-drive launcher AGENTS.md points to the same HDD policy; it is not a fallback source tree.

## Automated collection and fail-closed work runner

From any directory:

```sh
node /Volumes/MANISH-22/Codex-Workspace/projects/AI-Frogi/tools/session-preflight.mjs begin
```

The runner checks canonical HDD availability and ready=true, enumerates and reads project `.md`/`.MD` files including private available-history exports, deduplicates identical contents, and writes a manifest plus full-text reading chunks to a private `.aifrogi-session/SESSION/` directory. It excludes dependency/build/Git/cache/generated-audit directories. The manifest records exclusions, all included paths, byte hashes and chunk hashes. It stops on unreadable Markdown. These generated files are private and ignored by Git.

An agent must read every chunk completely through its file-reading tools. A scan, hash, headings list or keyword excerpt is not acknowledgement of reading. Identical documents may be read once; all their paths remain recorded. After reading a chunk, record its exact manifest hash:

```sh
node /Volumes/MANISH-22/Codex-Workspace/projects/AI-Frogi/tools/session-preflight.mjs ack SESSION read-0001.txt EXACT_MANIFEST_SHA256
```

Do not automatically acknowledge all chunks from the manifest. Receipts are an explicit agent attestation, not a technical proof of comprehension.

## Discussion and instruction review

Read current user messages and the instruction/discussion ledger. Retrieve relevant available project chats with the app tools and read required remaining pages. Private exports preserve available user/assistant messages only, not tool traces or a guaranteed complete chronological transcript. The full app history was not migrated. Record exact missing essential history; never assume it was read or reconstruct an approval from an assistant summary.

Create `.aifrogi-session/SESSION/discussion-review.json` only after review:

```json
{
  "reviewedAt": "CURRENT_ISO_TIMESTAMP_AFTER_SESSION_START",
  "reviewedSources": ["Current user messages and source references", "Saved ledger and relevant app-thread IDs/pages reviewed"],
  "latestUserInstruction": "Exact current instruction or a faithful sufficiently detailed quotation",
  "target": "Complete the common evidence-based architecture, not a list of example answers",
  "constraints": ["Canonical HDD only", "Preserved production/publication/migration/purge/other-project approval holds", "One bounded architecture item; no repeated test loop"],
  "activeWorkItem": "A10",
  "missingRequiredHistory": [],
  "conflictsResolved": true
}
```

Empty missingRequiredHistory and conflictsResolved=true must reflect actual review. They are not boilerplate defaults to bypass missing context. If essential history/instructions are missing, stop and ask the user for that specific item. When no app history tool is available, record that limitation and do not proceed with work dependent on unrecovered history.

## Open the work gate

```sh
node /Volumes/MANISH-22/Codex-Workspace/projects/AI-Frogi/tools/session-preflight.mjs finish SESSION
node /Volumes/MANISH-22/Codex-Workspace/projects/AI-Frogi/tools/session-preflight.mjs run SESSION -- YOUR_COMMAND YOUR_ARGUMENTS
```

`finish`/`run` reject unread chunks, bad hashes, missing/incomplete discussion review, declared missing essential history, changed Markdown context and context older than 24 hours. `run` executes only after validation, from the active canonical repository, without a shell wrapper. Product edits through any other tool also require the passed prerequisite under AGENTS.md. Context gate passage never grants deployment permission or certifies product readiness.

State the objective, scope, relevant remaining holds and selected register item before implementation. Then execute the strategy/checklist and update the table from evidence. At handoff update CONTINUE.md and the discussion ledger; changes invalidate old context for the next work start. Start a fresh review after handoff/compaction or materially changed instructions.

## Gate checks

```sh
node /Volumes/MANISH-22/Codex-Workspace/projects/AI-Frogi/tools/session-preflight.mjs self-test
```

Nine isolated self-tests cover collection/deduplication, full-text generation, missing reading, bad hashes, absent discussion, missing required history, completed prerequisite validation, changed Markdown and Unicode-preserving chunking. These are workflow tests only; they do not mark the actual current Markdown corpus read or the product ready.

## Limits

AGENTS.md makes this mandatory for the coding agent and the work runner enforces recorded prerequisites. A local script cannot autonomously retrieve inaccessible app conversations, prove understanding, or prevent every possible out-of-band filesystem operation. Do not claim otherwise. The correct behavior when a prerequisite cannot be completed is to stop dependent work, not silently skip it.


## Superseding user instruction — focused startup, 17 October 2026

The user explicitly approved: “Authorize focused startup review and proceed.” This replaces the full archive reread requirement above. At startup read current instructions, approved architecture, strategy, work register and latest discussion in full; consult archived files when needed. Do not restart a full archive review after compaction. Resume using the current review and read changed instructions/relevant evidence. The startup runner now collects the explicit authoritative current-document set, checks its hashes and requires genuine reading receipts/discussion review. Old full-reading sessions remain closed; do not fabricate receipts for them. All other scope/security rules persist.

The user also instructed: “PLEASE COMPLETE THE TASK AND DEPLOY URGENTLY.” This authorizes implementation, qualification and deployment of the verified readiness release; do not ask again for the same rollout approval. It does not waive release gates or authorize customer publication/activation, transactions, purge, automatic TRIAL_VERIFIED or other-project changes.
