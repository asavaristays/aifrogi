# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Tenant Intelligence — client answer management

- Client Dashboard → Intelligence → Step 2 now provides **Edit** and **Delete** for managed answers.
- Editing an unpublished draft updates the draft and resets it to the approval workflow.
- Editing an approved answer creates a new versioned draft; the approved version is not silently overwritten.
- Deleting a draft permanently removes it after confirmation.
- Deleting previously approved knowledge removes it from bot use while retaining its audit history.
- Tenant ownership is enforced by the existing Client Admin workspace boundary.

Verification completed locally:

- ESLint: no errors (one pre-existing unused-function warning)
- TypeScript: passed
- Production webpack build: passed
