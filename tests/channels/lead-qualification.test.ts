import assert from "node:assert/strict";
import test from "node:test";
import { appendQualificationPrompt, normalizeConsentedLeadPhone, qualifyLeadConversation } from "../../lib/lead-qualification";

test("qualification stays idle for an ordinary knowledge question", () => {
  const result = qualifyLeadConversation({ messages: ["What services do you provide?"], enabled: true });
  assert.equal(result.state, null);
  assert.equal(result.prompt, null);
});

test("commercial intent starts bounded, one-question-at-a-time qualification", () => {
  const result = qualifyLeadConversation({ messages: ["I need an AI bot for my company"], enabled: true });
  assert.equal(result.state?.facts.need, "AI Business Bot");
  assert.equal(result.state?.nextField, "timeline");
  assert.match(result.prompt || "", /When would/);
});

test("qualification accumulates facts and recommends priority follow-up", () => {
  const first = qualifyLeadConversation({ messages: ["I need a website"], enabled: true });
  const result = qualifyLeadConversation({
    messages: ["I need a website", "Timeline is next month", "Budget is INR 80,000", "Location: Pune", "I am the owner"],
    previousState: { qualification: first.state },
    contact: "owner@example.com",
    enabled: true
  });
  assert.equal(result.state?.status, "HANDOFF_READY");
  assert.equal(result.state?.score, 100);
  assert.equal(result.state?.tier, "HOT");
  assert.equal(result.state?.recommendedAction, "PRIORITY_FOLLOW_UP");
  assert.equal(result.prompt, null);
});

test("a missing field is asked at most twice to prevent qualification loops", () => {
  const prior = {
    qualification: {
      version: "1.0", status: "COLLECTING", active: true, score: 30, tier: "COLD",
      facts: { need: "AI Business Bot" }, asked: { timeline: 2 }, nextField: "timeline", progress: 17,
      contactEligible: false,
      recommendedAction: "CONTINUE_QUALIFICATION"
    }
  };
  const result = qualifyLeadConversation({ messages: ["I need an AI bot", "not sure"], previousState: prior, enabled: true });
  assert.equal(result.state?.nextField, "budget");
});

test("mobile capture is withheld when discovery ends below the quality threshold", () => {
  const result = qualifyLeadConversation({
    messages: ["I need an AI bot"],
    previousState: { qualification: { version: "1.0", status: "COLLECTING", active: true, score: 30, tier: "COLD", facts: { need: "AI Business Bot" }, asked: { timeline: 2, budget: 2, location: 2, decisionRole: 2 }, nextField: null, progress: 17, contactEligible: false, recommendedAction: "CONTINUE_QUALIFICATION" } },
    enabled: true
  });
  assert.equal(result.state?.score, 30);
  assert.equal(result.state?.contactEligible, false);
  assert.equal(result.state?.nextField, null);
  assert.equal(result.prompt, null);
});

test("mobile capture becomes the final step only after useful qualification", () => {
  const result = qualifyLeadConversation({
    messages: ["I need a website", "Timeline is next month", "Budget is INR 80,000", "Location: Pune", "I am the owner"],
    enabled: true
  });
  assert.equal(result.state?.contactEligible, true);
  assert.equal(result.state?.nextField, "contact");
  assert.match(result.prompt || "", /mobile number/);
});

test("qualification is disabled when tenant capability is unavailable", () => {
  const result = qualifyLeadConversation({ messages: ["I need a quote for a website"], enabled: false });
  assert.equal(result.state, null);
});

test("prompt is appended only once", () => {
  const answer = appendQualificationPrompt("We can help.", "What is your timeline?");
  assert.equal(appendQualificationPrompt(answer, "What is your timeline?"), answer);
});

test("consented callback accepts only a plausible mobile number", () => {
  assert.equal(normalizeConsentedLeadPhone("+91 98765 43210"), "+91 98765 43210");
  assert.equal(normalizeConsentedLeadPhone("owner@example.com"), null);
  assert.equal(normalizeConsentedLeadPhone("call me 1234567"), null);
});
