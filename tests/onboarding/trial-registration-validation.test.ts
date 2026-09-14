import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRegistrationMobile, validateTrialIdentity } from "../../lib/trial-registration-validation";

test("trial registration rejects placeholder identities and temporary email", () => {
  assert.match(validateTrialIdentity({ companyName: "Dummy", ownerName: "Real Owner", ownerEmail: "owner@business.in", ownerMobile: "+919876543211" }) || "", /real business name/);
  assert.match(validateTrialIdentity({ companyName: "Real Business", ownerName: "Test", ownerEmail: "owner@business.in", ownerMobile: "+919876543211" }) || "", /real account owner/);
  assert.match(validateTrialIdentity({ companyName: "Real Business", ownerName: "Real Owner", ownerEmail: "owner@mailinator.com", ownerMobile: "+919876543211" }) || "", /genuine email/);
  assert.match(validateTrialIdentity({ companyName: "Real Business", ownerName: "Real Owner", ownerEmail: "test+beta@business.in", ownerMobile: "+919876543211" }) || "", /genuine email/);
  assert.match(validateTrialIdentity({ companyName: "Real Business", ownerName: "Real Owner", ownerEmail: "owner@business.in", ownerMobile: "1111111111" }) || "", /genuine mobile/);
});

test("trial registration accepts genuine identity with or without a website", () => {
  assert.equal(validateTrialIdentity({ companyName: "Acme Services", ownerName: "Asha Mehta", ownerEmail: "asha@gmail.com", ownerMobile: "+919876543211" }), null);
  assert.equal(validateTrialIdentity({ companyName: "Acme Services", ownerName: "Asha Mehta", ownerEmail: "asha@acme.in", ownerMobile: "+919876543211", website: "https://acme.in" }), null);
  assert.match(validateTrialIdentity({ companyName: "Acme Services", ownerName: "Asha Mehta", ownerEmail: "asha@acme.in", ownerMobile: "+919876543211", website: "https://example.com" }) || "", /real public business website/);
});

test("mobile identity normalization is deterministic", () => {
  assert.equal(normalizeRegistrationMobile("+91 74105-82898"), "917410582898");
});
