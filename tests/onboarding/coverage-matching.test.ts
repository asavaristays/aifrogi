import test from "node:test";
import assert from "node:assert/strict";
import { claimCoversQuestion, calculateCoverage } from "../../lib/knowledge-verification";
test("contact paraphrases match without generic filler words", () => {
  assert.equal(claimCoversQuestion({ question: "Phone number", answer: "+91-7410582898", category: "Contact" }, "How can I contact the team?"), true);
  assert.equal(claimCoversQuestion({ question: "General", answer: "You can ask our team and we are here for you", category: "General" }, "What are the consultation fees?"), false);
});
test("commerce persona uses commerce coverage bank", () => {
  assert.deepEqual(calculateCoverage("FLOWCART", []).missing, calculateCoverage("COMMERCE", []).missing);
});
