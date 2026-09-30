import assert from "node:assert/strict";
import test from "node:test";
import { BOT_CONSTITUTION_VERSION, enforceConstitutionalAnswerStyle, formatOfficeLocations } from "../../lib/bot-constitution-boundary";

test("constitution version is explicit", () => {
  assert.equal(BOT_CONSTITUTION_VERSION, "1.1");
});

test("removes an unsolicited sales question after a complete factual answer", () => {
  assert.equal(
    enforceConstitutionalAnswerStyle("The service includes automation and training. Would you like details on a specific service?"),
    "The service includes automation and training."
  );
});

test("does not alter a factual question embedded inside the answer", () => {
  assert.equal(
    enforceConstitutionalAnswerStyle("The discovery step asks: What outcome should the project achieve? The proposal follows discovery."),
    "The discovery step asks: What outcome should the project achieve? The proposal follows discovery."
  );
});

test("formats locations without claiming that the bot is located there", () => {
  assert.equal(formatOfficeLocations(["Goa 403512", "Gurgaon 122003"]), "The offices are located at:\nGoa 403512 · Gurgaon 122003");
});
