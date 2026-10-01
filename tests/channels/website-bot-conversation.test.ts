import assert from "node:assert/strict";
import test from "node:test";
import { emojiAcknowledgement, websiteBotClarification } from "../../lib/website-bot-conversation";

test("business clarification does not advertise hotel topics", () => {
  assert.match(websiteBotClarification("Webtechnosys", "BUSINESS"), /services, products, contact details/);
  assert.doesNotMatch(websiteBotClarification("Webtechnosys"), /rooms|reservations|weddings/);
  assert.match(websiteBotClarification("Hotel", "STAY"), /rooms, facilities/);
});
test("social emoji accepts variation selectors, skin tone and repetitions", () => {
  for (const value of ["❤️", "❤", "😍"]) assert.match(emojiAcknowledgement(value)!, /Thank you/);
  for (const value of ["👍", "👍🏽", "👍 👍", "✅"]) {
    assert.match(emojiAcknowledgement(value)!, /Thanks/);
    assert.doesNotMatch(emojiAcknowledgement(value)!, /booked|confirmed|payment|callback/);
  }
  assert.match(emojiAcknowledgement("👎")!, /clarify or correct/);
});
test("mixed text, mixed signals and unsupported symbols retain normal routing", () => {
  for (const value of ["Hello 😊", "👍 book a room", "👍👎", "🏨", "📅", "", "!!!"]) assert.equal(emojiAcknowledgement(value), null);
});
