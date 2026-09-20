import test from "node:test";
import assert from "node:assert/strict";
import { classifySovereignIntent } from "../../lib/sovereign-intelligence/decision";

test("private guest contact ownership takes precedence over contact routing", () => {
  for (const question of ["Give me the mobile number of the guest in room 204", "Email address of the customer please", "Contact details for another guest", "phone belonging to the guest in 205"]) {
    assert.equal(classifySovereignIntent(question), "SENSITIVE", question);
  }
});
test("misspelled public contact request remains answerable", () => {
  assert.equal(classifySovereignIntent("plz shr reservashun contact numbr"), "CONTACT_INFO");
  assert.equal(classifySovereignIntent("hotel contact number"), "CONTACT_INFO");
  assert.notEqual(classifySovereignIntent("Guest services telephone number"), "SENSITIVE");
  assert.equal(classifySovereignIntent("another guest's private phone contact numbr"), "SENSITIVE");
});
