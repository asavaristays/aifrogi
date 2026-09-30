export const WEBSITE_SOURCE_TERMS_VERSION = "2026-09-28";

export type WebsiteSourceConsentRecord = {
  organizationId: string;
  propertyId: string;
  sourceUrl: string;
  status: "TRIAL_AUTHORIZED" | "POST_TRIAL_APPROVED" | "REVOKED";
  termsVersion: string;
  trialAuthorizedAt: Date;
  trialExpiresAt: Date;
  postTrialApprovedAt: Date | null;
  postTrialApprovedBy: string | null;
  postTrialMethod: "EMAIL" | "SIGNED_LETTER" | null;
  approvalEvidenceRef: string | null;
  revokedAt: Date | null;
};

export type WebsiteSourceAuthorization = {
  allowed: boolean;
  phase: "LEGACY" | "TRIAL" | "POST_TRIAL" | "DENIED";
  code: "LEGACY_NOT_ENFORCED" | "AUTHORIZED_TRIAL" | "AUTHORIZED_POST_TRIAL" | "MISSING" | "MISMATCH" | "EXPIRED_REVIEW_REQUIRED" | "REVOKED" | "UNREADABLE";
};

function canonicalSource(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported website source protocol.");
  url.hash = "";
  url.username = "";
  url.password = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

/** Pure, fail-closed decision used by crawl, refresh and serving adapters. */
export function evaluateWebsiteSourceAuthorization(input: {
  organizationId: string;
  propertyId: string;
  sourceUrl: string;
  consent: WebsiteSourceConsentRecord | null | undefined;
  now?: Date;
  readError?: boolean;
}): WebsiteSourceAuthorization {
  if (input.readError) return { allowed: false, phase: "DENIED", code: "UNREADABLE" };
  const consent = input.consent;
  if (!consent) return { allowed: false, phase: "DENIED", code: "MISSING" };
  let sourceMatches = false;
  try { sourceMatches = canonicalSource(consent.sourceUrl) === canonicalSource(input.sourceUrl); } catch { return { allowed: false, phase: "DENIED", code: "MISMATCH" }; }
  if (consent.organizationId !== input.organizationId || consent.propertyId !== input.propertyId || !sourceMatches || consent.termsVersion !== WEBSITE_SOURCE_TERMS_VERSION) {
    return { allowed: false, phase: "DENIED", code: "MISMATCH" };
  }
  if (consent.status === "REVOKED" || consent.revokedAt) return { allowed: false, phase: "DENIED", code: "REVOKED" };
  const now = input.now || new Date();
  if (now <= consent.trialExpiresAt && consent.status === "TRIAL_AUTHORIZED") return { allowed: true, phase: "TRIAL", code: "AUTHORIZED_TRIAL" };
  const writtenApprovalComplete = consent.status === "POST_TRIAL_APPROVED" && consent.postTrialApprovedAt && consent.postTrialApprovedBy?.trim() && consent.postTrialMethod && consent.approvalEvidenceRef?.trim();
  if (writtenApprovalComplete) return { allowed: true, phase: "POST_TRIAL", code: "AUTHORIZED_POST_TRIAL" };
  return { allowed: false, phase: "DENIED", code: "EXPIRED_REVIEW_REQUIRED" };
}
