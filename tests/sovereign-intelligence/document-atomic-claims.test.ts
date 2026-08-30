import assert from "node:assert/strict";
import test from "node:test";
import { stageAtomicClaims } from "../../lib/services/knowledge-document-service";
import { validateAtomicClaim } from "../../lib/knowledge-verification";

test("CSV intake produces separate tagged atomic claim suggestions", () => {
  const csv = [
    "question,answer,category",
    'What is the consultation fee?,"Rs. 1,500 per consultation",Clinic',
    "What are the opening hours?,Monday to Saturday from 9 AM to 6 PM,Clinic",
    "What is the cancellation policy?,Cancel at least 24 hours before the appointment,Clinic",
    "How do I book?,Use the website appointment form or request human assistance,Clinic",
    "How is personal information handled?,Contact information is used only for the appointment enquiry,Clinic"
  ].join("\n");
  const claims = stageAtomicClaims(csv, "text/csv");
  assert.equal(claims.length, 5);
  assert.equal(claims[0].claimType, "PRICE");
  assert.equal(claims[0].currency, "INR");
  assert.equal(claims[1].claimType, "SCHEDULE");
  assert.equal(claims[2].claimType, "POLICY");
  assert.ok(claims.every((claim) => validateAtomicClaim(claim).valid), JSON.stringify(claims));
});

test("JSON intake recognizes question and approved-answer fields", () => {
  const claims = stageAtomicClaims(JSON.stringify({ claims: [
    { customer_question: "Which rooms are available?", approved_answer: "Deluxe and family rooms may be requested subject to live confirmation.", domain: "Rooms" },
    { customer_question: "What is check-in time?", approved_answer: "Standard check-in begins at 2 PM.", domain: "Stay policy" }
  ] }), "application/json");
  assert.equal(claims.length, 2);
  assert.equal(claims[0].category, "Rooms");
});

test("unstructured text stages explicit Q/A and labelled facts without publishing", () => {
  const claims = stageAtomicClaims("Question: What support is available?\nAnswer: Human support is available for issues requiring judgment.\nRefund policy: Approved refunds are reviewed by the business team.", "text/plain");
  assert.equal(claims.length, 2);
  assert.ok(claims.some((claim) => claim.claimType === "POLICY"));
});

test("ambiguous narrative produces no invented claims", () => {
  const claims = stageAtomicClaims("Our company has a long history. We care deeply about every customer and always aim to improve.", "text/plain");
  assert.deepEqual(claims, []);
});
