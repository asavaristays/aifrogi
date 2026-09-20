import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AI_READINESS_R1_CHECKS,
  AI_READINESS_RUBRIC_V1,
  displayReadinessStatus,
  getReadinessCheck,
  isComparableReadinessScan
} from "../../lib/ai-readiness/rubric";
import { readinessRetryDelayMs, readinessScanIdempotencyKey } from "../../lib/ai-readiness/readiness-queue";

test("R1 readiness rubric is evidence-led and confined to two assessed pillars", () => {
  assert.equal(AI_READINESS_RUBRIC_V1, "ai-readiness-r1.0");
  assert.ok(AI_READINESS_R1_CHECKS.length >= 6);
  assert.deepEqual([...new Set(AI_READINESS_R1_CHECKS.map((check) => check.pillar))].sort(), ["READABLE_DATA", "SERVE_THE_HUMAN"]);
  assert.ok(AI_READINESS_R1_CHECKS.every((check) => check.requiredEvidence && check.freshnessDays > 0 && check.autoFixAllowed === false));
  assert.equal(getReadinessCheck("readable_data.schema_syntax")?.pillar, "READABLE_DATA");
});

test("unknown readiness evidence is never rendered as failure", () => {
  assert.equal(displayReadinessStatus("INSUFFICIENT_EVIDENCE"), "Needs evidence");
  assert.equal(displayReadinessStatus("FAIL"), "FAIL");
  assert.equal(isComparableReadinessScan(AI_READINESS_RUBRIC_V1, AI_READINESS_RUBRIC_V1), true);
  assert.equal(isComparableReadinessScan(AI_READINESS_RUBRIC_V1, "ai-readiness-r2.0"), false);
});

test("scan idempotency is tenant-scoped and scan URLs cannot carry credentials", () => {
  const first = readinessScanIdempotencyKey({ organizationId: "tenant-a", propertyId: "property-a", sourceUrl: "https://hotel.example/readiness", rubricVersion: AI_READINESS_RUBRIC_V1 });
  const secondTenant = readinessScanIdempotencyKey({ organizationId: "tenant-b", propertyId: "property-a", sourceUrl: "https://hotel.example/readiness", rubricVersion: AI_READINESS_RUBRIC_V1 });
  assert.notEqual(first, secondTenant);
  assert.match(first, /^tenant-a:ai-readiness:property-a:/);
  assert.throws(() => readinessScanIdempotencyKey({ organizationId: "tenant-a", propertyId: "property-a", sourceUrl: "https://user:password@hotel.example", rubricVersion: AI_READINESS_RUBRIC_V1 }));
  assert.equal(readinessRetryDelayMs(1), 120_000);
  assert.equal(readinessRetryDelayMs(99), 3_600_000);
});

test("R1 scan foundation is durable, tenant-scoped and cannot become a public crawler", () => {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const migration = readFileSync(resolve(process.cwd(), "prisma/migrations/20260920150000_ai_readiness_r1_foundation/migration.sql"), "utf8");
  const queue = readFileSync(resolve(process.cwd(), "lib/ai-readiness/readiness-queue.ts"), "utf8");
  const rls = readFileSync(resolve(process.cwd(), "ops/tenant-rls-policies.sql"), "utf8");
  const verifier = readFileSync(resolve(process.cwd(), "ops/verify-tenant-rls.mjs"), "utf8");

  for (const model of ["ReadinessScan", "ReadinessEvidence", "ReadinessIssue", "ReadinessWorkItem", "ReadinessVerification"]) {
    assert.match(schema, new RegExp(`model ${model}\\s*\\{[\\s\\S]*?organizationId`));
    assert.match(migration, new RegExp(`CREATE TABLE \\"${model}\\"`));
    assert.match(rls, new RegExp(`'${model}'`));
    assert.match(verifier, new RegExp(`"${model}"`));
  }
  assert.match(schema, /idempotencyKey\s+String\s+@unique/);
  assert.match(migration, /enforce_readiness_organization_integrity/);
  assert.match(migration, /ReadinessScan property must belong to its organization/);
  assert.match(migration, /prevent_readiness_evidence_update/);
  assert.match(migration, /Readiness evidence is immutable/);
  assert.match(migration, /ELSIF TG_TABLE_NAME = 'ReadinessEvidence'/);
  assert.doesNotMatch(migration, /TG_TABLE_NAME = 'ReadinessScan' AND NOT EXISTS/);
  assert.match(queue, /withTenantDatabaseContext/);
  assert.match(queue, /withSystemDatabaseIdentity/);
  assert.match(queue, /property\.findFirst\(\{ where: \{ id: propertyId, organizationId \}/);
  assert.match(queue, /lease was lost; result was not recorded/);
  assert.doesNotMatch(queue, /fetch\(|axios|playwright|puppeteer/i);
});
