# Client demo gallery — 6 September 2026

## Delivered
- Public category gallery: https://app.aifrogi.com/ai-bot-demos.
- Eight fresh showcase-* workspaces with synthetic published facts and mock connectors.
- Previous demo-* workspaces were not restored; Webtechnosys's knowledge was not changed.
- Webtechnosys opening widget links to the gallery; each gallery card opens its demo and copies a share URL.
- Synthetic demos disable real human-handover notifications. Calendar/Sheets connected to the real Webtechnosys workspace are not attached to these demos.
- Server-marked, READY, mock-only demos avoid paid trial gating; normal client billing checks remain in place.

## Evidence
- Local core regression: 361/361 passed. TypeScript passed.
- VPS staging build and readiness passed: showcase-20260906 at 2026-09-06T00:14:27.970Z.
- Rollback build/sources: /var/backups/aifrogi/showcase-20260906.cUGx37.
- Eight public standalone pages HTTP 200 with synthetic labels; eight first-question API responses HTTP 200.
- Browser gallery inspected: all eight category links and copy buttons present; copy action reported Link copied.
- Detailed synthetic answers: output/acceptance/showcase-20260906.json.

## Limits
- Smoke does not prove full multi-turn accuracy, full connector journeys or 95% real-world accuracy.
- HotelGPT's inventory question requests dates/guest count before mock availability; this is clarification, not a completed booking.
- Real Google connector certification and prior test-runner exit investigation remain separate Bucket 4 work.
- Synthetic demo facts currently cover a small introductory dataset, not comprehensive vertical knowledge.
