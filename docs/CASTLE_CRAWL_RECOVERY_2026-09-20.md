# Castle Mandawa crawl recovery — 2026-09-20

- Restored source to `https://www.castlemandawa.com`, validated against the tenant identity and expected domain. Public robots policy allowed crawling.
- Backed up original settings before changing only the source URL and crawler-owned status fields.
- Existing crawler completed: READY, 21 pages, including room categories, weddings, dining, facilities, events, activities, wellness, location, contact and terms.
- Existing five published approved database answers were not edited. No new structured facts were automatically approved by this recovery script.
- Logo, theme, welcome text and source-approval setting verified unchanged.
- Certification rerun against the new knowledge revision: ten Golden cases and two privacy probes passed, zero failures.
- Executed under Castle Mandawa's tenant RLS identity. No policy changes, database migrations, other-tenant changes, TypeSafe activation or application restart.
- Recovery utility: `scripts/repair-castle-crawl.ts`. Existing settings backups remain beside the runtime settings file, suffixed `.before-repair-<timestamp>`.

Certification verifies configured governed-answer/handover outcomes; it is not exhaustive proof of every answer's factual correctness.
