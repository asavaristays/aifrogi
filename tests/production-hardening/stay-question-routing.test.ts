import assert from "node:assert/strict";
import test from "node:test";
import { answerStayDirectoryQuestion, requestsStayBooking } from "../../lib/stay-question-routing";

const choices = [
  { destination: "Mukteshwar", stay: "Kates Adobe", url: "https://example.test/33" },
  { destination: "Coorg", stay: "Wild Cat Coorg", url: "https://example.test/38" },
  { destination: "Coorg", stay: "Sagar Estate", url: "https://example.test/39" },
  { destination: "Jodhpur", stay: "Rohet Garh", url: "https://example.test/47" }
];

test("brand name and property facts do not open booking search", () => {
  for (const question of ["What is Asavari Stays?", "What is the nightly rate for Kates Adobe?", "Do you have villas in Coorg?", "What is your cancellation policy?"]) {
    assert.equal(requestsStayBooking(question), false, question);
  }
});

test("explicit booking and availability requests still open booking search", () => {
  for (const question of ["Can I book a stay online?", "Please reserve a room in Coorg", "Are rooms available tomorrow?", "Show current rates in Coorg"]) {
    assert.equal(requestsStayBooking(question), true, question);
  }
});

test("destination answers use all approved menu choices, not prior assistant context", () => {
  assert.equal(answerStayDirectoryQuestion("Which destinations do you offer?", choices), "We offer stays in Mukteshwar, Coorg, Jodhpur.");
  assert.equal(answerStayDirectoryQuestion("Which destinations are available?", choices), "We offer stays in Mukteshwar, Coorg, Jodhpur.");
  assert.equal(answerStayDirectoryQuestion("Which destinations are available tomorrow?", choices), null);
  assert.equal(answerStayDirectoryQuestion("Do you have villas in Coorg?", choices), "We list stays in Coorg, including Wild Cat Coorg and Sagar Estate. Please check each property for its accommodation type.");
  assert.equal(answerStayDirectoryQuestion("Is parking free at Kates Adobe?", choices), null);
  assert.equal(answerStayDirectoryQuestion("Can I book in Coorg?", choices), null);
});
