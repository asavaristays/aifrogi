import assert from "node:assert/strict";
import test from "node:test";
import { decideTransactionalOutcome, mayRepeatMaterialWrite, transactionIdempotencyKey } from "../../lib/production-hardening/transaction-safety";

test("verified provider evidence is the only customer-visible success", () => {
  const result = decideTransactionalOutcome({ kind: "VERIFIED_SUCCESS", providerReference: "book_123", verificationId: "verify_123" });
  assert.equal(result.state, "CONFIRMED"); assert.equal(result.customerMaySeeSuccess, true);
});

for (const outcome of [{ kind: "TIMEOUT" }, { kind: "MALFORMED_RESPONSE" }, { kind: "UNKNOWN" }] as const) {
  test(`${outcome.kind} remains pending and cannot display success`, () => {
    const result = decideTransactionalOutcome(outcome);
    assert.equal(result.state, "PENDING_RECONCILIATION"); assert.equal(result.customerMaySeeSuccess, false); assert.equal(result.retryMode, "STATUS_READ_ONLY");
  });
}

test("provider rejection is final but never success", () => {
  const result = decideTransactionalOutcome({ kind: "VERIFIED_REJECTION", code: "PAYMENT_DECLINED" });
  assert.equal(result.state, "REJECTED"); assert.equal(result.customerMaySeeSuccess, false);
});

test("idempotency is tenant and request scoped", () => {
  assert.equal(transactionIdempotencyKey({ tenantId: "tenant-a", operation: "booking.create", clientRequestId: "request-1" }), "tenant-a:booking.create:request-1");
  assert.throws(() => transactionIdempotencyKey({ tenantId: "tenant-a", operation: "booking.create", clientRequestId: "" }));
});

test("an observed or referenced write is never blindly repeated", () => {
  assert.equal(mayRepeatMaterialWrite({}), true);
  assert.equal(mayRepeatMaterialWrite({ existingState: "PENDING" }), false);
  assert.equal(mayRepeatMaterialWrite({ providerReference: "book_123" }), false);
});
