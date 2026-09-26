export const HOTELGPT_VOICE_LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ru-RU", label: "Russian" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "es-ES", label: "Spanish" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese" },
  { code: "ar-SA", label: "Arabic" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ja-JP", label: "Japanese" }
] as const;

export type HotelVoiceLanguageCode = typeof HOTELGPT_VOICE_LANGUAGES[number]["code"];

export type ConfirmedVoiceInput = {
  confirmed: true;
  languageCode: HotelVoiceLanguageCode;
  languageLabel: string;
  transcript: string;
};

export function normalizeConfirmedVoiceInput(value: unknown, message: string): ConfirmedVoiceInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const language = HOTELGPT_VOICE_LANGUAGES.find(item => item.code === input.languageCode);
  const transcript = String(input.transcript || "").trim().slice(0, 1200);
  if (input.confirmed !== true || !language || transcript.length < 2 || transcript !== message.trim()) return null;
  return { confirmed: true, languageCode: language.code, languageLabel: language.label, transcript };
}

export function formatConfirmedVoiceForStaff(input: ConfirmedVoiceInput, englishTranslation: string) {
  const translated = englishTranslation.trim();
  return [
    `Confirmed voice transcript · ${input.languageLabel}`,
    `Original: ${input.transcript}`,
    ...(translated && translated.toLocaleLowerCase() !== input.transcript.toLocaleLowerCase() ? [`English: ${translated}`] : [])
  ].join("\n");
}
