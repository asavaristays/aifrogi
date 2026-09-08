import assert from "node:assert/strict";
import test from "node:test";
import { appendQualificationPrompt, hasExplicitBuyingSignal, normalizeConsentedLeadPhone, qualifyLeadConversation } from "../../lib/lead-qualification";
import { readFileSync } from "node:fs";

test("qualification stays idle for an ordinary knowledge question", () => {
  const result = qualifyLeadConversation({ messages: ["What services do you provide?"], enabled: true });
  assert.equal(result.state, null);
  assert.equal(result.prompt, null);
});

test("interest and product discovery never trigger sales qualification", () => {
  for (const message of [
    "I am interested in training",
    "What training do you offer?",
    "I want to know about AI bots",
    "I need information about website development",
    "Can I see a demo?"
  ]) {
    assert.equal(hasExplicitBuyingSignal([message]), false, message);
    const result = qualifyLeadConversation({ messages: [message], enabled: true });
    assert.equal(result.state, null, message);
    assert.equal(result.prompt, null, message);
  }
});

test("explicit commercial actions activate qualification", () => {
  for (const message of [
    "Please send a quotation for an AI bot",
    "We want to hire your agency",
    "Please build an AI bot for our company",
    "I want to book training for our team",
    "What is the cost for website development?"
  ]) assert.equal(hasExplicitBuyingSignal([message]), true, message);
});

test("commercial intent starts bounded, one-question-at-a-time qualification", () => {
  const result = qualifyLeadConversation({ messages: ["Please build an AI bot for my company"], enabled: true });
  assert.equal(result.state?.facts.need, "AI Business Bot");
  assert.equal(result.state?.nextField, "timeline");
  assert.match(result.prompt || "", /When would/);
});

test("qualification accumulates facts and recommends priority follow-up", () => {
  const first = qualifyLeadConversation({ messages: ["Please build a website for my company"], enabled: true });
  const result = qualifyLeadConversation({
    messages: ["Please build a website for my company", "Timeline is next month", "Budget is INR 80,000", "Location: Pune", "I am the owner"],
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
    messages: ["Please build a website for my company", "Timeline is next month", "Budget is INR 80,000", "Location: Pune", "I am the owner"],
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

test("qualification replaces a trailing generic offer so the visitor receives one question", () => {
  const answer = appendQualificationPrompt("AI training is available for business teams.\n\nWould you like the booking link?", "When would you like to begin?");
  assert.equal(answer, "AI training is available for business teams.\n\nWhen would you like to begin?");
  assert.equal((answer.match(/\?/g) || []).length, 1);
});

test("qualification removes model discovery questions before adding its one governed question", () => {
  const answer = appendQualificationPrompt(
    "I can help arrange a consultation. Could you share your preferred service, location, budget and timeline? Also, may we contact you?",
    "What outcome or service would you like help with?"
  );
  assert.equal(answer, "I can help arrange a consultation.\n\nWhat outcome or service would you like help with?");
  assert.equal((answer.match(/\?/g) || []).length, 1);
});

test("consented callback accepts only a plausible mobile number", () => {
  assert.equal(normalizeConsentedLeadPhone("+91 98765 43210"), "+91 98765 43210");
  assert.equal(normalizeConsentedLeadPhone("owner@example.com"), null);
  assert.equal(normalizeConsentedLeadPhone("call me 1234567"), null);
});

test("qualification scoring remains internal and a failed answer cannot ask the next sales question", () => {
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  const route = readFileSync("app/api/public/website-bot/[slug]/route.ts", "utf8");
  assert.doesNotMatch(widget, /Enquiry profile|qualification\.progress|qualification\.tier/);
  assert.match(route, /qualification: qualification\.state \? \{ contactEligible:/);
  assert.doesNotMatch(route, /qualification\.state\.score, tier:/);
  assert.match(route, /qualification\.state && hasVerifiedAnswer/);
});
