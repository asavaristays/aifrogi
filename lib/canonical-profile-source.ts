import { createHash } from "node:crypto";
import { canonicalJson } from "@/lib/bot-machine-policy";

export type PublicProfileFacts = {
  businessName: string;
  publicEmail: string | null;
  publicPhone: string | null;
  publicAddress: string | null;
  publicBusinessHours: string | null;
  timezone: string;
  industry: string | null;
};

function text(value: string | null | undefined) {
  const normalized = value?.normalize("NFC").replace(/\s+/g, " ").trim();
  return normalized || null;
}

/** Produces the exact public profile artifact admitted as a FORM release member. */
export function buildCanonicalProfileSource(input: PublicProfileFacts & { propertyId: string; approvedBy: string; approvedAt: string }) {
  if (!input.propertyId.trim()) throw new Error("PROFILE_PROPERTY_REQUIRED");
  if (!input.approvedBy.trim()) throw new Error("PROFILE_APPROVER_REQUIRED");
  if (!Number.isFinite(Date.parse(input.approvedAt))) throw new Error("PROFILE_APPROVAL_TIME_INVALID");
  if (!text(input.businessName)) throw new Error("PROFILE_BUSINESS_NAME_REQUIRED");
  try { new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format(); } catch { throw new Error("PROFILE_TIMEZONE_INVALID"); }
  const facts = {
    businessName: text(input.businessName)!,
    publicEmail: text(input.publicEmail)?.toLowerCase() ?? null,
    publicPhone: text(input.publicPhone),
    publicAddress: text(input.publicAddress),
    publicBusinessHours: text(input.publicBusinessHours),
    timezone: input.timezone,
    industry: text(input.industry),
  };
  const canonicalPayload = canonicalJson({ schemaVersion: 1, propertyId: input.propertyId, facts, approvedBy: input.approvedBy.trim().toLowerCase(), approvedAt: new Date(input.approvedAt).toISOString() });
  return {
    sourceType: "FORM" as const,
    canonicalIdentity: `profile:${input.propertyId}`,
    canonicalIdentityHash: createHash("sha256").update(`profile:${input.propertyId}`).digest("hex"),
    versionId: createHash("sha256").update(canonicalPayload).digest("hex"),
    contentDigest: createHash("sha256").update(canonicalJson(facts)).digest("hex"),
    canonicalPayload,
    facts,
  };
}
