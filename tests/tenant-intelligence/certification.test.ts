import assert from "node:assert/strict";
import test from "node:test";
import { certificationRequirement, tenantCertificationStatus, type TenantCertificationRecord } from "../../lib/tenant-intelligence/certification";

const record = (overrides: Partial<TenantCertificationRecord> = {}): TenantCertificationRecord => ({ version: "1.0", propertySlug: "tenant-a", level: "SMOKE", cases: Array.from({ length: 5 }, (_, index) => ({ id: `q${index}`, question: `Customer question number ${index}`, expectation: "GROUNDED_ANSWER" })), results: [], passed: true, knowledgeRevision: "rev-1", runAt: "2026-09-14T00:00:00Z", ...overrides });

test("smoke and golden banks require five and ten tenant questions", () => { assert.equal(certificationRequirement("SMOKE"), 5); assert.equal(certificationRequirement("GOLDEN"), 10); });
test("a complete current passing tenant run is eligible", () => assert.equal(tenantCertificationStatus(record(), "rev-1").eligible, true));
test("knowledge changes expire a previous tenant certification", () => { const status = tenantCertificationStatus(record(), "rev-2"); assert.equal(status.eligible, false); assert.match(status.blocker || "", /Knowledge changed/); });
test("incomplete and failed banks cannot authorize submission", () => { assert.equal(tenantCertificationStatus(record({ cases: [] }), "rev-1").eligible, false); assert.equal(tenantCertificationStatus(record({ passed: false }), "rev-1").eligible, false); });
