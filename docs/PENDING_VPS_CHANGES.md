# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## HotelGPT Quick Replies & Guest Updates (local candidate, 2026-09-25)

Local implementation adds 18 versioned hospitality saved-reply defaults, independent tenant copies, separate Pre-Stay and In-Stay libraries, owner/admin management under Settings → Guest communication → Saved replies, contextual staff previews, explicit resolve-and-send completion, optional post-resolution feedback, guest sender/time rendering and structured audit metadata. The automatic In-Stay acknowledgement is receipt-only. No tenant defaults are installed automatically, no PMS or schema migration was added, and production remains unchanged.

Verification: TypeScript passed; focused HotelGPT/security tests passed 21/21; complete channel suite passed 256/256; scoped lint passed with four pre-existing guest-embed warnings and no errors; local Webpack production build passed with 95 static-generation routes. Chrome reached the protected local saved-replies route and correctly redirected to login, but full authenticated received → assigned → update → completion → feedback and mobile visual verification remain pending because no local client credential was available. Do not deploy without explicit approval.

Authenticated production Chrome baseline: Camp Hornbill Settings currently exposes only Team access and Security, confirming the saved-reply manager is not yet deployed. In-Stay Operations shows three open/unassigned/overdue synthetic cases. Room `E2E-15000` still displays the old automatic text “will start resolving it shortly,” while the verified guest tab shows “Request sent · Awaiting front desk update.” No message, assignment, resolution, access decision or setting was changed during this read-only check.
