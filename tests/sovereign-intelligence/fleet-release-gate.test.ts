import assert from "node:assert/strict";
import test from "node:test";
import { assessFleetRelease, type FleetTenantResult } from "../../lib/sovereign-intelligence/fleet-release-gate";

const tenant = (overrides: Partial<FleetTenantResult> = {}): FleetTenantResult => ({ organizationId: "org-1", organizationName: "Pilot", propertySlug: "pilot", eligible: true, blocker: null, ...overrides });

test("fleet release passes only when Core and every live tenant pass", () => {
  assert.equal(assessFleetRelease(true, [tenant(), tenant({ organizationId: "org-2", propertySlug: "two" })]).eligible, true);
});

test("fleet release fails closed for a single tenant regression", () => {
  const result = assessFleetRelease(true, [tenant(), tenant({ eligible: false, blocker: "Golden certification failed." })]);
  assert.equal(result.eligible, false);
  assert.equal(result.blockers.length, 1);
});

test("fleet release fails when Core certification fails", () => {
  assert.equal(assessFleetRelease(false, [tenant()]).eligible, false);
});
