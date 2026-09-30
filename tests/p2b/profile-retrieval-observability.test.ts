import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalProfileSource } from "../../lib/canonical-profile-source";
import { assessBotFactualReadiness, assessSourceCoverage, clusterFleetKnowledgeGaps } from "../../lib/fleet-knowledge-observability";
import { planRetrievalQuery } from "../../lib/retrieval-query-plan";
import { readFileSync } from "node:fs";

const profile = { propertyId: "p-1", businessName: " Example Co ", publicEmail: "INFO@EXAMPLE.COM", publicPhone: "+91 123", publicAddress: " Goa ", publicBusinessHours: "Mon-Fri", timezone: "Asia/Kolkata", industry: "Technology", approvedBy: "OWNER@EXAMPLE.COM", approvedAt: "2026-09-30T00:00:00.000Z" };

test("profile facts become one deterministic approved FORM version without private owner data", () => {
  const first = buildCanonicalProfileSource(profile);
  const same = buildCanonicalProfileSource({ ...profile, businessName: "Example   Co", publicEmail: "info@example.com" });
  const changed = buildCanonicalProfileSource({ ...profile, publicPhone: "+91 999" });
  assert.equal(first.versionId, same.versionId);
  assert.notEqual(first.versionId, changed.versionId);
  assert.equal(first.sourceType, "FORM");
  assert.equal(first.facts.publicEmail, "info@example.com");
  assert.doesNotMatch(first.canonicalPayload, /ownerMobile|ownerEmail|gstNumber/);
  assert.throws(() => buildCanonicalProfileSource({ ...profile, approvedBy: "" }), /PROFILE_APPROVER_REQUIRED/);
});

test("broad questions expand into diverse topic-aware retrieval while precise questions stay narrow", () => {
  const broad = planRetrievalQuery("Tell me about all your services and industries");
  assert.equal(broad.diversityRequired, true);
  assert.deepEqual(broad.topics, ["services", "industries"]);
  assert.match(broad.query, /capabilities/);
  assert.match(broad.query, /sectors/);
  const precise = planRetrievalQuery("Who founded the company?");
  assert.equal(precise.diversityRequired, false);
  assert.equal(precise.query, precise.original);
});

test("production business questions expand to the evidence vocabulary used by the crawl", () => {
  assert.match(planRetrievalQuery("What can your AI website bot do for a service business?").query, /customer enquiries/);
  assert.match(planRetrievalQuery("How do you help hotels improve revenue decisions?").query, /HotelRADAR/);
  assert.match(planRetrievalQuery("What corporate AI training do you provide?").query, /corporate in-house AI skill program/);
  assert.match(planRetrievalQuery("What should I provide for a software proposal?").query, /Statement of Work/);
  assert.match(planRetrievalQuery("Do you serve clients outside India?").query, /United States/);
});

test("per-bot readiness names every blocking layer instead of hiding behind general app health", () => {
  assert.deepEqual(assessBotFactualReadiness({ propertyId: "p-ok", releaseActive: true, factualServingOpen: true, authorizedSourceCount: 2, activeMemberCount: 2, retrievableUnitCount: 10, validatorHealthy: true, unresolvedDeliveryCount: 0 }), { propertyId: "p-ok", ready: true, blockers: [] });
  const failed = assessBotFactualReadiness({ propertyId: "p-bad", releaseActive: false, factualServingOpen: false, authorizedSourceCount: 0, activeMemberCount: 0, retrievableUnitCount: 0, validatorHealthy: false, unresolvedDeliveryCount: 3 });
  assert.equal(failed.ready, false);
  assert.equal(failed.blockers.length, 7);
});

test("source monitoring reports coverage, freshness and capture failures with thresholds", () => {
  const now = new Date("2026-09-30T12:00:00.000Z");
  const healthy = assessSourceCoverage({ sourceId: "s-ok", expectedItems: 10, capturedItems: 10, failedItems: 0, lastCapturedAt: "2026-09-30T11:00:00.000Z", refreshHours: 24 }, now);
  assert.equal(healthy.healthy, true);
  assert.equal(healthy.coveragePercent, 100);
  const failed = assessSourceCoverage({ sourceId: "s-bad", expectedItems: 10, capturedItems: 7, failedItems: 2, lastCapturedAt: "2026-09-28T00:00:00.000Z", refreshHours: 24 }, now);
  assert.deepEqual(failed.alerts, ["COVERAGE_BELOW_90", "CAPTURE_FAILURES_PRESENT", "REFRESH_DUE"]);
});

test("fleet gap clusters never mix tenants and prioritize repeated missing topics", () => {
  const topics = clusterFleetKnowledgeGaps([
    { id: "a1", propertyId: "p-a", question: "Do you provide cloud migration services?", occurrenceCount: 7, lastAskedAt: "2026-09-30T10:00:00Z" },
    { id: "a2", propertyId: "p-a", question: "Which cloud migration services are available?", occurrenceCount: 4, lastAskedAt: "2026-09-30T11:00:00Z" },
    { id: "b1", propertyId: "p-b", question: "Do you provide cloud migration services?", occurrenceCount: 20, lastAskedAt: "2026-09-30T12:00:00Z" },
  ]);
  assert.equal(topics.length, 2);
  assert.equal(topics[0].propertyId, "p-b");
  assert.equal(topics[0].priority, "CRITICAL");
  assert.equal(topics[1].propertyId, "p-a");
  assert.equal(topics[1].priority, "CRITICAL");
});

test("fleet health is exposed only through platform-admin database authority", () => {
  const route = readFileSync("app/api/admin/fleet-health/route.ts", "utf8");
  const repository = readFileSync("lib/repositories/fleet-health-repository.ts", "utf8");
  assert.match(route, /withCurrentPlatformAdminDatabaseContext\("admin-fleet-health"/);
  assert.match(route, /private, no-store/);
  assert.match(repository, /assessBotFactualReadiness/);
  assert.match(repository, /assessSourceCoverage/);
  assert.match(repository, /clusterFleetKnowledgeGaps/);
});
