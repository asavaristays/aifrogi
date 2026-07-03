# AiFrogi Governed Knowledge

Date: 2026-07-03

## Product Contract

AiFrogi treats client knowledge as governed business data, not an unrestricted chatbot prompt. Client Admins prepare sources, review conflicts, and explicitly approve content. The AI retrieval layer can use approved website knowledge, approved manual answers, and approved documents only.

## Implemented

- Client Knowledge includes a document library for PDF, DOCX, TXT, Markdown, CSV, and JSON files.
- Uploads are limited to 8 MB. PDFs are limited to 50 pages and extracted text is capped at 120,000 characters.
- Uploaded files and extracted text remain pending until a Client Admin approves them.
- Manual question-and-answer entries support categories, draft review, approval, rejection, and deletion.
- Similar approved questions with different answers or numeric claims are flagged as conflicts.
- Conflicted content requires an explicit confirmation before approval and is excluded from retrieval until approved.
- Questions without relevant approved knowledge are aggregated in a knowledge-gap queue with occurrence counts.
- Client Admins can answer a gap directly or dismiss it.
- Approved documents and answers are ranked against the customer question and added to the existing approved website context.
- Website content, uploaded documents, and manual answers remain isolated by client property.
- A reusable `npm run verify:knowledge` lifecycle check validates aggregation, approval, conflict isolation, document extraction, retrieval, and cleanup.
- Next.js was updated to 16.2.10 to address the relevant framework security advisory.

## Governance Rules

- Draft, pending, rejected, and unresolved conflict content must never reach an AI response.
- Source content cannot override the platform answer constitution, protected-topic handoff, privacy rules, or STOP handling.
- Documents are stored in the application database and are available only to the owning workspace and authorized platform operations.
- The interface exposes approval state, conflict reason, uploader, approver, and timestamps without exposing binary file content.
- Knowledge-gap capture must continue even when the OpenAI provider is unavailable.
- Verification records use synthetic identifiers and are removed in a `finally` cleanup block.

## Remaining Evolution

1. Add document version history, replacement, and rollback.
2. Add richer citations from source pages and document sections to each proposed answer.
3. Add semantic retrieval after the approved-only governance boundary is preserved.
4. Add scheduled recrawls with change review before newly crawled content becomes active.
5. Add a Super Admin audit timeline for approvals, conflicts, and retrieval health.

Passwords, tokens, customer documents, extracted content, customer questions, and database credentials must never enter Git or product memory.
