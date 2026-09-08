# Connector pricing mobile slider - 6 September 2026

User reported that mobile showed only the first two columns, hiding the PDF downloads. Preserved the table and prices; added overflow-aware horizontal range slider, swipe instructions, Connectors/Show PDF downloads shortcuts and a visible gold scrollbar. Slider position follows native scrolling and recalculates on resize. Controls are keyboard labelled with 44px touch targets. No automatic animation, PDF changes or billing changes.

TypeScript passed; four pricing/source-contract tests passed. This verifies implementation structure, not mobile browser interaction acceptance. Staged production build and public deployment checks recorded on completion.

Deployment completed at 2026-09-06T05:01:09.145Z, release `connector-slider-20260906`; rollback backup `/var/backups/aifrogi/connector-slider-20260906.BX8rR9`. Public readiness, pricing table markup and PDF links verified after deployment.
