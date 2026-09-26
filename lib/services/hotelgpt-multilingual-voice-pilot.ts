import type { ConfirmedVoiceInput } from "@/lib/hotelgpt-voice-intake";
import { formatPublicPhoneForDisplay } from "@/lib/public-phone-format";
import { detectHotelGuestLanguage, localizeVerifiedContactAnswer, requestedPublicContactFields, requestsPrivateGuestContact, type HotelGuestLanguage } from "@/lib/hotelgpt-multilingual-intent";

type PublicHotelProfile = {
  publicPhone?: string | null;
  publicEmail?: string | null;
  website?: string | null;
  publicAddress?: string | null;
  publicBusinessHours?: string | null;
};

function enabledSlugs() {
  return new Set((process.env.HOTELGPT_MULTILINGUAL_VOICE_PILOT_SLUGS || "").split(",").map(value => value.trim()).filter(Boolean));
}

export function multilingualVoicePilotEnabled(slug: string, allowlist = enabledSlugs()) {
  return allowlist.has(slug);
}

export function resolveMultilingualVoicePilot(input: {
  slug: string;
  businessName: string;
  voice: ConfirmedVoiceInput;
  profile: PublicHotelProfile;
  allowlist?: Set<string>;
}) {
  if (!multilingualVoicePilotEnabled(input.slug, input.allowlist) || requestsPrivateGuestContact(input.voice.transcript)) return null;
  const fields = requestedPublicContactFields(input.voice.transcript);
  if (!fields.length) return null;
  const details = [
    fields.includes("phone") && input.profile.publicPhone ? `Phone: ${formatPublicPhoneForDisplay(input.profile.publicPhone)}` : null,
    fields.includes("email") && input.profile.publicEmail ? `Email: ${input.profile.publicEmail}` : null,
    fields.includes("website") && input.profile.website ? `Website: ${input.profile.website}` : null,
    fields.includes("address") && input.profile.publicAddress ? `Address: ${input.profile.publicAddress}` : null,
    fields.includes("hours") && input.profile.publicBusinessHours ? `Business hours: ${input.profile.publicBusinessHours}` : null
  ].filter((value): value is string => Boolean(value));
  if (details.length !== fields.length) return null;
  const selectedLanguage: HotelGuestLanguage = input.voice.languageCode === "hi-IN" ? "hi" : input.voice.languageCode === "ru-RU" ? "ru" : detectHotelGuestLanguage(input.voice.transcript);
  const localized = localizeVerifiedContactAnswer(selectedLanguage, input.businessName, details);
  return {
    answer: localized || `You can contact ${input.businessName} using:\n${details.join("\n")}`,
    fields,
    language: selectedLanguage
  };
}
