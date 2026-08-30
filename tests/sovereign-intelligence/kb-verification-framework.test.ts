import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateCoverage, validateAtomicClaim } from "../../lib/knowledge-verification";

test("atomic claims reject incomplete commercial facts", () => {
  const result = validateAtomicClaim({ question: "What is the consultation fee?", answer: "The fee is 1500", category: "APPOINTMENTS", claimType: "FEE" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("CURRENCY_REQUIRED"));
});

test("atomic claims reject invalid dates and stale placeholders", () => {
  const result = validateAtomicClaim({ question: "What is the cancellation policy?", answer: "To be confirmed", category: "HOSPITALITY", effectiveAt: new Date("2026-09-01"), expiresAt: new Date("2026-08-01") });
  assert.ok(result.errors.includes("INCOMPLETE_VALUE"));
  assert.ok(result.errors.includes("EXPIRY_MUST_FOLLOW_EFFECTIVE_DATE"));
});

test("category coverage becomes ready only at eighty percent", () => {
  const questions = ["What services can I book?", "Who provides each service?", "What are the consultation fees?", "What are the opening hours?", "How do I book an appointment?", "How do I reschedule or cancel?", "What preparation is required?", "What is the late-arrival policy?"];
  const claims = questions.map((question) => ({ question, answer: `Approved answer for ${question}`, category: "APPOINTMENTS" }));
  const coverage = calculateCoverage("APPOINTMENTS", claims);
  assert.equal(coverage.percentage, 80);
  assert.equal(coverage.ready, true);
});

test("go-live and publish paths enforce preparation without conflict bypass", () => {
  const onboarding = readFileSync(resolve(process.cwd(), "lib/repositories/onboarding-repository.ts"), "utf8");
  const repository = readFileSync(resolve(process.cwd(), "lib/repositories/knowledge-verification-repository.ts"), "utf8");
  const route = readFileSync(resolve(process.cwd(), "app/api/knowledge/entries/route.ts"), "utf8");
  assert.match(onboarding, /getKnowledgeVerificationReadiness/);
  assert.match(onboarding, /Product preparation is incomplete/);
  assert.match(repository, /Unresolved conflicts cannot be bypassed/);
  assert.doesNotMatch(route, /confirmConflict/);
});
