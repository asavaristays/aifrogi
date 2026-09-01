import assert from "node:assert/strict";
import test from "node:test";
import { SUBSCRIPTION_GRACE_DAYS, SUSPENDED_DATA_RETENTION_DAYS } from "../../lib/subscription-policy";

test("subscription lifecycle uses the approved grace and retained-data periods", () => {
  assert.equal(SUBSCRIPTION_GRACE_DAYS, 3);
  assert.equal(SUSPENDED_DATA_RETENTION_DAYS, 30);
});

test("automation endpoint processes subscription lifecycle alongside existing jobs", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../../app/api/automation/run/route.ts", import.meta.url), "utf8"));
  assert.match(source, /processSubscriptionLifecycleBatch/);
  assert.match(source, /subscriptions/);
});

test("website AI Bot checks subscription entitlement before answering", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../../app/api/public/website-bot/[slug]/route.ts", import.meta.url), "utf8"));
  assert.match(source, /getOrganizationSubscriptionAccess/);
  assert.match(source, /!subscription\.canUsePaidActions/);
  assert.match(source, /temporarily suspended/);
});
