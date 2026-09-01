import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyRazorpayCheckoutSignature } from "../../lib/razorpay-billing";
import { BILLING_PLAN_CATALOGUE } from "../../lib/billing-super-admin";

test("AI Bot paid plans match the public monthly and yearly pricing", () => {
  const monthly = BILLING_PLAN_CATALOGUE.find((plan) => plan.code === "AI_STARTER_MONTHLY");
  const yearly = BILLING_PLAN_CATALOGUE.find((plan) => plan.code === "AI_STARTER_YEARLY");
  assert.equal(monthly?.amountPaisa, 49_900);
  assert.equal(monthly?.billingInterval, "MONTHLY");
  assert.equal(yearly?.amountPaisa, 499_900);
  assert.equal(yearly?.billingInterval, "YEARLY");
  assert.equal(monthly?.limits.campaigns, 0);
  assert.equal(yearly?.limits.campaigns, 0);
});

test("Razorpay checkout signature accepts the signed order-payment pair and rejects tampering", () => {
  const previousId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
  process.env.RAZORPAY_KEY_SECRET = "fixture_secret";
  try {
    const orderId = "order_fixture";
    const paymentId = "pay_fixture";
    const signature = createHmac("sha256", "fixture_secret").update(`${orderId}|${paymentId}`).digest("hex");
    assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature }), true);
    assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId: "pay_changed", signature }), false);
  } finally {
    if (previousId === undefined) delete process.env.RAZORPAY_KEY_ID; else process.env.RAZORPAY_KEY_ID = previousId;
    if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET; else process.env.RAZORPAY_KEY_SECRET = previousSecret;
  }
});
