import assert from "node:assert/strict";
import test from "node:test";
import { buildTenantKnowledgeChangeSet, groupTenantKnowledgeGaps, tenantKnowledgeFreshness } from "../../lib/tenant-intelligence/learning-lifecycle";

test("detects added, removed and changed tenant source pages", () => {
  const previous = { crawledAt: "2026-09-13T00:00:00.000Z", pages: [{ url: "https://example.com/a", title: "A", text: "Old rate" }, { url: "https://example.com/b", title: "B", text: "Removed" }], structuredFacts: [{ field: "rate", value: "6000", sourceUrl: "https://example.com/a" }] };
  const current = { crawledAt: "2026-09-14T00:00:00.000Z", pages: [{ url: "https://example.com/a", title: "A", text: "New rate" }, { url: "https://example.com/c", title: "C", text: "Added" }], structuredFacts: [{ field: "rate", value: "6500", sourceUrl: "https://example.com/a" }] };
  const result = buildTenantKnowledgeChangeSet(previous, current);
  assert.equal(result.status, "CHANGED");
  assert.deepEqual(result.changedPages, ["https://example.com/a"]);
  assert.deepEqual(result.addedPages, ["https://example.com/c"]);
  assert.deepEqual(result.removedPages, ["https://example.com/b"]);
  assert.equal(result.addedFacts.length, 1);
  assert.equal(result.removedFacts.length, 1);
  assert.equal(result.requiresReview, true);
});

test("clusters similar unanswered questions but leaves distinct topics separate", () => {
  const topics = groupTenantKnowledgeGaps([
    { id: "1", question: "What is the nearest airport to Rohet Garh?", occurrenceCount: 2, lastAskedAt: "2026-09-14T10:00:00Z" },
    { id: "2", question: "Which airport is nearest to Rohet Garh", occurrenceCount: 3, lastAskedAt: "2026-09-14T11:00:00Z" },
    { id: "3", question: "Do you allow pets?", occurrenceCount: 1, lastAskedAt: "2026-09-14T09:00:00Z" }
  ]);
  assert.equal(topics.length, 2);
  assert.equal(topics[0].occurrenceCount, 5);
  assert.equal(topics[0].questionCount, 2);
  assert.equal(topics[0].status, "DRAFT_REVIEW");
});

test("marks tenant knowledge due according to its configured interval", () => {
  assert.equal(tenantKnowledgeFreshness("2026-09-14T06:00:00Z", 6, new Date("2026-09-14T11:00:00Z")).status, "CURRENT");
  assert.equal(tenantKnowledgeFreshness("2026-09-14T06:00:00Z", 4, new Date("2026-09-14T11:00:00Z")).status, "DUE");
  assert.equal(tenantKnowledgeFreshness(null, 6).status, "DUE");
});
