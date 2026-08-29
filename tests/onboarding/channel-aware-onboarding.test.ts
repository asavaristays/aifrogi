import assert from "node:assert/strict";
import test from "node:test";
import { getOnboardingGuidance } from "../../lib/onboarding-guidance";

const verifiedBusiness = {
  status: "ACTIVE",
  plan: "TRIAL",
  ownerMobile: "+919999999999",
  businessAddress: "Goa, India",
  website: "https://example.com",
  onboarding: {
    currentStep: 2,
    progressPercent: 40,
    lifecycleStatus: "KYC_APPROVED",
    kycStatus: "APPROVED",
    phoneNumber: null,
    facebookStatus: "NOT_CONNECTED",
    metaStatus: "NOT_STARTED"
  }
};

test("website AI Bot bypasses phone and Meta onboarding", () => {
  const guidance = getOnboardingGuidance({
    ...verifiedBusiness,
    botProfile: { channels: ["WEBSITE"], status: "CONFIGURED" }
  });

  assert.equal(guidance.step, 6);
  assert.equal(guidance.title, "Build approved business intelligence");
  assert.match(guidance.supportNote, /grounded answer/i);
});

test("WhatsApp Bot requires the business phone after verification", () => {
  const guidance = getOnboardingGuidance({
    ...verifiedBusiness,
    botProfile: { channels: ["WHATSAPP"], status: "CONFIGURED" }
  });

  assert.equal(guidance.step, 3);
  assert.equal(guidance.title, "Add the WhatsApp number");
});

test("unconfigured website bot asks for bot design instead of Meta setup", () => {
  const guidance = getOnboardingGuidance({
    ...verifiedBusiness,
    botProfile: { channels: ["WEBSITE"], status: "DRAFT" }
  });

  assert.equal(guidance.step, 2);
  assert.equal(guidance.title, "Design your AI Business Bot");
});
