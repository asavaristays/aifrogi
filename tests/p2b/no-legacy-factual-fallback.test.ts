import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMaterialClaimCoverage } from "../../lib/sovereign-intelligence/claim-validator";

test("canonical website serving disables claims, cached snapshots, and profile factual fallbacks", async () => {
  const source = await readFile(new URL("../../lib/services/website-knowledge-service.ts", import.meta.url), "utf8");
  assert.match(source, /activeCrawlStatus \|\| canonicalOnly/);
  assert.match(source, /canonicalOnly \? null : publishedClaimFallback/);
  assert.match(source, /canonicalOnly \? null : persona\?\.kbGateVersion/);
  assert.match(source, /!canonicalOnly && organization/);
});

test("each material answer statement must be supported by selected evidence", () => {
  const evidence = ["Webtechnosys provides website development and automation services. Call +91-7410582898 for enquiries."];
  const covered = validateMaterialClaimCoverage({ answer: "Webtechnosys provides website development services. Call +91-7410582898 for enquiries.", evidenceUnits: evidence });
  assert.equal(covered.valid, true);
  const invented = validateMaterialClaimCoverage({ answer: "Webtechnosys was founded in 2012 and has 900 employees.", evidenceUnits: evidence });
  assert.equal(invented.valid, false);
  assert.ok(invented.decisions.some(decision => !decision.supported && decision.missingNumbers.length > 0));
});
