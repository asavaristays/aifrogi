import test from "node:test";
import assert from "node:assert/strict";
import { assertTypesafeStagingEligible, evaluateTypesafePromotion, type TypesafePromotionEvidence } from "../../lib/typesafe-promotion-gates";

const accepted: TypesafePromotionEvidence = {
  liveObservations: 30, unavailable: 1, p95Ms: 1400, humanReviewedLiveDecisions: 30,
  crossTenantRegressions: 0, durableQuotaVerified: true, disableVerified: true, failureFallbackVerified: true,
  synthetic: { total: 40, passed: 38, independentlyReviewed: true, unauthorizedActionRegressions: 0, privateDataRegressions: 0, supportedLanguageFailures: 0 }
};

test("all documented thresholds permit staging review without activating routing", () => {
  const result = assertTypesafeStagingEligible(accepted);
  assert.equal(result.eligibleForStagingReview, true);
  assert.equal(result.syntheticAccuracy, 95);
});

test("zero or incomplete evidence fails closed", () => {
  const result = evaluateTypesafePromotion({ ...accepted, liveObservations: 0, unavailable: 0, p95Ms: null, humanReviewedLiveDecisions: 0, synthetic: null });
  assert.equal(result.eligibleForStagingReview, false);
  assert.equal(result.unavailableRate, 0);
  assert.throws(() => assertTypesafeStagingEligible({ ...accepted, liveObservations: 0 }), /live-sample/);
});

test("each safety, quality and operational boundary independently blocks promotion", () => {
  const failures: TypesafePromotionEvidence[] = [
    { ...accepted, unavailable: 2 },
    { ...accepted, p95Ms: 1501 },
    { ...accepted, crossTenantRegressions: 1 },
    { ...accepted, disableVerified: false },
    { ...accepted, synthetic: { ...accepted.synthetic!, passed: 37 } },
    { ...accepted, synthetic: { ...accepted.synthetic!, independentlyReviewed: false } },
    { ...accepted, synthetic: { ...accepted.synthetic!, unauthorizedActionRegressions: 1 } },
    { ...accepted, synthetic: { ...accepted.synthetic!, privateDataRegressions: 1 } },
    { ...accepted, synthetic: { ...accepted.synthetic!, supportedLanguageFailures: 1 } }
  ];
  for (const evidence of failures) assert.equal(evaluateTypesafePromotion(evidence).eligibleForStagingReview, false);
});
