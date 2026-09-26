import type { ConfirmedVoiceInput } from "@/lib/hotelgpt-voice-intake";

function responseText(payload: Record<string, unknown> | null) {
  if (!payload) return "";
  if (typeof payload.output_text === "string") return payload.output_text.trim();
  const output = Array.isArray(payload.output) ? payload.output : [];
  return output.flatMap(item => item && typeof item === "object" && Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [])
    .map(item => item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string" ? String((item as { text: string }).text) : "")
    .join("").trim();
}

export async function translateConfirmedVoiceForStaff(input: ConfirmedVoiceInput) {
  if (input.languageCode.startsWith("en")) return input.transcript;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Voice translation is temporarily unavailable.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_VOICE_TRANSLATION_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
        input: [
          { role: "system", content: "Translate the confirmed hotel guest request into concise operational English. Preserve every name, room number, date, time, quantity, currency amount and device identifier exactly. Do not answer, interpret, add urgency or add facts. Return only the English translation." },
          { role: "user", content: `Source language: ${input.languageLabel} (${input.languageCode})\nConfirmed transcript:\n${input.transcript}` }
        ],
        max_output_tokens: 300
      })
    });
    if (!response.ok) throw new Error(`Voice translation failed (${response.status}).`);
    const translated = responseText(await response.json().catch(() => null) as Record<string, unknown> | null);
    if (!translated || translated.length > 1800) throw new Error("Voice translation returned an invalid result.");
    return translated;
  } finally {
    clearTimeout(timeout);
  }
}
