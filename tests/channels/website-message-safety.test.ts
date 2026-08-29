import assert from "node:assert/strict";
import test from "node:test";
import { guardWebsiteVisitorMessage } from "../../lib/website-message-safety";

test("ordinary business questions remain available to governed intelligence", () => {
  const result = guardWebsiteVisitorMessage("Can you build an AI assistant for our hotel website?");
  assert.equal(result.blocked, false);
});

test("passwords, OTPs, and card-like values are withheld before AI and storage", () => {
  for (const message of ["password: Secret123", "OTP 481922", "card 4111 1111 1111 1111"]) {
    const result = guardWebsiteVisitorMessage(message);
    assert.equal(result.blocked, true);
    assert.doesNotMatch(result.storageText, /Secret123|481922|4111/);
    assert.match(result.answer || "", /did not process or retain/i);
  }
});
